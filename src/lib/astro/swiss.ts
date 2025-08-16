import { getEphemerisAdapter, signFromLongitude } from '../../../lib/ephemeris/adapter';
import type { ComputeInput } from '../../../lib/ephemeris/adapter';

export type BirthInput = {
  date: string;      // 'YYYY-MM-DD'
  time: string;      // 'HH:mm'
  tzOffset: number;  // часы от UTC (Москва лето = 3)
  lat: number;
  lon: number;
  houseSystem?: 'P'|'W'; // Placidus / Whole Sign
};

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const signOf = (deg:number)=> SIGNS[Math.floor(((deg%360)+360)%360/30)];

function inArc(x:number, a:number, b:number){ if (a<=b) return x>=a && x<b; return x>=a || x<b; }
function houseOf(lon:number, cusps:number[]){
  const L = ((lon%360)+360)%360;
  for(let i=0;i<12;i++){
    const a = ((cusps[i] ?? 0)%360+360)%360;
    const b = ((cusps[(i+1)%12] ?? 0)%360+360)%360;
    if (inArc(L,a,b)) return i+1;
  }
  return 12;
}

export async function computeChart(input: BirthInput){
  const dateParts = input.date.split('-').map(Number);
  const timeParts = input.time.split(':').map(Number);
  
  const year = dateParts[0] ?? 2000;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;
  
  // Convert to UTC time
  const utcHour = hour - input.tzOffset;
  let adjustedYear = year;
  let adjustedMonth = month;
  let adjustedDay = day;
  let adjustedHour = utcHour;
  
  // Handle day/month/year adjustments for timezone conversion
  if (adjustedHour < 0) {
    adjustedHour += 24;
    adjustedDay -= 1;
    if (adjustedDay < 1) {
      adjustedMonth -= 1;
      if (adjustedMonth < 1) {
        adjustedMonth = 12;
        adjustedYear -= 1;
      }
      // Approximate days in month
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (adjustedMonth === 2 && adjustedYear % 4 === 0) {
        daysInMonth[1] = 29; // Leap year
      }
      adjustedDay = daysInMonth[adjustedMonth - 1] ?? 31;
    }
  } else if (adjustedHour >= 24) {
    adjustedHour -= 24;
    adjustedDay += 1;
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (adjustedMonth === 2 && adjustedYear % 4 === 0) {
      daysInMonth[1] = 29; // Leap year
    }
    if (adjustedDay > (daysInMonth[adjustedMonth - 1] ?? 31)) {
      adjustedDay = 1;
      adjustedMonth += 1;
      if (adjustedMonth > 12) {
        adjustedMonth = 1;
        adjustedYear += 1;
      }
    }
  }

  const computeInput: ComputeInput = {
    year: adjustedYear,
    month: adjustedMonth,
    day: adjustedDay,
    hour: Math.floor(adjustedHour),
    minute: minute,
    second: (adjustedHour % 1) * 60,
    lat: input.lat,
    lon: input.lon,
    houseSystem: input.houseSystem || 'P'
  };

  const adapter = await getEphemerisAdapter();
  const result = await adapter.compute(computeInput);

  // Convert to expected format
  const planets = result.planets.map(p => ({
    key: p.name,
    lon: p.lon,
    lat: p.lat,
    speed: 0, // astronomy-engine doesn't provide speed directly
    sign: signOf(p.lon),
    house: result.houses ? houseOf(p.lon, result.houses.cusps) : 1
  }));

  const houses = result.houses ? {
    cusps: result.houses.cusps,
    asc: result.houses.asc,
    mc: result.houses.mc
  } : {
    cusps: new Array(12).fill(0),
    asc: 0,
    mc: 0
  };

  return {
    jdUT: result.jdUt,
    planets,
    houses,
    bigThree: {
      Sun: planets.find(p=>p.key==='Sun')?.sign ?? '',
      Moon: planets.find(p=>p.key==='Moon')?.sign ?? '',
      Ascendant: result.houses ? signOf(result.houses.asc) : ''
    }
  };
}