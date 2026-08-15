// Shared shapes for the journey's dataset. Harness rule 1: no number in
// `buildings.ts` or `cities.ts` exists without a `source` and a `retrieved`
// date next to it — see CLAUDE.md, "Accuracy comes first".

/** Where a figure came from, and when it was checked there. */
export interface Source {
  url: string;
  /** ISO date (YYYY-MM-DD) the figure was last confirmed against `url`. */
  retrieved: string;
}

export interface City {
  name: string;
  /** Decimal degrees, +north/+east. */
  lat: number;
  lon: number;
  /** IANA time zone, e.g. "Asia/Dubai" — drives both the sky and any local-time label. */
  timezone: string;
  source: Source;
}

export type HeightKind =
  /** A real, measured building — the height is CTBUH's "architectural top". */
  | "measured"
  /** A conjured, illustrative stop (the three Canberra stops) — plausible, not measured. */
  | "typical";

export interface Stop {
  id: string;
  name: string;
  /** Key into `CITIES`. */
  city: string;
  heightM: number;
  floors: number;
  kind: HeightKind;
  /** Year of completion — omitted for typical/illustrative stops, which have none. */
  completedYear?: number;
  source: Source;
  /** Surfaced in the UI when sources disagree or a figure needs a caveat. */
  note?: string;
}

/** How a background skyline building finishes at the top — a coarse silhouette cue, not the detailed `CrownStyle` the tracked buildings use. */
export type SkylineShape = "flat" | "pitch" | "spire" | "step" | "dome";

/** A real, named building forming part of a stop's backdrop — see `data/skylineBuildings.ts`. */
export interface SkylineBuilding {
  name: string;
  heightM: number;
  shape: SkylineShape;
  source: Source;
}
