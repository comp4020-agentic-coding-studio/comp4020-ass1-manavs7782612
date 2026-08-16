export type VlookupError = "#N/A" | "#REF!" | "#VALUE!";
export type VlookupOutcome = { ok: true; value: string } | { ok: false; error: VlookupError };

export interface CellRange {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
}

export function columnLetter(index: number): string {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

export function columnIndexFromLetter(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
}

const RANGE_PATTERN = /^([A-Za-z]+)(\d+):([A-Za-z]+)(\d+)$/;

export function parseRange(ref: string): CellRange | null {
  const match = RANGE_PATTERN.exec(ref.trim());
  if (!match) return null;
  const [, startColLetter, startRowStr, endColLetter, endRowStr] = match;
  const startCol = columnIndexFromLetter(startColLetter);
  const endCol = columnIndexFromLetter(endColLetter);
  const startRow = Number.parseInt(startRowStr, 10);
  const endRow = Number.parseInt(endRowStr, 10);
  if (startCol > endCol || startRow > endRow) return null;
  return { startCol, endCol, startRow, endRow };
}

export function formatRange(range: CellRange): string {
  return `${columnLetter(range.startCol)}${range.startRow}:${columnLetter(range.endCol)}${range.endRow}`;
}

export interface SheetData {
  rows: readonly string[][];
}

function compareKeys(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  if (a.trim() !== "" && b.trim() !== "" && !Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return a.trim().toLowerCase().localeCompare(b.trim().toLowerCase());
}

function keysEqual(a: string, b: string): boolean {
  return compareKeys(a, b) === 0;
}

export function evaluateVlookup(
  sheet: SheetData,
  lookupValue: string,
  rangeRef: string,
  colIndex: number,
  rangeLookup: boolean,
): VlookupOutcome {
  if (colIndex < 1) return { ok: false, error: "#VALUE!" };

  const range = parseRange(rangeRef);
  if (!range) return { ok: false, error: "#REF!" };

  const width = range.endCol - range.startCol + 1;
  if (colIndex > width) return { ok: false, error: "#REF!" };

  const startIndex = range.startRow - 2;
  const endIndex = range.endRow - 2;
  const keyCol = range.startCol;
  const valueCol = range.startCol + colIndex - 1;

  if (!rangeLookup) {
    for (let i = startIndex; i <= endIndex; i++) {
      const row = sheet.rows[i];
      if (!row) continue;
      if (keysEqual(row[keyCol] ?? "", lookupValue)) {
        return { ok: true, value: row[valueCol] ?? "" };
      }
    }
    return { ok: false, error: "#N/A" };
  }

  let best: string[] | null = null;
  for (let i = startIndex; i <= endIndex; i++) {
    const row = sheet.rows[i];
    if (!row) continue;
    if (compareKeys(row[keyCol] ?? "", lookupValue) <= 0) {
      best = row;
    }
  }
  if (!best) return { ok: false, error: "#N/A" };
  return { ok: true, value: best[valueCol] ?? "" };
}
