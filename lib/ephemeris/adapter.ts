import { DateTime } from 'luxon';

export type HouseSystem = 'P' | 'K' | 'W' | 'R' | 'C' | 'B' | 'M' | 'H';

export type ComputeInput = {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
  hour: number;  // 0-23
  minute: number; // 0-59
  second?: number; // 0-59
  lat: number; // latitude
  lon: number; // longitude
  tz?: string; // IANA timezone; if absent, will be derived from geo-tz
  houseSystem?: HouseSystem; // default 'P' (Placidus)
};

export type PlanetPosition = {
  name: string;
  lon: number; // ecliptic longitude, degrees 0..360
  lat: number; // ecliptic latitude, degrees
  dist?: number; // AU if available
};

export type Houses = {
  asc: number;
  mc: number;
  cusps: number[]; // 1..12
};

export type Aspect = {
  a: string;
  b: string;
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  orb: number; // degrees
  exact: number; // exact angle e.g. 0, 60, 90, 120, 180
};

export type ComputeOutput = {
  jdUt: number;
  tz: string;
  planets: PlanetPosition[];
  houses: Houses | null;
  aspects: Aspect[];
  summaryText: string;
  sunSign: string;
};

export interface EphemerisAdapter {
  compute(input: ComputeInput): Promise<ComputeOutput>;
}

export async function getEphemerisAdapter(): Promise<EphemerisAdapter> {
  // Force WASM usage since swisseph is not available in deployment
  const wasmMod = await import('./swe-wasm');
  return new wasmMod.SweWasmAdapter();
}

export function computeJulianDayUT(input: ComputeInput): number {
  const { year, month, day, hour, minute, second = 0, tz } = input;
  const zone = tz || 'UTC';
  const dt = DateTime.fromObject({ year, month, day, hour, minute, second }, { zone: zone });
  const ut = dt.toUTC();
  const Y = ut.year;
  const M = ut.month;
  const D = ut.day + (ut.hour + (ut.minute + ut.second / 60) / 60) / 24;
  let y = Y;
  let m = M;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + D + B - 1524.5;
  return jd;
}

export function signFromLongitude(lon: number): string {
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const idx = Math.floor(((lon % 360) + 360) % 360 / 30);
  return signs[idx] || 'Aries'; // Fallback to Aries if index is out of bounds
}