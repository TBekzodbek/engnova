/**
 * LanguageSheet — bottom-sheet dialog that lists the three shell languages.
 * Tap a row → language changes and sheet closes. Track selection is
 * independent; language change never resets it.
 *
 * Basic focus trap: first row is focused on open, Escape closes.
 */
import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { useI18n, type Lang } from '../i18n';
import './LanguageSheet.css';

const ROWS: { code: Lang; key: 'lang.uz' | 'lang.ru' | 'lang.en' }[] = [
    { code: 'uz', key: 'lang.uz' },
    { code: 'ru', key: 'lang.ru' },
    { code: 'en', key: 'lang.en' },
];

export default function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { lang, setLang, t } = useI18n();
    const firstRowRef = useRef<HTMLButtonElement>(null);

    // Focus the first row when opened; close on Escape.
    useEffect(() => {
        if (!open) return;
        firstRowRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="lang-sheet-scrim"
            role="dialog"
            aria-modal="true"
            aria-label={t('lang.sheet.title')}
            onClick={onClose}
        >
            <div className="lang-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="lang-sheet-grip" aria-hidden="true" />
                <div className="lang-sheet-title">{t('lang.sheet.title')}</div>
                <div className="lang-sheet-rows">
                    {ROWS.map((r, i) => {
                        const active = lang === r.code;
                        return (
                            <button
                                key={r.code}
                                ref={i === 0 ? firstRowRef : undefined}
                                type="button"
                                className={`lang-sheet-row${active ? ' is-active' : ''}`}
                                onClick={() => { setLang(r.code); onClose(); }}
                            >
                                <span className="lang-sheet-code">{r.code.toUpperCase()}</span>
                                <span className="lang-sheet-label">{t(r.key)}</span>
                                {active && <Check size={18} className="lang-sheet-tick" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
