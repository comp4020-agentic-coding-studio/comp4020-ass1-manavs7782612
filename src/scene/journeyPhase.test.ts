import { describe, expect, it } from "vitest";
import { phaseForStopIndex } from "./journeyPhase";

describe("phaseForStopIndex", () => {
  it.each([
    [0, "day"],
    [3, "day"],
    [4, "civil"],
    [7, "civil"],
    [8, "nautical"],
    [11, "nautical"],
    [12, "astronomical"],
    [15, "astronomical"],
    [16, "night"],
    [19, "night"],
  ] as const)("stop %d of 20 is %s", (index, phase) => {
    expect(phaseForStopIndex(index, 20)).toBe(phase);
  });

  it("gives every band exactly four of the twenty stops", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 20; i++) {
      const phase = phaseForStopIndex(i, 20);
      counts.set(phase, (counts.get(phase) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual([4, 4, 4, 4, 4]);
  });

  it("never runs past the last band, even for the final index", () => {
    expect(phaseForStopIndex(19, 20)).toBe("night");
  });
});
