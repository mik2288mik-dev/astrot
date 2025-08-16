import tzlookup from 'tz-lookup';

export function getTimezone(lat: number, lon: number): string {
  try {
    // Валидация входных параметров
    if (isNaN(lat) || isNaN(lon)) {
      return 'UTC';
    }
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return 'UTC';
    }

    const timezone = tzlookup(lat, lon);
    return timezone || 'UTC';
  } catch (error) {
    console.error('Timezone lookup error:', error);
    return 'UTC';
  }
}

export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    return Math.round(offset * 100) / 100; // Округляем до 2 знаков
  } catch (error) {
    console.error('Timezone offset error:', error);
    return 0;
  }
}