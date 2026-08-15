// Contracts for src/data/skylineBuildings.ts (harness rule 1: accuracy) —
// same discipline as assignment-1.test.ts's checks on buildings.ts, applied
// to the decorative backdrop's real neighbour data instead.
import { describe, expect, it } from "vitest";
import { STOPS } from "../src/data/buildings";
import { SKYLINE_BUILDINGS } from "../src/data/skylineBuildings";

describe("the skyline backdrop dataset (harness rule 1: accuracy)", () => {
  it("has a backdrop entry for every stop, keyed by Stop.id", () => {
    for (const stop of STOPS) {
      expect(SKYLINE_BUILDINGS[stop.id], `${stop.name} (${stop.id}) has no backdrop entry`).toBeTruthy();
    }
  });

  it("has no orphaned keys beyond the current stop ids", () => {
    const stopIds = new Set(STOPS.map((stop) => stop.id));
    for (const key of Object.keys(SKYLINE_BUILDINGS)) {
      expect(stopIds.has(key), `"${key}" isn't a Stop.id in buildings.ts`).toBe(true);
    }
  });

  it("every stop has at least one backdrop building", () => {
    for (const stop of STOPS) {
      expect(SKYLINE_BUILDINGS[stop.id]?.length ?? 0, `${stop.name} has an empty backdrop list`).toBeGreaterThan(0);
    }
  });

  it("no stop's own building appears in its own backdrop list", () => {
    for (const stop of STOPS) {
      const names = (SKYLINE_BUILDINGS[stop.id] ?? []).map((b) => b.name.toLowerCase());
      expect(names.includes(stop.name.toLowerCase()), `${stop.name}'s backdrop lists itself`).toBe(false);
    }
  });

  const allBuildings = Object.entries(SKYLINE_BUILDINGS).flatMap(([stopId, buildings]) =>
    buildings.map((building) => ({ stopId, building })),
  );

  it.each(allBuildings.map(({ stopId, building }) => [`${stopId}: ${building.name}`, building] as const))(
    "%s carries a source and a retrieval date",
    (_label, building) => {
      expect(building.source.url, `${building.name} has no https source URL`).toMatch(/^https:\/\//);
      expect(building.source.retrieved, `${building.name} has no ISO retrieval date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    },
  );

  it.each(allBuildings.map(({ stopId, building }) => [`${stopId}: ${building.name}`, building] as const))(
    "%s has a plausible height for a real building",
    (_label, building) => {
      // Generous bounds: the shortest real backdrop entry (Kazan Cathedral,
      // ~71.6m) to the tallest (Shanghai Tower, 632m) — wide enough to admit
      // both a low-rise Canberra tower and a Chinese supertall without
      // encoding a specific building's figure as the boundary.
      expect(building.heightM, `${building.name} is ${building.heightM}m`).toBeGreaterThan(10);
      expect(building.heightM).toBeLessThan(700);
    },
  );

  it.each(allBuildings.map(({ stopId, building }) => [`${stopId}: ${building.name}`, building] as const))(
    "%s has a valid SkylineShape",
    (_label, building) => {
      expect(["flat", "pitch", "spire", "step", "dome"]).toContain(building.shape);
    },
  );
});
