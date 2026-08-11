/**
 * Engnova shell i18n
 * ──────────────────
 * Small, dependency-free i18n. UZ default; RU & EN share the same key spine.
 * Persists via localStorage (Capacitor's WebView storage survives cold-starts,
 * so no @capacitor/preferences dep needed for v1 — can be upgraded later).
 *
 * A `{placeholder}` in a string is replaced by the matching key in `vars`.
 *
 * Usage:
 *   const { t, lang, setLang } = useI18n();
 *   t('chooser.hero')
 *   t('error.body', { trackName: 'CEFR Academy' })
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import uz from './uz.json';
import ru from './ru.json';
import en from './en.json';

export type Lang = 'uz' | 'ru' | 'en';

// All three files MUST share the exact same key spine. TS will yell if any drift.
type Dict = typeof uz;
type Key = keyof Dict;

const TABLES: Record<Lang, Dict> = { uz, ru: ru as Dict, en: en as Dict };

const STORAGE_KEY = 'engnova.lang';
const DEFAULT_LANG: Lang = 'uz';

function readSaved(): Lang {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === 'uz' || v === 'ru' || v === 'en' ? v : DEFAULT_LANG;
    } catch {
        return DEFAULT_LANG;
    }
}

function persist(l: Lang): void {
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode — non-fatal */ }
}

function fill(template: string, vars?: Record<string, string | number>): string {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

interface I18nCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: Key, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(readSaved);

    // Mirror the current language onto <html lang> so screen readers and the
    // browser's built-in language handling agree with our shell UI.
    useEffect(() => {
        try { document.documentElement.lang = lang; } catch { /* SSR-safe */ }
    }, [lang]);

    const setLang = useCallback((l: Lang) => {
        persist(l);
        setLangState(l);
    }, []);

    const t = useCallback(
        (key: Key, vars?: Record<string, string | number>): string => {
            const table = TABLES[lang];
            const raw = table[key];
            if (typeof raw !== 'string') {
                // Missing key = ship the key literal so the gap is visible in dev.
                return key;
            }
            return fill(raw, vars);
        },
        [lang],
    );

    return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
    const v = useContext(Ctx);
    if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
    return v;
}
