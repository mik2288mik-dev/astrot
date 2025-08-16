'use client';

import { useState } from 'react';
import FormCard from '@/components/chart/FormCard';
import ChartResults from '@/components/chart/ChartResults';
import { PlaceResult } from '@/lib/geo/geocode';

interface Planet {
  key: string;
  lon: number;
  lat: number;
  speed: number;
  sign: string;
  house: number;
}

interface Houses {
  cusps: number[];
  asc: number;
  mc: number;
}

interface ChartData {
  jdUT: number;
  planets: Planet[];
  houses: Houses;
  bigThree: {
    Sun: string;
    Moon: string;
    Ascendant: string;
  };
}

interface FormSubmitData {
  name: string;
  date: string;
  time: string;
  unknownTime: boolean;
  place: string;
  selectedPlace: PlaceResult | null;
  timezone: string;
  houseSystem: 'P' | 'W' | 'K' | 'E';
  lat: number;
  lon: number;
  tzOffset: number;
}

export default function ChartPage() {
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [error, setError] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const handleFormSubmit = async (formData: FormSubmitData) => {
    setError('');
    setChart(null);
    setLoading(true);
    setUserName(formData.name);

    try {
      const response = await fetch('/api/chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
          tzOffset: formData.tzOffset,
          lat: formData.lat,
          lon: formData.lon,
          houseSystem: formData.houseSystem,
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Ошибка расчёта карты');
      }

      setChart(result.chart);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setChart(null);
    setError('');
    setUserName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Form */}
          <FormCard
            onSubmit={handleFormSubmit}
            loading={loading}
            error={error}
            onReset={handleReset}
          />

          {/* Results */}
          {(loading || chart) && (
            <ChartResults
              data={chart!}
              name={userName}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}