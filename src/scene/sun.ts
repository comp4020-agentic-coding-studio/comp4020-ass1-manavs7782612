// Solar position, sunrise, and sunset from latitude/longitude/time alone — no
// request, no lookup table. This is what lets each city's sky in the journey
// reflect *this moment*, client-side, on a static site (harness rule 4).
//
// The maths is the low-precision solar position algorithm from Jean Meeus,
// "Astronomical Algorithms" ch. 25, the same one NOAA's solar calculator
// publishes (https://gml.noaa.gov/grad/solcalc/solareqns.PDF). Ported from
// Mike Bostock's clean reimplementation
// (https://github.com/mbostock/solar-calculator, ISC licence, copyright
// 2014-2017 Mike Bostock), rather than re-derived from scratch, because a
// hand-rolled port of a public-domain formula is still worth checking against
// a working implementation instead of trusting arithmetic no one has run.
// Accurate to a fraction of a degree, which is well inside the ±2 minute
// tolerance `spec/assignment-1.test.ts` checks it against.

const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12);
const MS_PER_JULIAN_CENTURY = 36525 * 86400 * 1000;

const radians = (degrees: number): number => (Math.PI * degrees) / 180;
const degrees = (rad: number): number => (180 * rad) / Math.PI;

/** Julian centuries since J2000.0 for a given instant. */
function century(date: Date): number {
  return (date.getTime() - J2000_EPOCH_MS) / MS_PER_JULIAN_CENTURY;
}

/** UTC midnight of the day containing `date`. */
function dayStart(date: Date): Date {
  const start = new Date(date.getTime());
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/** Sun's mean longitude in degrees. */
function meanLongitude(t: number): number {
  const l = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  return l < 0 ? l + 360 : l;
}

/** Sun's mean anomaly in degrees. */
function meanAnomaly(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

/** Eccentricity of Earth's orbit. */
function orbitEccentricity(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

/** Sun's equation of the center, in degrees. */
function equationOfCenter(t: number): number {
  const m = radians(meanAnomaly(t));
  return (
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(m * 2) * (0.019993 - 0.000101 * t) +
    Math.sin(m * 3) * 0.000289
  );
}

/** Sun's true longitude, in degrees. */
function trueLongitude(t: number): number {
  return meanLongitude(t) + equationOfCenter(t);
}

/** Sun's apparent longitude (true longitude corrected for nutation/aberration), in degrees. */
function apparentLongitude(t: number): number {
  return trueLongitude(t) - 0.00569 - 0.00478 * Math.sin(radians(125.04 - 1934.136 * t));
}

/** Obliquity of Earth's ecliptic, in degrees. */
function obliquityOfEcliptic(t: number): number {
  const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const omega = 125.04 - 1934.136 * t;
  return e0 + 0.00256 * Math.cos(radians(omega));
}

/** Solar declination, in degrees. */
export function declination(date: Date): number {
  const t = century(date);
  return degrees(
    Math.asin(Math.sin(radians(obliquityOfEcliptic(t))) * Math.sin(radians(apparentLongitude(t)))),
  );
}

/** Equation of time, in minutes (apparent minus mean solar time). */
function equationOfTime(t: number): number {
  const epsilon = obliquityOfEcliptic(t);
  const l0 = meanLongitude(t);
  const e = orbitEccentricity(t);
  const m = meanAnomaly(t);
  const y = Math.tan(radians(epsilon) / 2) ** 2;
  const sin2l0 = Math.sin(2 * radians(l0));
  const sinm = Math.sin(radians(m));
  const cos2l0 = Math.cos(2 * radians(l0));
  const sin4l0 = Math.sin(4 * radians(l0));
  const sin2m = Math.sin(2 * radians(m));
  const eTime =
    y * sin2l0 - 2 * e * sinm + 4 * e * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
  return degrees(eTime) * 4;
}

/** Solar noon (sun crosses the meridian) for a given day and longitude, in UTC. */
export function solarNoon(date: Date, longitudeDeg: number): Date {
  const start = dayStart(date).getTime();
  // Two rounds of correction against a first guess, matching the reference
  // implementation — the equation of time changes little across a day, so
  // this converges well within its own ~seconds-level uncertainty.
  const firstGuessT = century(new Date(start + (12 - (longitudeDeg * 24) / 360) * 3600 * 1000));
  const firstCorrectionMin =
    720 - longitudeDeg * 4 - equationOfTime(firstGuessT - longitudeDeg / (360 * 36525));
  const secondCorrectionMin =
    720 - longitudeDeg * 4 - equationOfTime(firstGuessT + firstCorrectionMin / (1440 * 36525));
  return new Date(start + secondCorrectionMin * 60 * 1000);
}

/**
 * Signed hour angle of sunrise/sunset, in degrees, for a given day and
 * latitude — negative at sunrise, positive at sunset (or NaN for a
 * polar day/night at that latitude on that date, which none of this
 * journey's cities reach).
 */
function riseSetHourAngle(date: Date, latitudeDeg: number): number {
  const phi = radians(latitudeDeg);
  const theta = radians(declination(date));
  return -degrees(
    Math.acos(Math.cos(radians(90.833)) / (Math.cos(phi) * Math.cos(theta)) - Math.tan(phi) * Math.tan(theta)),
  );
}

/** Sunrise, in UTC, for a given day/latitude/longitude. */
export function sunrise(date: Date, latitudeDeg: number, longitudeDeg: number): Date {
  const noon = solarNoon(date, longitudeDeg);
  return new Date(noon.getTime() + riseSetHourAngle(noon, latitudeDeg) * 4 * 60 * 1000);
}

/** Sunset, in UTC, for a given day/latitude/longitude. */
export function sunset(date: Date, latitudeDeg: number, longitudeDeg: number): Date {
  const noon = solarNoon(date, longitudeDeg);
  return new Date(noon.getTime() - riseSetHourAngle(noon, latitudeDeg) * 4 * 60 * 1000);
}

/** Sun's elevation above the horizon, in degrees, at an exact instant. */
export function solarElevation(date: Date, latitudeDeg: number, longitudeDeg: number): number {
  const t = century(date);
  const eq = equationOfTime(t);
  const decl = radians(declination(date));
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  let trueSolarTime = (utcMinutes + eq + longitudeDeg * 4) % 1440;
  if (trueSolarTime < 0) trueSolarTime += 1440;
  const hourAngle = radians(trueSolarTime / 4 - 180);
  const phi = radians(latitudeDeg);
  return degrees(Math.asin(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(hourAngle)));
}

export type SkyPhase = "day" | "civil" | "nautical" | "astronomical" | "night";

/**
 * Which twilight band a sun elevation falls into, using the standard
 * astronomical thresholds (0°, -6°, -12°, -18°) — the same bands used to
 * label sunrise/sunset/dusk/dawn everywhere from almanacs to `SunCalc`.
 */
export function skyPhase(elevationDeg: number): SkyPhase {
  if (elevationDeg > 0) return "day";
  if (elevationDeg > -6) return "civil";
  if (elevationDeg > -12) return "nautical";
  if (elevationDeg > -18) return "astronomical";
  return "night";
}
