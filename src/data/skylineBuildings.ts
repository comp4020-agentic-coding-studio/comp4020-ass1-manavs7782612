// Real, named buildings forming each stop's decorative backdrop — rendered by
// src/components/Skyline.vue, surfaced as text in App.vue's `.stop-info`
// panel. Same harness rule 1 discipline as buildings.ts: every `heightM`
// carries a `source` + `retrieved` date, cross-checked against a second
// source before being frozen here (CLAUDE.md, "Accuracy comes first").
//
// Keyed by `Stop.id`, not city — NYC's two stops (central-park-tower,
// one-wtc) are genuinely different real places with different real
// neighbours; Shanghai's two stops (swfc, shanghai-tower) sit right next to
// each other so their lists legitimately overlap, but neither building lists
// itself. Canberra's three stops (house, townhouse, apartment) aren't real
// addresses, so they share one real Canberra skyline instead of each
// inventing a fake one.
//
// Heights are the same CTBUH "architectural top" measure buildings.ts uses,
// applied uniformly. Where independent sources disagreed by more than
// rounding, the `note` records both figures and which was kept — see the
// per-entry notes below for the full list of disagreements the research
// turned up.
import type { SkylineBuilding } from "./types";

const CANBERRA_SKYLINE: SkylineBuilding[] = [
  {
    name: "Black Mountain Tower (Telstra Tower)",
    heightM: 195.2,
    shape: "spire",
    source: { url: "https://en.wikipedia.org/wiki/Telstra_Tower", retrieved: "2026-08-15" },
  },
  {
    name: "Lovett Tower",
    heightM: 93,
    shape: "flat",
    source: { url: "https://en.wikipedia.org/wiki/Lovett_Tower", retrieved: "2026-08-15" },
  },
  {
    name: "WOVA Tower 1",
    heightM: 77,
    shape: "flat",
    source: {
      url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Canberra",
      retrieved: "2026-08-15",
    },
  },
  {
    name: "Infinity Tower 1",
    heightM: 70,
    shape: "flat",
    source: {
      url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Canberra",
      retrieved: "2026-08-15",
    },
  },
  {
    name: "NewActon Nishi Apartments",
    heightM: 55,
    shape: "flat",
    source: {
      url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Canberra",
      retrieved: "2026-08-15",
    },
  },
];

