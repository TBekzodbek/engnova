/**
 * ConfirmDialog — a generic confirmation modal used for the switch-track
 * seatbelt. Same visual language as LanguageSheet's scrim so the shell feels
 * consistent. Escape/scrim-click cancels, primary button confirms.
 */
import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

interface Props {
    open: boolean;
    title: string;
    body: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog(props: Props) {
    const { open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel } = props;
    const primaryRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        primaryRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="confirm-scrim"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-body"
            onClick={onCancel}
        >
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h2 id="confirm-title" className="confirm-title">{title}</h2>
                <p id="confirm-body" className="confirm-body">{body}</p>
                <div className="confirm-actions">
                    <button type="button" className="confirm-btn confirm-btn-ghost" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        ref={primaryRef}
                        type="button"
                        className="confirm-btn confirm-btn-primary"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
