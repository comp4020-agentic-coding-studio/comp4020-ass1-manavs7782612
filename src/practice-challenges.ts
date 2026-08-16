import type { VlookupError, VlookupOutcome } from "./vlookup";

export interface PracticeChallenge {
  title: string;
  prompt: string;
  hint: string;
  expected: { outcome: "value" | "error"; value?: string; error?: VlookupError };
}

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  {
    title: "Find a category",
    prompt: "Build a formula that looks up order 5004 and returns its Category.",
    hint: "Use the whole table (A2:E7), look up 5004, and count across to the Category column (column index 3).",
    expected: { outcome: "value", value: "Furniture" },
  },
  {
    title: "Look up a missing order",
    prompt: "Look up order 5099, which doesn't exist, with an exact match.",
    hint: "Set range lookup to FALSE and type 5099 as the lookup value — it isn't in the table, so VLOOKUP can't find it.",
    expected: { outcome: "error", error: "#N/A" },
  },
  {
    title: "Ask for a column that isn't there",
    prompt: "Pick a column index that reaches past the right edge of your chosen range.",
    hint: "If your range is A2:E7 (5 columns wide), a column index of 6 or more overflows it.",
    expected: { outcome: "error", error: "#REF!" },
  },
];

export function checkChallenge(
  challenge: PracticeChallenge,
  outcome: VlookupOutcome | null,
): { pass: boolean; message: string } {
  if (!outcome) {
    return { pass: false, message: "Set up a range and a lookup value first." };
  }

  const { expected } = challenge;
  if (expected.outcome === "value") {
    if (outcome.ok && outcome.value === expected.value) {
      return { pass: true, message: `Correct — the formula returned "${outcome.value}".` };
    }
    return {
      pass: false,
      message: outcome.ok
        ? `Not quite — that returned "${outcome.value}", not "${expected.value}".`
        : `Not quite — that returned ${outcome.error} instead of a value.`,
    };
  }

  if (outcome.ok) {
    return { pass: false, message: `Not quite — that returned "${outcome.value}" instead of ${expected.error}.` };
  }
  if (outcome.error === expected.error) {
    return { pass: true, message: `Correct — the formula returned ${outcome.error}.` };
  }
  return { pass: false, message: `Not quite — that returned ${outcome.error}, not ${expected.error}.` };
}
