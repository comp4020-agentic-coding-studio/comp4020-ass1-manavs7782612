import type { City } from "./types";

// One entry per city the journey visits. Where two stops share a city
// (Shanghai, New York City), the coordinates are the building fetched first
// for that city below — a few kilometres' difference among buildings in the
// same metropolitan area moves `sun.ts`'s output by well under a minute, far
// inside the tolerance the journey's sky needs.
//
// IANA time zone names are tz-database identifiers, not contested facts, so
// they carry the same retrieval date as the coordinates rather than a
// separate citation.
export const CITIES: Record<string, City> = {
  canberra: {
    name: "Canberra",
    lat: -35.2809,
    lon: 149.13,
    timezone: "Australia/Sydney",
    source: {
      url: "https://en.wikipedia.org/wiki/Canberra",
      retrieved: "2026-08-12",
    },
  },
  hoChiMinhCity: {
    name: "Ho Chi Minh City",
    lat: 10.795,
    lon: 106.7219,
    timezone: "Asia/Ho_Chi_Minh",
    source: {
      url: "https://en.wikipedia.org/wiki/Landmark_81",
      retrieved: "2026-08-12",
    },
  },
  saintPetersburg: {
    name: "Saint Petersburg",
    lat: 59.987,
    lon: 30.1781,
    timezone: "Europe/Moscow",
    source: {
      url: "https://en.wikipedia.org/wiki/Lakhta_Center",
      retrieved: "2026-08-12",
    },
  },
  newYorkCity: {
    name: "New York City",
    lat: 40.7664,
    lon: -73.9808,
    timezone: "America/New_York",
    source: {
      url: "https://en.wikipedia.org/wiki/Central_Park_Tower",
      retrieved: "2026-08-12",
    },
  },
  wuhan: {
    name: "Wuhan",
    lat: 30.5859,
    lon: 114.3175,
    timezone: "Asia/Shanghai",
    source: {
      url: "https://en.wikipedia.org/wiki/Wuhan_Greenland_Center",
      retrieved: "2026-08-12",
    },
  },
  hongKong: {
    name: "Hong Kong",
    lat: 22.3028,
    lon: 114.1613,
    timezone: "Asia/Hong_Kong",
    source: {
      url: "https://en.wikipedia.org/wiki/International_Commerce_Centre",
      retrieved: "2026-08-12",
    },
  },
  shanghai: {
    name: "Shanghai",
    lat: 31.2367,
    lon: 121.5028,
    timezone: "Asia/Shanghai",
    source: {
      url: "https://en.wikipedia.org/wiki/Shanghai_World_Financial_Center",
      retrieved: "2026-08-12",
    },
  },
  taipei: {
    name: "Taipei",
    lat: 25.0336,
    lon: 121.5647,
    timezone: "Asia/Taipei",
    source: {
      url: "https://en.wikipedia.org/wiki/Taipei_101",
      retrieved: "2026-08-12",
    },
  },
  beijing: {
    name: "Beijing",
    lat: 39.9114,
    lon: 116.4603,
    timezone: "Asia/Shanghai",
    source: {
      url: "https://en.wikipedia.org/wiki/China_Zun",
      retrieved: "2026-08-12",
    },
  },
  tianjin: {
    name: "Tianjin",
    lat: 39.0217,
    lon: 117.6981,
    timezone: "Asia/Shanghai",
    source: {
      url: "https://en.wikipedia.org/wiki/Tianjin_CTF_Finance_Centre",
      retrieved: "2026-08-12",
    },
  },
  guangzhou: {
    name: "Guangzhou",
    lat: 23.1203,
    lon: 113.3206,
    timezone: "Asia/Shanghai",
    source: {
      url: "https://en.wikipedia.org/wiki/Guangzhou_CTF_Finance_Centre",
      retrieved: "2026-08-12",
    },
  },
  seoul: {
    name: "Seoul",
    lat: 37.5125,
    lon: 127.1028,
    timezone: "Asia/Seoul",
    source: {
      url: "https://en.wikipedia.org/wiki/Lotte_World_Tower",
      retrieved: "2026-08-12",
    },
  },
  shenzhen: {
    name: "Shenzhen",
    lat: 22.5367,
    lon: 114.0503,
    timezone: "Asia/Shanghai",
    source: {
      url: "https://en.wikipedia.org/wiki/Ping_An_Finance_Centre",
      retrieved: "2026-08-12",
    },
  },
  mecca: {
    name: "Mecca",
    lat: 21.4189,
    lon: 39.8264,
    timezone: "Asia/Riyadh",
    source: {
      url: "https://en.wikipedia.org/wiki/Abraj_Al-Bait_Clock_Tower",
      retrieved: "2026-08-12",
    },
  },
  kualaLumpur: {
    name: "Kuala Lumpur",
    lat: 3.1417,
    lon: 101.7008,
    timezone: "Asia/Kuala_Lumpur",
    source: {
      url: "https://en.wikipedia.org/wiki/Merdeka_118",
      retrieved: "2026-08-12",
    },
  },
  dubai: {
    name: "Dubai",
    lat: 25.1972,
    lon: 55.2742,
    timezone: "Asia/Dubai",
    source: {
      url: "https://en.wikipedia.org/wiki/Burj_Khalifa",
      retrieved: "2026-08-12",
    },
  },
};
