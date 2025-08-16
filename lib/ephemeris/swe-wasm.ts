import type { EphemerisAdapter, ComputeInput, ComputeOutput, PlanetPosition, Houses, Aspect } from './adapter';
import { computeJulianDayUT, signFromLongitude } from './adapter';
import * as AstroEngine from 'astronomy-engine';

const PLANETS = [
  { body: AstroEngine.Body.Sun, name: 'Sun' },
  { body: AstroEngine.Body.Moon, name: 'Moon' },
  { body: AstroEngine.Body.Mercury, name: 'Mercury' },
  { body: AstroEngine.Body.Venus, name: 'Venus' },
  { body: AstroEngine.Body.Mars, name: 'Mars' },
  { body: AstroEngine.Body.Jupiter, name: 'Jupiter' },
  { body: AstroEngine.Body.Saturn, name: 'Saturn' },
  { body: AstroEngine.Body.Uranus, name: 'Uranus' },
  { body: AstroEngine.Body.Neptune, name: 'Neptune' },
  { body: AstroEngine.Body.Pluto, name: 'Pluto' }
];

export class SweWasmAdapter implements EphemerisAdapter {
  async compute(input: ComputeInput): Promise<ComputeOutput> {
    const { year, month, day, hour, minute, second = 0, lat, lon, tz } = input;
    
    // Create date object
    const jsDate = new Date(year, month - 1, day, hour, minute, second);
    const date = new AstroEngine.AstroTime(jsDate);
    const jdUt = date.ut;

    // Calculate planet positions
    const planets: PlanetPosition[] = [];
    for (const planet of PLANETS) {
      try {
        let lon: number, lat: number;
        
        if (planet.body === AstroEngine.Body.Moon) {
          const ecliptic = AstroEngine.EclipticGeoMoon(date);
          lon = ecliptic.lon;
          lat = ecliptic.lat;
        } else {
          const geo = AstroEngine.GeoVector(planet.body, date, false);
          const ecliptic = AstroEngine.Ecliptic(geo);
          lon = ecliptic.elon;
          lat = ecliptic.elat;
        }
        
        planets.push({
          name: planet.name,
          lon,
          lat,
          dist: 0 // astronomy-engine doesn't provide distance in ecliptic coordinates directly
        });
      } catch (error) {
        // Fallback for any calculation errors
        console.warn(`Failed to calculate position for ${planet.name}:`, error);
        planets.push({
          name: planet.name,
          lon: 0,
          lat: 0,
          dist: 0
        });
      }
    }

    // Calculate houses using simple calculation
    let houses: Houses | null = null;
    try {
      // Simple house calculation (Placidus approximation)
      const asc = this.calculateAscendant(date, lat, lon);
      const mc = this.calculateMidheaven(date, lat, lon);
      
      const cusps = this.calculateHouseCusps(asc, mc);
      
      houses = { asc, mc, cusps };
    } catch (error) {
      // Fallback if house calculation fails
      console.warn('Failed to calculate houses:', error);
      houses = null;
    }

    const aspects = this.computeAspects(planets);
    const sun = planets.find((p) => p.name === 'Sun');
    const sunSign = signFromLongitude(sun?.lon ?? 0);

    const summaryText = `Sun in ${sunSign}. Planets: ${planets.map((p) => `${p.name} ${p.lon.toFixed(1)}°`).join(', ')}.`;

    return {
      jdUt,
      tz: tz || 'UTC',
      planets,
      houses,
      aspects,
      summaryText,
      sunSign
    };
  }

  private calculateAscendant(date: AstroEngine.AstroTime, lat: number, lon: number): number {
    // Simplified ascendant calculation
    // This is an approximation - for production use, you'd want more accurate calculation
    const lst = this.localSiderealTime(date, lon);
    const obliquity = 23.4392811; // Mean obliquity of ecliptic
    
    const latRad = lat * Math.PI / 180;
    const lstRad = lst * Math.PI / 180;
    const oblRad = obliquity * Math.PI / 180;
    
    const ascRad = Math.atan2(-Math.cos(lstRad), 
                             Math.sin(lstRad) * Math.cos(oblRad) + 
                             Math.tan(latRad) * Math.sin(oblRad));
    
    return ((ascRad * 180 / Math.PI) + 360) % 360;
  }

  private calculateMidheaven(date: AstroEngine.AstroTime, lat: number, lon: number): number {
    // Simplified midheaven calculation
    const lst = this.localSiderealTime(date, lon);
    return (lst + 180) % 360;
  }

  private localSiderealTime(date: AstroEngine.AstroTime, lon: number): number {
    // Simplified LST calculation using more accurate formula
    const jd = date.ut;
    const t = (jd - 2451545.0) / 36525.0;
    
    // Greenwich Mean Sidereal Time
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
               0.000387933 * t * t - t * t * t / 38710000.0;
    
    // Normalize to 0-360 degrees
    gmst = ((gmst % 360) + 360) % 360;
    
    // Convert to Local Sidereal Time
    const lst = gmst + lon;
    return ((lst % 360) + 360) % 360;
  }

  private calculateHouseCusps(asc: number, mc: number): number[] {
    // Simplified Placidus house calculation
    const cusps = new Array(12);
    
    // Primary angles
    cusps[0] = asc;                    // 1st house (Ascendant)
    cusps[9] = mc;                     // 10th house (Midheaven)
    cusps[6] = (asc + 180) % 360;      // 7th house (Descendant)
    cusps[3] = (mc + 180) % 360;       // 4th house (IC)

    // Calculate intermediate houses using simple division
    // This is a simplified approximation of Placidus houses
    for (let i = 1; i < 3; i++) {
      const fraction = i / 3;
      
      // Houses 2-3 (between ASC and IC)
      cusps[i] = (asc + (cusps[3] - asc + 360) % 360 * fraction) % 360;
      
      // Houses 5-6 (between IC and DSC)  
      cusps[i + 3] = (cusps[3] + (cusps[6] - cusps[3] + 360) % 360 * fraction) % 360;
      
      // Houses 8-9 (between DSC and MC)
      cusps[i + 6] = (cusps[6] + (mc - cusps[6] + 360) % 360 * fraction) % 360;
      
      // Houses 11-12 (between MC and ASC)
      cusps[i + 9] = (mc + (asc - mc + 360) % 360 * fraction) % 360;
    }

    // Ensure all values are normalized 0-360
    return cusps.map(cusp => ((cusp % 360) + 360) % 360);
  }

  private computeAspects(planets: PlanetPosition[]): Aspect[] {
    const majors: { exact: number; type: Aspect['type']; orb: number }[] = [
      { exact: 0, type: 'conjunction', orb: 8 },
      { exact: 60, type: 'sextile', orb: 4 },
      { exact: 90, type: 'square', orb: 6 },
      { exact: 120, type: 'trine', orb: 6 },
      { exact: 180, type: 'opposition', orb: 8 }
    ];
    
    const res: Aspect[] = [];
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const a = planets[i];
        const b = planets[j];
        if (!a || !b) continue; // Skip if planets are undefined
        
        const d = Math.abs(((a.lon - b.lon + 540) % 360) - 180);
        for (const asp of majors) {
          const diff = Math.abs(d - asp.exact);
          if (diff <= asp.orb) {
            res.push({ a: a.name, b: b.name, type: asp.type, orb: diff, exact: asp.exact });
            break;
          }
        }
      }
    }
    return res;
  }
}