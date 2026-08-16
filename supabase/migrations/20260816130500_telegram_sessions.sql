-- Telegram Login: staging table for bot ↔ app nonce handshake.
--
-- Flow:
--   1. App generates a nonce, opens tg://resolve?...&start=login_<nonce>
--   2. Bot receives /start login_<nonce> from user
--   3. Bot asks user to share phone → user taps Share
--   4. Bot receives phone → Edge Function `telegram-auth-callback` runs
--   5. Edge Function creates/finds auth.users row, generates a magic-link
--      token via admin.generateLink, stores { email, token, phone, ... }
--      in this table keyed by nonce
--   6. App polls public.poll_telegram_session(nonce) every 2s
--   7. Once row is populated, RPC returns email + token, marks consumed
--   8. App calls supabase.auth.verifyOtp({ type: 'magiclink',
--      token_hash: <token>, email: <email> }) → session established

create table if not exists public.telegram_sessions (
    nonce           text primary key,
    -- Populated on /start:
    tg_user_id      bigint,
    -- Populated on Contact share:
    email           text,
    token           text,          -- Supabase magic-link token_hash
    tg_phone        text,
    tg_first_name   text,
    -- Bookkeeping:
    created_at      timestamptz not null default now(),
    consumed_at     timestamptz
);

comment on table  public.telegram_sessions is 'Ephemeral nonce store for Telegram-bot ↔ app login handshake. Rows expire after ~5 min.';
comment on column public.telegram_sessions.token is 'Supabase magic-link token_hash from admin.generateLink({type:magiclink}).';

create index if not exists idx_telegram_sessions_tg_user_id
    on public.telegram_sessions(tg_user_id)
    where email is null;

-- RLS: locked down. Only the RPC (SECURITY DEFINER) and the Edge Function
-- (service role) may touch this table. No direct anon/authenticated access.
alter table public.telegram_sessions enable row level security;

-- Housekeeping — purge stale rows periodically. Called opportunistically by
-- the RPC (cheap at MVP scale; if traffic grows, wire to pg_cron).
create or replace function public.purge_old_telegram_sessions()
returns void
language sql
security definer
set search_path = public
as $$
    delete from public.telegram_sessions
     where created_at < now() - interval '15 minutes';
$$;

-- Public RPC the app calls with its nonce. Returns { email, token } once the
-- bot has completed its side; null before that. Atomically marks the row
-- consumed so a repeat poll can't re-use it.
create or replace function public.poll_telegram_session(p_nonce text)
returns table(email text, token text)
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Opportunistic pruning
    perform public.purge_old_telegram_sessions();

    return query
    update public.telegram_sessions ts
       set consumed_at = now()
     where ts.nonce = p_nonce
       and ts.consumed_at is null
       and ts.email is not null
       and ts.token is not null
       and ts.created_at > now() - interval '5 minutes'
    returning ts.email, ts.token;
end;
$$;

-- Anonymous callers may execute (they must supply a nonce they generated
-- themselves — no useful data leaks without the exact nonce).
grant execute on function public.poll_telegram_session(text) to anon, authenticated;
grant execute on function public.purge_old_telegram_sessions()  to service_role;
