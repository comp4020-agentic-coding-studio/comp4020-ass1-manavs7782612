import { describe, expect, it } from "vitest";
import {
  columnIndexFromLetter,
  columnLetter,
  evaluateVlookup,
  formatRange,
  parseRange,
  type SheetData,
} from "./vlookup";

const EMPLOYEES: SheetData = {
  rows: [
    ["101", "Alice Chen", "Marketing", "68000"],
    ["102", "Ben Osei", "Finance", "72000"],
    ["103", "Carla Nguyen", "Engineering", "91000"],
    ["104", "Dev Patel", "Engineering", "84000"],
    ["105", "Ellie Ho", "Sales", "65000"],
  ],
};

// Table array starts at column B, row 3 — not the sheet's origin — so a
// naive implementation that always scans column A / row 2 would fail here.
const ORDERS: SheetData = {
  rows: [
    ["x0", "na", "n/a", "", ""],
    ["x1", "5001", "Widget", "10", "5"],
    ["x2", "5002", "Gadget", "20", "0"],
    ["x3", "5003", "Gizmo", "30", "8"],
    ["x4", "5004", "Furniture", "40", "3"],
    ["x5", "5005", "Doohickey", "50", "12"],
  ],
};

const ASCENDING: SheetData = {
  rows: [
    ["10", "ten"],
    ["20", "twenty"],
    ["30", "thirty"],
    ["40", "forty"],
    ["50", "fifty"],
  ],
};

describe("columnLetter / columnIndexFromLetter", () => {
  it("round-trips", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(4)).toBe("E");
    expect(columnIndexFromLetter("A")).toBe(0);
    expect(columnIndexFromLetter("e")).toBe(4);
  });
});

describe("parseRange / formatRange", () => {
  it("parses a standard range", () => {
    expect(parseRange("A2:D6")).toEqual({ startCol: 0, endCol: 3, startRow: 2, endRow: 6 });
  });

  it("parses a range not anchored at column A / row 2", () => {
    expect(parseRange("B3:E7")).toEqual({ startCol: 1, endCol: 4, startRow: 3, endRow: 7 });
  });

  it("rejects malformed refs", () => {
    expect(parseRange("B2E7")).toBeNull();
    expect(parseRange("not a range")).toBeNull();
    expect(parseRange("")).toBeNull();
  });

  it("rejects inverted ranges", () => {
    expect(parseRange("D6:A2")).toBeNull();
  });

  it("formats back to the same string", () => {
    expect(formatRange({ startCol: 1, endCol: 4, startRow: 3, endRow: 7 })).toBe("B3:E7");
  });
});

describe("evaluateVlookup — exact match", () => {
  it("finds a match", () => {
    expect(evaluateVlookup(EMPLOYEES, "104", "A2:D6", 3, false)).toEqual({
      ok: true,
      value: "Engineering",
    });
  });

  it("returns #N/A when nothing matches", () => {
    expect(evaluateVlookup(EMPLOYEES, "106", "A2:D6", 3, false)).toEqual({
      ok: false,
      error: "#N/A",
    });
  });

  it("compares numeric-string lookup values numerically", () => {
    expect(evaluateVlookup(EMPLOYEES, " 104 ", "A2:D6", 2, false)).toEqual({
      ok: true,
      value: "Dev Patel",
    });
  });

  it("works on a range not starting at column A / row 2", () => {
    expect(evaluateVlookup(ORDERS, "5004", "B3:E7", 2, false)).toEqual({
      ok: true,
      value: "Furniture",
    });
  });
});

describe("evaluateVlookup — colIndex validation", () => {
  it("rejects a zero column index", () => {
    expect(evaluateVlookup(EMPLOYEES, "104", "A2:D6", 0, false)).toEqual({
      ok: false,
      error: "#VALUE!",
    });
  });

  it("rejects a negative column index", () => {
    expect(evaluateVlookup(EMPLOYEES, "104", "A2:D6", -1, false)).toEqual({
      ok: false,
      error: "#VALUE!",
    });
  });

  it("rejects a column index one past the chosen range's width", () => {
    expect(evaluateVlookup(EMPLOYEES, "104", "A2:D6", 5, false)).toEqual({
      ok: false,
      error: "#REF!",
    });
  });

  it("bounds-checks against the chosen range's width, not the whole sheet", () => {
    // A2:B6 is 2 columns wide, so colIndex 2 (Name) is in range there, but
    // colIndex 3 overflows it even though column C exists in the full sheet.
    expect(evaluateVlookup(EMPLOYEES, "104", "A2:B6", 2, false)).toEqual({
      ok: true,
      value: "Dev Patel",
    });
    expect(evaluateVlookup(EMPLOYEES, "104", "A2:B6", 3, false)).toEqual({
      ok: false,
      error: "#REF!",
    });
  });
});

describe("evaluateVlookup — malformed range", () => {
  it("returns #REF! for an unparseable range", () => {
    expect(evaluateVlookup(EMPLOYEES, "104", "not a range", 1, false)).toEqual({
      ok: false,
      error: "#REF!",
    });
  });
});

describe("evaluateVlookup — approximate match", () => {
  it("finds the last row whose key is <= the lookup value", () => {
    expect(evaluateVlookup(ASCENDING, "25", "A2:B6", 2, true)).toEqual({
      ok: true,
      value: "twenty",
    });
  });

  it("matches an exact key too", () => {
    expect(evaluateVlookup(ASCENDING, "30", "A2:B6", 2, true)).toEqual({
      ok: true,
      value: "thirty",
    });
  });

  it("returns #N/A when the lookup value is below every key", () => {
    expect(evaluateVlookup(ASCENDING, "5", "A2:B6", 2, true)).toEqual({
      ok: false,
      error: "#N/A",
    });
  });
});
