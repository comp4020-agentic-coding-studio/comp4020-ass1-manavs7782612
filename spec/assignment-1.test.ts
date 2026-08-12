// Contracts for this week's brief (Assignment 1: "Skyline"), turned into
// tests per spec/README.md. These check what the page must do, not how it's
// built, so they hold across the Vue-vs-plain-TS fallback CLAUDE.md names.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { STOPS } from "../src/data/buildings";
import { CITIES } from "../src/data/cities";

function walk(dir: string, filter: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, filter);
    return filter(entry.name) ? [path] : [];
  });
}

describe("the dataset (harness rule 1: accuracy)", () => {
  it("has exactly twenty stops", () => {
    expect(STOPS).toHaveLength(20);
  });

  it("ascends in height, never descending", () => {
    // Not strictly ascending: Tianjin CTF and Guangzhou CTF Finance Centres
    // are a genuine tie at 530m, independently cited by Wikipedia, CTBUH's
    // Skyscraper Center, and both buildings' own architects (SOM, KPF).
    // Inventing a fake tie-breaking metre would violate rule 1 itself — a
    // plausible number is worse than no number — so the walk allows equal
    // adjacent heights and only forbids the camera ever moving backwards.
    for (let i = 1; i < STOPS.length; i++) {
      expect(
        STOPS[i].heightM,
        `${STOPS[i].name} should be at least as tall as ${STOPS[i - 1].name}`,
      ).toBeGreaterThanOrEqual(STOPS[i - 1].heightM);
    }
  });

  it.each(STOPS.map((stop) => [stop.name, stop] as const))("%s carries a source and a retrieval date", (_name, stop) => {
    expect(stop.source.url, `${stop.name} has no source URL`).toMatch(/^https:\/\//);
    expect(stop.source.retrieved, `${stop.name} has no retrieval date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(STOPS.map((stop) => [stop.name, stop] as const))(
    "%s has a plausible height for its floor count",
    (_name, stop) => {
      const perFloor = stop.heightM / stop.floors;
      expect(perFloor, `${stop.name}: ${stop.heightM}m over ${stop.floors} floors is ${perFloor.toFixed(1)}m/floor`).toBeGreaterThan(
        2.5,
      );
      expect(perFloor).toBeLessThan(7);
    },
  );

  it("labels every non-measured figure as typical", () => {
    for (const stop of STOPS) {
      if (stop.kind === "typical") {
        expect(stop.note, `${stop.name} is typical but has no label explaining that`).toBeTruthy();
      }
    }
  });

  it("flags Merdeka 118's completion-year disagreement rather than silently picking one", () => {
    const merdeka = STOPS.find((stop) => stop.id === "merdeka-118");
    expect(merdeka?.note).toBeTruthy();
  });

  it("every stop's city exists in CITIES, with its own source", () => {
    for (const stop of STOPS) {
      const city = CITIES[stop.city];
      expect(city, `${stop.name} references unknown city "${stop.city}"`).toBeTruthy();
      expect(city.source.url).toMatch(/^https:\/\//);
      expect(city.timezone.length).toBeGreaterThan(0);
    }
  });
});

describe("the built site (harness rule 2 & 3: usability, both viewports)", () => {
  const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

  it("has a skip link as an early focusable element", () => {
    const skipLink = doc.querySelector("a.skip-link, a[href^='#']");
    expect(skipLink, "no skip link found").toBeTruthy();
  });

  it("has exactly one aria-live region", () => {
    expect(doc.querySelectorAll("[aria-live]")).toHaveLength(1);
  });

  it("lists all twenty stops, in ascending order, in the no-JS reading path", () => {
    const items = [...doc.querySelectorAll(".stop-list li")];
    expect(items).toHaveLength(20);
    items.forEach((item, i) => {
      const text = item.textContent ?? "";
      expect(text, `stop ${i + 1} doesn't name "${STOPS[i].name}"`).toContain(STOPS[i].name);
      const heightText = String(STOPS[i].heightM).replace(/\.0$/, "");
      expect(text, `stop ${i + 1} doesn't cite ${STOPS[i].heightM}m`).toContain(heightText);
    });
  });

  it("cites a real https source for every listed stop", () => {
    const items = [...doc.querySelectorAll(".stop-list li")];
    items.forEach((item, i) => {
      const link = item.querySelector("a");
      expect(link?.getAttribute("href"), `stop ${i + 1} has no source link`).toMatch(/^https:\/\//);
    });
  });
});

describe("the built bundle (harness rule 4: static, no network)", () => {
  const scripts = walk(resolve("dist"), (name) => name.endsWith(".js"));

  it("built at least one script", () => {
    expect(scripts.length).toBeGreaterThan(0);
  });

  it("never calls fetch, XMLHttpRequest, WebSocket, or EventSource", () => {
    const offenders = /\bfetch\s*\(|new\s+XMLHttpRequest|new\s+WebSocket|new\s+EventSource|sendBeacon\s*\(/;
    for (const script of scripts) {
      const code = readFileSync(script, "utf8");
      expect(offenders.test(code), `${script} calls a network API`).toBe(false);
    }
  });

  it("the built HTML loads no external origin", () => {
    const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;
    for (const el of doc.querySelectorAll("script[src], link[rel='stylesheet'][href], img[src]")) {
      const url = el.getAttribute("src") ?? el.getAttribute("href") ?? "";
      expect(/^https?:\/\//.test(url), `${el.tagName} points at an external origin: ${url}`).toBe(false);
    }
  });
});

describe("the source (harness rule 5: nothing left running)", () => {
  const sourceFiles = walk(resolve("src"), (name) => /\.(ts|vue)$/.test(name));

  it("never uses setInterval", () => {
    for (const file of sourceFiles) {
      expect(readFileSync(file, "utf8").includes("setInterval"), `${file} uses setInterval`).toBe(false);
    }
  });

  it("only registers DOM listeners through the lifecycle helper", () => {
    for (const file of sourceFiles) {
      if (file.endsWith(`${sep}lifecycle.ts`)) continue;
      const code = readFileSync(file, "utf8");
      expect(code.includes("addEventListener("), `${file} calls addEventListener directly — go through Lifecycle.on()`).toBe(
        false,
      );
    }
  });
});
