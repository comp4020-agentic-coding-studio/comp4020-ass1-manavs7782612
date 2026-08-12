import { describe, expect, it } from "vitest";
import { declination, skyPhase, solarElevation, sunrise, sunset } from "./sun";

// Reference values are from api.sunrise-sunset.org (an independent NOAA-based
// implementation) for 2024-06-21, fetched 2026-08-12. Our port agreed with it
// to within ~1.5 minutes at both a mid-latitude and a near-tropical city, well
// inside the ±2 minute bar this test holds it to.
const CANBERRA = { lat: -35.2809, lon: 149.13 };
const DUBAI = { lat: 25.2048, lon: 55.2708 };
const SOLSTICE = new Date("2024-06-21T00:00:00Z");
const TOLERANCE_MS = 2 * 60 * 1000;

describe("sunrise/sunset", () => {
  it("agrees with a reference implementation within 2 minutes, both cities", () => {
    const cases: Array<[string, { lat: number; lon: number }, string, string]> = [
      ["Canberra", CANBERRA, "2024-06-20T21:10:38Z", "2024-06-21T06:59:59Z"],
      ["Dubai", DUBAI, "2024-06-21T01:28:19Z", "2024-06-21T15:13:18Z"],
    ];
    for (const [, city, riseIso, setIso] of cases) {
      const riseDiff = Math.abs(sunrise(SOLSTICE, city.lat, city.lon).getTime() - Date.parse(riseIso));
      const setDiff = Math.abs(sunset(SOLSTICE, city.lat, city.lon).getTime() - Date.parse(setIso));
      expect(riseDiff).toBeLessThan(TOLERANCE_MS);
      expect(setDiff).toBeLessThan(TOLERANCE_MS);
    }
  });

  it("Dubai's solstice day is longer than Canberra's (opposite hemispheres)", () => {
    const dubaiDay = sunset(SOLSTICE, DUBAI.lat, DUBAI.lon).getTime() - sunrise(SOLSTICE, DUBAI.lat, DUBAI.lon).getTime();
    const canberraDay =
      sunset(SOLSTICE, CANBERRA.lat, CANBERRA.lon).getTime() - sunrise(SOLSTICE, CANBERRA.lat, CANBERRA.lon).getTime();
    expect(dubaiDay).toBeGreaterThan(canberraDay);
  });
});

describe("solarElevation", () => {
  it("is positive at local solar noon and negative at local solar midnight", () => {
    const noonUtc = new Date("2024-06-21T02:05:19Z"); // Canberra's solar noon this day
    const midnightUtc = new Date(noonUtc.getTime() + 12 * 3600 * 1000);
    expect(solarElevation(noonUtc, CANBERRA.lat, CANBERRA.lon)).toBeGreaterThan(0);
    expect(solarElevation(midnightUtc, CANBERRA.lat, CANBERRA.lon)).toBeLessThan(0);
  });

  it("never returns NaN across a full day, any latitude in the dataset", () => {
    for (const lat of [-35.28, 25.2, 40.71, 3.14, 59.99]) {
      for (let hour = 0; hour < 24; hour++) {
        const t = new Date(SOLSTICE.getTime() + hour * 3600 * 1000);
        expect(Number.isNaN(solarElevation(t, lat, 0))).toBe(false);
      }
    }
  });
});

describe("declination", () => {
  it("is near its extreme (+23.4°) at the June solstice", () => {
    expect(declination(SOLSTICE)).toBeGreaterThan(23);
    expect(declination(SOLSTICE)).toBeLessThan(23.5);
  });
});

describe("skyPhase", () => {
  it.each([
    [10, "day"],
    [-3, "civil"],
    [-9, "nautical"],
    [-15, "astronomical"],
    [-30, "night"],
  ] as const)("classifies %d° as %s", (elevation, phase) => {
    expect(skyPhase(elevation)).toBe(phase);
  });
});
