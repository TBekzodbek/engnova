/**
 * LanguageChip — top-right chip that shows the current shell language and
 * opens the LanguageSheet on tap. Rendered inside the chooser's safe area.
 *
 * Two-letter code + chevron. NOT a gear (gear reads as "advanced settings" —
 * language isn't advanced; it's a first-run decision).
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n';
import LanguageSheet from './LanguageSheet';
import './LanguageChip.css';

export default function LanguageChip() {
    const { lang } = useI18n();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className="lang-chip"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                <span className="lang-chip-code">{lang.toUpperCase()}</span>
                <ChevronDown size={14} aria-hidden="true" />
            </button>
            <LanguageSheet open={open} onClose={() => setOpen(false)} />
        </>
    );
}
