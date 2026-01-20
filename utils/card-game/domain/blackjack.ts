import type { CardResponse, ScoreBreakdown } from './types';

const FACE_VALUES: Record<string, number> = {
  JACK: 10,
  QUEEN: 10,
  KING: 10,
};

function nominalValue(card: CardResponse): number[] {
  // Returns possible values for a single card (Ace => [1, 11])
  const v = card.value.toUpperCase();
  if (v === 'ACE') return [1, 11];
  if (v in FACE_VALUES) return [FACE_VALUES[v]];
  // API sometimes returns '0' code for Ten, but `value` is '10'.
  const parsed = parseInt(v, 10);
  return Number.isFinite(parsed) ? [parsed] : [0];
}

export function evaluateHand(cards: CardResponse[]): ScoreBreakdown {
  // Compute all totals considering Aces as 1 or 11, pick the best <=21 if any.
  let totals = [0];
  for (const card of cards) {
    const vals = nominalValue(card);
    const nextTotals: number[] = [];
    for (const t of totals) {
      for (const v of vals) nextTotals.push(t + v);
    }
    // This prevents duplicate totals that can arise from different paths producing the same sum.
    totals = Array.from(new Set(nextTotals));
  }

  // Best non-busting total, else the smallest (closest over 21)
  // A, A, 9 -> 11, 21, 31
  // A, A, A, 7 -> 10, 20, 30, 40
  const nonBust = totals.filter((t) => t <= 21);
  const bestValue = nonBust.length ? Math.max(...nonBust) : Math.min(...totals);

  // Soft if we could reach bestValue using an Ace as 11
  // Switching a single Ace between 11 and 1 changes the total by exactly 10.
  // So, if some combination reaches bestValue and there’s also a valid combination that totals bestValue - 10,
  // then bestValue must have counted an Ace as 11 (while the alternate used that Ace as 1)
  let isSoft = false;
  {
    // Try to reconstruct whether any combination used 11 for an Ace
    // Strategy: if there exists any total == bestValue and there exists an
    // alternative total == bestValue - 10, we infer an Ace was counted as 11.
    const set = new Set(totals);
    if (set.has(bestValue) && set.has(bestValue - 10)) isSoft = bestValue <= 21;
  }

  const isBust = bestValue > 21;
  const isNaturalBlackjack = cards.length === 2 && bestValue === 21;
  return { bestValue, isSoft, isBust, isNaturalBlackjack };
}
