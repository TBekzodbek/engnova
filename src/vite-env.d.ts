/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CEFR_SUPABASE_URL?: string;
  readonly VITE_CEFR_SUPABASE_ANON_KEY?: string;
  readonly VITE_IELTS_SUPABASE_URL?: string;
  readonly VITE_IELTS_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
