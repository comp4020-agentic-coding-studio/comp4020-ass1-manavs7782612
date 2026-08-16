export type FormulaArg = "lookup-value" | "table-array" | "col-index" | "range-lookup";

export type ResultState = "normal" | "error";

export interface RequiredClick {
  correctCellId: string;
}

export interface StepConfig {
  title: string;
  copy: string;
  code?: string;
  progress: string;
  activeArgs: FormulaArg[];
  gridHighlights: Record<string, string>;
  dimHeaderRow?: boolean;
  colBadges?: Record<string, number>;
  result: string;
  resultState: ResultState;
  requireClick?: RequiredClick;
}

const RANGE_HIGHLIGHTS: Record<string, string> = Object.fromEntries(
  ["A", "B", "C", "D"].flatMap((col) =>
    [2, 3, 4, 5, 6].map((row) => [`${col}${row}`, "range"]),
  ),
);

const SCAN_HIGHLIGHTS: Record<string, string> = Object.fromEntries(
  [2, 3, 4, 5, 6].map((row) => [`A${row}`, "scan"]),
);

const MATCH_HIGHLIGHTS: Record<string, string> = {
  ...Object.fromEntries([2, 3, 4, 6].map((row) => [`A${row}`, "checked"])),
  A5: "match",
};

const NOMATCH_HIGHLIGHTS: Record<string, string> = Object.fromEntries(
  [2, 3, 4, 5, 6].map((row) => [`A${row}`, "nomatch"]),
);

export const STEPS: StepConfig[] = [
  {
    title: "Meet the formula",
    copy: "VLOOKUP looks up a value in the first column of a table and returns a value from another column in that same row. We'll walk through =VLOOKUP(104, A2:D6, 3, FALSE) one piece at a time.",
    progress: "Step 1 of 10",
    activeArgs: [],
    gridHighlights: {},
    result: "",
    resultState: "normal",
  },
  {
    title: "The value you're looking for",
    copy: "The first argument is the lookup value — what you want to find. Here it's 104, an Employee ID.",
    progress: "Step 2 of 10",
    activeArgs: ["lookup-value"],
    gridHighlights: {},
    result: "",
    resultState: "normal",
  },
  {
    title: "Where to search",
    copy: "The second argument is the table array — the full range VLOOKUP searches in. A2:D6 covers every data row, columns A through D. The header row isn't part of the search.",
    progress: "Step 3 of 10",
    activeArgs: ["table-array"],
    gridHighlights: RANGE_HIGHLIGHTS,
    dimHeaderRow: true,
    result: "",
    resultState: "normal",
  },
  {
    title: "Scanning the first column",
    copy: "VLOOKUP always searches the first column of the table array — column A — looking for a cell that matches the lookup value. Click the cell in column A that matches `104` to continue.",
    progress: "Step 4 of 10",
    activeArgs: ["lookup-value", "table-array"],
    gridHighlights: SCAN_HIGHLIGHTS,
    result: "",
    resultState: "normal",
    requireClick: { correctCellId: "A5" },
  },
  {
    title: "Match found",
    copy: "104 matches the Employee ID in row 5. VLOOKUP stops scanning as soon as it finds this match.",
    progress: "Step 5 of 10",
    activeArgs: ["lookup-value", "table-array"],
    gridHighlights: MATCH_HIGHLIGHTS,
    result: "",
    resultState: "normal",
  },
  {
    title: "Counting across",
    copy: "The third argument is the column index — which column in the table array to return a value from, counting from 1. 3 means the third column of A2:D6, which is column C (Department).",
    progress: "Step 6 of 10",
    activeArgs: ["col-index"],
    gridHighlights: { ...MATCH_HIGHLIGHTS, C5: "target" },
    colBadges: { A: 1, B: 2, C: 3 },
    result: "",
    resultState: "normal",
  },
  {
    title: "The answer",
    copy: "Putting it together: VLOOKUP finds 104 in row 5, moves across to column 3 of the table array, and returns the value there.",
    progress: "Step 7 of 10",
    activeArgs: ["lookup-value", "table-array", "col-index", "range-lookup"],
    gridHighlights: { ...MATCH_HIGHLIGHTS, C5: "answer" },
    colBadges: { A: 1, B: 2, C: 3 },
    result: "Engineering",
    resultState: "normal",
  },
  {
    title: "Exact vs. approximate match",
    copy: "The fourth argument is range lookup, and it's the one people get wrong. FALSE means exact match only. TRUE or leaving it out means approximate match, which requires the first column to be sorted ascending — we don't want that here.",
    progress: "Step 8 of 10",
    activeArgs: ["range-lookup"],
    gridHighlights: { ...MATCH_HIGHLIGHTS, C5: "answer" },
    colBadges: { A: 1, B: 2, C: 3 },
    result: "Engineering",
    resultState: "normal",
  },
  {
    title: "When there's no match",
    copy: "If the lookup value isn't in the first column at all — say we searched for `106` instead of 104 — VLOOKUP scans the whole column, finds nothing, and returns the #N/A error.",
    progress: "Step 9 of 10",
    activeArgs: ["lookup-value", "table-array", "col-index", "range-lookup"],
    gridHighlights: NOMATCH_HIGHLIGHTS,
    result: "#N/A",
    resultState: "error",
  },
  {
    title: "Recap",
    copy: "=VLOOKUP(104, A2:D6, 3, FALSE): find 104 in the first column, count across to column 3, require an exact match. Restart to walk through it again.",
    progress: "Step 10 of 10",
    activeArgs: ["lookup-value", "table-array", "col-index", "range-lookup"],
    gridHighlights: { ...MATCH_HIGHLIGHTS, C5: "answer" },
    colBadges: { A: 1, B: 2, C: 3 },
    result: "Engineering",
    resultState: "normal",
  },
];