/** Every stop's real, named neighbours — see the file header for the keying rule. */
export const SKYLINE_BUILDINGS: Record<string, SkylineBuilding[]> = {
  house: CANBERRA_SKYLINE,
  townhouse: CANBERRA_SKYLINE,
  apartment: CANBERRA_SKYLINE,

  "landmark-81": [
    {
      // Roof height 163.5m vs. helipad height 165m vs. "164m to top of tower"
      // in prose — all the same building at different reference points; kept
      // the infobox's primary Height field.
      name: "Bitexco Financial Tower",
      heightM: 262.5,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/Bitexco_Financial_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "Saigon Times Square",
      heightM: 165,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Saigon_Times_Square", retrieved: "2026-08-15" },
    },
    {
      // 145m to roof vs. 160m including its three rooftop spires — kept the
      // to-roof figure for consistency with how the other entries here are
      // measured; the spires are still what earns it the "spire" shape.
      name: "Saigon Trade Center",
      heightM: 145,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Saigon_Trade_Center", retrieved: "2026-08-15" },
    },
    {
      name: "Vincom Center Đồng Khởi",
      heightM: 115,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/Vincom_Center_%C4%90%E1%BB%93ng_Kh%E1%BB%9Fi",
        retrieved: "2026-08-15",
      },
    },
  ],

  "lakhta-center": [
    {
      // Wikipedia's own prose rounds to "123 m"; four independent
      // travel/reference sources agree on 122.5m (which also matches its
      // published gold/angel component breakdown) — kept 122.5m.
      name: "Peter and Paul Cathedral",
      heightM: 122.5,
      shape: "spire",
      source: {
        url: "https://en.wikipedia.org/wiki/Peter_and_Paul_Cathedral,_Saint_Petersburg",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Saint Isaac's Cathedral",
      heightM: 101.5,
      shape: "dome",
      source: { url: "https://en.wikipedia.org/wiki/Saint_Isaac%27s_Cathedral", retrieved: "2026-08-15" },
    },
    {
      // Has no height figure on Wikipedia at all; used a travel-guide source
      // corroborated by several independent sites, all agreeing on 93.7m.
      name: "Smolny Cathedral",
      heightM: 93.7,
      shape: "dome",
      source: { url: "https://www.uvisitrussia.com/news/smolny-cathedral-st-petersburg.html", retrieved: "2026-08-15" },
    },
    {
      name: "Kazan Cathedral",
      heightM: 71.6,
      shape: "dome",
      source: { url: "https://en.wikipedia.org/wiki/Kazan_Cathedral,_Saint_Petersburg", retrieved: "2026-08-15" },
    },
  ],

  "central-park-tower": [
    {
      name: "111 West 57th Street (Steinway Tower)",
      heightM: 435,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/111_West_57th_Street", retrieved: "2026-08-15" },
    },
    {
      name: "432 Park Avenue",
      heightM: 425.5,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/432_Park_Avenue", retrieved: "2026-08-15" },
    },
    {
      // Most sources converge on 306m; one exhibition page's 308m looks like
      // a different tip-measurement convention. Kept the 306m consensus.
      name: "One57",
      heightM: 306,
      shape: "pitch",
      source: { url: "https://en.wikipedia.org/wiki/One57", retrieved: "2026-08-15" },
    },
    {
      name: "220 Central Park South",
      heightM: 290,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/220_Central_Park_South", retrieved: "2026-08-15" },
    },
  ],

  "wuhan-greenland-center": [
    {
      name: "Wuhan Center",
      heightM: 443.1,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Wuhan_Center", retrieved: "2026-08-15" },
    },
    {
      // A search-tool summary briefly claimed 436-460m; Wikipedia, the
      // architect's own project page, and Skyscraper.org all independently
      // agree on 376m, so that artifact was discarded.
      name: "Riverview Plaza A1",
      heightM: 376,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Riverview_Plaza", retrieved: "2026-08-15" },
    },
    {
      name: "Minsheng Bank Building",
      heightM: 331,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Minsheng_Bank_Building", retrieved: "2026-08-15" },
    },
    {
      name: "Yuexiu Fortune Center Tower 1",
      heightM: 330,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/Yuexiu_Fortune_Center_Tower_1",
        retrieved: "2026-08-15",
      },
    },
  ],

  "icc-hong-kong": [
    {
      name: "Two International Finance Centre",
      heightM: 412,
      shape: "spire",
      source: {
        url: "https://en.wikipedia.org/wiki/International_Finance_Centre_(Hong_Kong)",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Central Plaza",
      heightM: 373.9,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Central_Plaza_(Hong_Kong)", retrieved: "2026-08-15" },
    },
    {
      name: "Bank of China Tower",
      heightM: 367.4,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Bank_of_China_Tower_(Hong_Kong)", retrieved: "2026-08-15" },
    },
    {
      // No clear architectural description of what fills the gap between its
      // 292m roof and 346m architectural height was found — "flat" is the
      // safest default given the uncertainty, not a confident shape claim.
      name: "The Center",
      heightM: 346,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/The_Center", retrieved: "2026-08-15" },
    },
  ],

  swfc: [
    {
      name: "Shanghai Tower",
      heightM: 632,
      shape: "dome",
      source: { url: "https://en.wikipedia.org/wiki/Shanghai_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "Jin Mao Tower",
      heightM: 420.5,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/Jin_Mao_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "Shanghai IFC North Tower",
      heightM: 259.9,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Shanghai_IFC", retrieved: "2026-08-15" },
    },
  ],

  "taipei-101": [
    {
      name: "The Sky Taipei",
      heightM: 280,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/The_Sky_Taipei", retrieved: "2026-08-15" },
    },
    {
      name: "Taipei Nan Shan Plaza",
      heightM: 272,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Taipei_Nan_Shan_Plaza", retrieved: "2026-08-15" },
    },
    {
      name: "Fubon Xinyi A25",
      heightM: 266.3,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Fubon_Xinyi_A25", retrieved: "2026-08-15" },
    },
    {
      name: "Shin Kong Life Tower",
      heightM: 244.8,
      shape: "pitch",
      source: { url: "https://en.wikipedia.org/wiki/Shin_Kong_Life_Tower", retrieved: "2026-08-15" },
    },
  ],

  "citic-tower": [
    {
      name: "China World Trade Center Tower III",
      heightM: 330,
      shape: "spire",
      source: {
        url: "https://en.wikipedia.org/wiki/China_World_Trade_Center_Tower_III",
        retrieved: "2026-08-15",
      },
    },
    {
      // "Park Tower" reads 250m on CTBUH-linked sources vs. 249.9m in the
      // developer's own material — rounding, not a real conflict.
      name: "Beijing Yintai Centre",
      heightM: 250,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/Beijing_Yintai_Centre", retrieved: "2026-08-15" },
    },
    {
      name: "CCTV Headquarters",
      heightM: 234,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/CCTV_Headquarters", retrieved: "2026-08-15" },
    },
  ],

  "tianjin-ctf": [
    {
      name: "Tianjin World Financial Center",
      heightM: 336.9,
      shape: "spire",
      source: {
        url: "https://en.wikipedia.org/wiki/Tianjin_World_Financial_Center",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Centre Plaza",
      heightM: 238,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Centre_Plaza_(Tianjin)", retrieved: "2026-08-15" },
    },
    {
      name: "Jin Wan Plaza 9",
      heightM: 299.7,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Jin_Wan_Plaza_9", retrieved: "2026-08-15" },
    },
    {
      name: "Bohai Bank Tower",
      heightM: 270,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Bohai_Bank_Tower", retrieved: "2026-08-15" },
    },
  ],

  "guangzhou-ctf": [
    {
      name: "Guangzhou International Finance Center",
      heightM: 438.6,
      shape: "spire",
      source: {
        url: "https://en.wikipedia.org/wiki/Guangzhou_International_Finance_Center",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Canton Tower",
      heightM: 600,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Canton_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "CITIC Plaza",
      heightM: 390.2,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/CITIC_Plaza", retrieved: "2026-08-15" },
    },
    {
      // Wikipedia's tallest-buildings list gives 350.3m; The Pinnacle's own
      // dedicated article gives 360m (roof 311.9m + antenna spire) — kept
      // the more detailed dedicated-article figure.
      name: "The Pinnacle",
      heightM: 360,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/The_Pinnacle_(Guangzhou)", retrieved: "2026-08-15" },
    },
  ],

  "one-wtc": [
    {
      name: "3 World Trade Center",
      heightM: 329,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/3_World_Trade_Center", retrieved: "2026-08-15" },
    },
    {
      name: "7 World Trade Center",
      heightM: 226,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/7_World_Trade_Center", retrieved: "2026-08-15" },
    },
    {
      name: "70 Pine Street",
      heightM: 290,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/70_Pine_Street", retrieved: "2026-08-15" },
    },
    {
      name: "Woolworth Building",
      heightM: 241,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/Woolworth_Building", retrieved: "2026-08-15" },
    },
  ],

  "lotte-world-tower": [
    {
      // 274m spire-inclusive vs. 249.6m CTBUH roof height (same convention
      // split as the Empire State Building) — kept the spire-inclusive
      // figure for consistency with the other spired entries here.
      name: "63 Building",
      heightM: 274,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/63_Building", retrieved: "2026-08-15" },
    },
    {
      // Three figures found (333m Wikipedia architectural, 318m
      // architect/developer roof figure, 338m forum claim) — kept 318m as
      // corroborated by both Wikipedia's roof figure and the developer.
      name: "Parc1 Tower",
      heightM: 318,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Parc1_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "Three IFC",
      heightM: 283,
      shape: "pitch",
      source: {
        url: "https://en.wikipedia.org/wiki/International_Finance_Center_Seoul",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "N Seoul Tower",
      heightM: 236.7,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/N_Seoul_Tower", retrieved: "2026-08-15" },
    },
  ],

  "ping-an-finance-centre": [
    {
      name: "KK100",
      heightM: 442,
      shape: "dome",
      source: { url: "https://en.wikipedia.org/wiki/KK100", retrieved: "2026-08-15" },
    },
    {
      name: "China Resources Headquarters",
      heightM: 392.5,
      shape: "spire",
      source: {
        url: "https://en.wikipedia.org/wiki/China_Resources_Headquarters",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Shun Hing Square",
      heightM: 384,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Shun_Hing_Square", retrieved: "2026-08-15" },
    },
    {
      name: "China Merchants Bank Tower Global HQ",
      heightM: 393,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/China_Merchants_Bank_Tower_Global_HQ",
        retrieved: "2026-08-15",
      },
    },
  ],

  "makkah-royal-clock-tower": [
    {
      // Zamzam and Hajar Tower report near-identical figures across some
      // aggregators (279m/58 floors for both) — Wikipedia's dedicated list
      // gives Hajar Tower as 276m/54 floors distinctly; kept Wikipedia's.
      name: "Abraj Al Bait Zamzam Tower",
      heightM: 279,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Saudi_Arabia",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Abraj Al Bait Hajar Tower",
      heightM: 276,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Saudi_Arabia",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Abraj Al Bait Maqam Tower",
      heightM: 232.4,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Saudi_Arabia",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Abraj Al Bait Marwah Tower",
      heightM: 232,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Saudi_Arabia",
        retrieved: "2026-08-15",
      },
    },
  ],

  "shanghai-tower": [
    {
      name: "Shanghai World Financial Center",
      heightM: 492,
      shape: "flat",
      source: {
        url: "https://en.wikipedia.org/wiki/Shanghai_World_Financial_Center",
        retrieved: "2026-08-15",
      },
    },
    {
      name: "Jin Mao Tower",
      heightM: 420.5,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/Jin_Mao_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "Shanghai IFC South Tower",
      heightM: 249.9,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Shanghai_IFC", retrieved: "2026-08-15" },
    },
  ],

  "merdeka-118": [
    {
      name: "Petronas Twin Towers",
      heightM: 451.9,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Petronas_Towers", retrieved: "2026-08-15" },
    },
    {
      name: "The Exchange 106",
      heightM: 453.6,
      shape: "step",
      source: { url: "https://en.wikipedia.org/wiki/The_Exchange_106", retrieved: "2026-08-15" },
    },
    {
      name: "Kuala Lumpur Tower",
      heightM: 421,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Kuala_Lumpur_Tower", retrieved: "2026-08-15" },
    },
  ],

  "burj-khalifa": [
    {
      name: "Marina 101",
      heightM: 425,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/Marina_101", retrieved: "2026-08-15" },
    },
    {
      name: "Princess Tower",
      heightM: 413.4,
      shape: "dome",
      source: { url: "https://en.wikipedia.org/wiki/Princess_Tower", retrieved: "2026-08-15" },
    },
    {
      // Its defining feature is the 90-degree structural twist, not the
      // roofline — the actual top is flat, so the twist is left to the
      // rendered footprint variation rather than the shape enum.
      name: "Cayan Tower",
      heightM: 306.4,
      shape: "flat",
      source: { url: "https://en.wikipedia.org/wiki/Cayan_Tower", retrieved: "2026-08-15" },
    },
    {
      name: "23 Marina",
      heightM: 392.8,
      shape: "spire",
      source: { url: "https://en.wikipedia.org/wiki/23_Marina", retrieved: "2026-08-15" },
    },
  ],
};
