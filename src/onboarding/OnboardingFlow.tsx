/**
 * OnboardingFlow — the 12-screen state machine, driven by the answers
 * saved in state.ts + firstIncompleteStep().
 *
 * Flow (research-report §5):
 *   S1  Language  →
 *   S2  Welcome   →
 *   S3  Goal      →  (routes rest of flow via goalToTrack)
 *   S4  Deadline  →
 *   S5  Level     →  if 'unsure' → S6, else → S7
 *   S6  MiniQuiz  →  writes quiz result + verdict
 *   S7  Verdict   →
 *   S8  Track     →  user confirms (or overrides) recommended track
 *   S9  Social    →
 *   S10 Commitment → onDone: mark onboardingDone, save track, transition
 *                    to LoginScreen (App.tsx handles the phase change).
 *
 * State persists to localStorage after every answer so a mid-flow app kill
 * resumes exactly where the user left off. Not perfect (native swipes
 * back through screens re-set state), but survives the common cases.
 */
import { useEffect, useState } from 'react';
import type { Track } from '../lib/tracks';
import {
    loadAnswers, saveAnswers, firstIncompleteStep,
    selfLevelToBand, goalToTrack,
    type OnboardingAnswers, type Goal, type Deadline, type SelfLevel,
    type LevelBand, type Commitment,
} from './state';
import S1Language   from './screens/S1Language';
import S2Welcome    from './screens/S2Welcome';
import S3Goal       from './screens/S3Goal';
import S4Deadline   from './screens/S4Deadline';
import S5Level      from './screens/S5Level';
import S6MiniQuiz   from './screens/S6MiniQuiz';
import S7Verdict    from './screens/S7Verdict';
import S8Track      from './screens/S8Track';
import S9Social     from './screens/S9Social';
import S10Commitment from './screens/S10Commitment';
import S11Register from './screens/S11Register';
import S12Paywall  from './screens/S12Paywall';
import './tokens.css';
import './screens/shared.css';

interface OnboardingFlowProps {
    /** Called when S12 finishes with the confirmed track. `sessionCreated`
     *  is true when S11 minted a live Supabase session (Google path, or the
     *  rare case email-verification is off); false when the user registered
     *  via email and must confirm before signing in — App routes to Login
     *  in that case, or directly to Product when true. */
    onDone: (track: Track, sessionCreated: boolean) => void;
    /** Called if user hits Skip on S2 — App.tsx sends them to the chooser
     *  (preserves the current "just let me pick a track" escape hatch). */
    onSkip: () => void;
}

export default function OnboardingFlow({ onDone, onSkip }: OnboardingFlowProps) {
    // Answers state — loaded once from localStorage, mutated in-place.
    // Every mutation also writes back via update().
    const [answers, setAnswers] = useState<OnboardingAnswers>(() => loadAnswers());
    const [step,    setStep]    = useState<number>(() => {
        // Resume where the user left off if there's any saved state.
        // Otherwise start at S1 (language).
        const a = loadAnswers();
        if (Object.keys(a).length === 0) return 1;
        return Math.max(1, firstIncompleteStep(a));
    });

    // Persist every answer update. Guarded so a no-op re-render doesn't thrash.
    useEffect(() => { saveAnswers(answers); }, [answers]);

    function update(patch: Partial<OnboardingAnswers>) {
        setAnswers((a) => ({ ...a, ...patch }));
    }
    const goTo = (n: number) => setStep(n);

    // ── S1 Language ─────────────────────────────────────────────────────
    if (step === 1) {
        return <S1Language onNext={() => goTo(2)} />;
    }
    // ── S2 Welcome ──────────────────────────────────────────────────────
    if (step === 2) {
        return <S2Welcome onNext={() => goTo(3)} onSkip={onSkip} />;
    }
    // ── S3 Goal ─────────────────────────────────────────────────────────
    if (step === 3) {
        return (
            <S3Goal
                value={answers.goal}
                onChange={(g: Goal) => update({ goal: g })}
                onNext={() => goTo(4)}
            />
        );
    }
    // ── S4 Deadline ─────────────────────────────────────────────────────
    if (step === 4) {
        return (
            <S4Deadline
                value={answers.deadline}
                onChange={(d: Deadline) => update({ deadline: d })}
                onNext={() => goTo(5)}
                onBack={() => goTo(3)}
            />
        );
    }
    // ── S5 Level self-report ────────────────────────────────────────────
    if (step === 5) {
        return (
            <S5Level
                value={answers.selfLevel}
                onChange={(l: SelfLevel) => update({ selfLevel: l })}
                onNext={() => {
                    // If user picked "unsure", route to mini-quiz. Else skip
                    // S6 and compute verdict directly from self-report.
                    if (answers.selfLevel === 'unsure') {
                        goTo(6);
                    } else {
                        const band = answers.selfLevel ? selfLevelToBand(answers.selfLevel) : null;
                        // A0 selfLevel → A0 verdict, etc.
                        if (band) update({ verdict: band });
                        goTo(7);
                    }
                }}
                onBack={() => goTo(4)}
            />
        );
    }
    // ── S6 MiniQuiz (only when selfLevel === 'unsure') ──────────────────
    if (step === 6) {
        return (
            <S6MiniQuiz
                onComplete={(r) => {
                    update({ quiz: r, verdict: r.verdict });
                    goTo(7);
                }}
                onBack={() => goTo(5)}
            />
        );
    }
    // ── S7 Verdict ──────────────────────────────────────────────────────
    if (step === 7) {
        const band: LevelBand = answers.verdict ?? 'A2';   // sensible default if resumed weird
        return (
            <S7Verdict
                band={band}
                deadline={answers.deadline}
                onNext={() => goTo(8)}
            />
        );
    }
    // ── S8 Track confirmation ───────────────────────────────────────────
    if (step === 8) {
        const recommended: Track = answers.goal ? goalToTrack(answers.goal) : 'cefr';
        return (
            <S8Track
                recommended={recommended}
                onConfirm={(track: Track) => {
                    update({ track });
                    goTo(9);
                }}
                onBack={() => goTo(7)}
            />
        );
    }
    // ── S9 Social proof ─────────────────────────────────────────────────
    if (step === 9) {
        return <S9Social onNext={() => goTo(10)} onBack={() => goTo(8)} />;
    }
    // ── S10 Commitment ──────────────────────────────────────────────────
    if (step === 10) {
        return (
            <S10Commitment
                value={answers.commitment}
                onChange={(c: Commitment) => update({ commitment: c })}
                onDone={() => goTo(11)}
                onBack={() => goTo(9)}
            />
        );
    }
    // ── S11 Register ────────────────────────────────────────────────────
    if (step === 11) {
        // Must have S8's track by now — fall back to CEFR if the user
        // somehow resumed straight into S11 without S8.
        const track = answers.track ?? 'cefr';
        return (
            <S11Register
                track={track}
                verdict={answers.verdict}
                onNext={(email, sessionCreated) => {
                    update({ email, registered: sessionCreated });
                    goTo(12);
                }}
                onBack={() => goTo(10)}
            />
        );
    }
    // ── S12 Native Paywall (final) ──────────────────────────────────────
    if (step === 12) {
        const track = answers.track ?? 'cefr';
        return (
            <S12Paywall
                verdict={answers.verdict}
                commitment={answers.commitment}
                onDone={() => onDone(track, !!answers.registered)}
                onBack={() => goTo(11)}
            />
        );
    }

    // Shouldn't reach here — guard against invalid step by resetting to S1.
    return <S1Language onNext={() => goTo(2)} />;
}
