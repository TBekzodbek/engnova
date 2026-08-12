/**
 * Onboarding state — the answers the 12-screen flow collects.
 *
 * Persisted to localStorage on each mutation so a user who backgrounds the
 * app mid-flow can resume from where they left off. Also feeds the paywall
 * screen (S12) which reads goal + deadline + verdict verbatim.
 *
 * The state is a discriminated union of the possible screens the user has
 * completed — we don't store screens they haven't reached, so replaying from
 * localStorage always shows the correct next screen.
 */
import type { Track } from '../lib/tracks';

export type Goal =
    | 'ielts'
    | 'dtm'
    | 'work'
    | 'travel'
    | 'zero';

export type Deadline =
    | 'in1'
    | 'in3'
    | 'in6'
    | 'later';

export type SelfLevel =
    | 'a0'   // absolute beginner
    | 'a1'   // basic words
    | 'a2'   // everyday conversation
    | 'b1'   // fluent-ish
    | 'unsure';   // triggers mini-quiz

export type LevelBand = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type Commitment =
    | 'm5'
    | 'm10'
    | 'm15'
    | 'm20';

export interface OnboardingAnswers {
    goal?:       Goal;
    deadline?:   Deadline;
    selfLevel?:  SelfLevel;
    /** Result of the 3-question mini-quiz (S6) — only present if user picked "unsure". */
    quiz?:       { correct: number; total: 3; verdict: LevelBand };
    /** Final verdict shown on S7; either from selfLevel (mapped) or quiz. */
    verdict?:    LevelBand;
    /** Confirmed track from S8 (recommendation, or explicit override). */
    track?:      Track;
    commitment?: Commitment;
}

const KEY = 'engnova.onboarding.answers.v1';

export function loadAnswers(): OnboardingAnswers {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch {
        return {};
    }
}

export function saveAnswers(a: OnboardingAnswers): void {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* quota / safari-private */ }
}

export function clearAnswers(): void {
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

/** Map self-reported level to a CEFR band (no quiz needed). */
export function selfLevelToBand(s: SelfLevel): LevelBand | null {
    switch (s) {
        case 'a0': return 'A0';
        case 'a1': return 'A1';
        case 'a2': return 'A2';
        case 'b1': return 'B1';
        case 'unsure': return null;
    }
}

/** Goal → recommended track. IELTS goal picks IELTS; anything else picks CEFR. */
export function goalToTrack(g: Goal): Track {
    return g === 'ielts' ? 'ielts' : 'cefr';
}

/** Next-band aspiration for the paywall promise ("you'll reach {band} in {timeframe}"). */
export function nextBand(current: LevelBand): LevelBand {
    const order: LevelBand[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
    const i = order.indexOf(current);
    if (i < 0 || i === order.length - 1) return 'C1';
    return order[i + 1]!;
}

/**
 * Where in the 12-step flow should we resume? Reads the answers and returns
 * the first screen the user has NOT yet completed. Called by OnboardingFlow
 * on mount so a backgrounded user picks up exactly where they left off.
 */
export function firstIncompleteStep(a: OnboardingAnswers): number {
    // Screen 1 (language) is handled by the existing LanguageChip / i18n
    // module — it's not gated on onboarding answers.
    if (a.goal       == null) return 3;   // S3: goal
    if (a.deadline   == null) return 4;   // S4: deadline
    if (a.selfLevel  == null) return 5;   // S5: self-level
    if (a.selfLevel === 'unsure' && a.quiz == null) return 6;   // S6: mini-quiz
    if (a.verdict    == null) return 7;   // S7: verdict reveal
    if (a.track      == null) return 8;   // S8: track confirmation
    // S9 (social proof) has no answer — always skippable in resume flow
    if (a.commitment == null) return 10;  // S10: commitment
    return 11;   // done — proceed to login
}
