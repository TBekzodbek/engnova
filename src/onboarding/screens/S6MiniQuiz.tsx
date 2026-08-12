/**
 * S6 — 3-question mini-quiz. Only reached when S5 → "unsure". Grammar-cloze,
 * one A1/A2, one B1, one B2. Result → verdict band on S7.
 *
 * Scoring: 3/3 → B2; 2/3 → B1; 1/3 → A2; 0/3 → A1. Rough but the point is
 * theatre, not diagnosis (research report §6 rationale).
 */
import { useState } from 'react';
import Shell from '../Shell';
import { Eyebrow, Headline, Card, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { LevelBand } from '../state';

interface Question {
    id:      1 | 2 | 3;
    /** Which option key is the correct answer. */
    correct: 'o1' | 'o2' | 'o3' | 'o4';
}
const QUESTIONS: Question[] = [
    { id: 1, correct: 'o2' },   // "What is your name?"
    { id: 2, correct: 'o2' },   // "If I had more time..."
    { id: 3, correct: 'o3' },   // "which was submitted..."
];

function scoreToBand(correct: number): LevelBand {
    if (correct === 3) return 'B2';
    if (correct === 2) return 'B1';
    if (correct === 1) return 'A2';
    return 'A1';
}

interface Props {
    onComplete: (result: { correct: number; total: 3; verdict: LevelBand }) => void;
    onBack: () => void;
}

export default function S6MiniQuiz({ onComplete, onBack }: Props) {
    const { t } = useI18n();
    const [idx, setIdx]     = useState(0);
    const [answers, setAns] = useState<Record<1 | 2 | 3, 'o1' | 'o2' | 'o3' | 'o4' | null>>(
        { 1: null, 2: null, 3: null }
    );
    const q = QUESTIONS[idx]!;
    const picked = answers[q.id];

    const advance = () => {
        if (idx < QUESTIONS.length - 1) {
            setIdx(idx + 1);
        } else {
            const correct = QUESTIONS.filter((qq) => answers[qq.id] === qq.correct).length;
            onComplete({ correct, total: 3, verdict: scoreToBand(correct) });
        }
    };
    const back = () => {
        if (idx > 0) setIdx(idx - 1);
        else onBack();
    };

    // Cast option keys / stems for the dynamic i18n lookups.
    const stemKey = `onb.s6.q${q.id}.stem` as Parameters<typeof t>[0];

    return (
        <Shell
            step={6}
            onSkip={back}
            skipLabel={t('onb.back')}
            cta={
                <PrimaryButton onClick={advance} disabled={picked == null}>
                    {idx === QUESTIONS.length - 1 ? t('onb.next') : t('onb.next')}
                </PrimaryButton>
            }
        >
            <Eyebrow>
                {t('onb.s6.eyebrow')} · {t('onb.s6.progress', { n: String(idx + 1) })}
            </Eyebrow>
            <Headline>{t(stemKey)}</Headline>
            <div className="onb-stack">
                {(['o1', 'o2', 'o3', 'o4'] as const).map((o) => (
                    <Card
                        key={o}
                        label={t(`onb.s6.q${q.id}.${o}` as Parameters<typeof t>[0])}
                        selected={picked === o}
                        onClick={() => setAns({ ...answers, [q.id]: o })}
                    />
                ))}
            </div>
        </Shell>
    );
}
