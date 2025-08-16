'use client';

import { useState, useEffect } from 'react';

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

interface ChartResultsProps {
  data: ChartData;
  name: string;
  isLoading?: boolean;
}

// Skeleton component for loading state
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

function BigThreeCard({ title, value, isLoading }: { title: string; value: string; isLoading: boolean }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
      {isLoading ? (
        <>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-20" />
        </>
      ) : (
        <>
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
            {title}
          </div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </>
      )}
    </div>
  );
}

export default function ChartResults({ data, name, isLoading = false }: ChartResultsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && data) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Big Three Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <BigThreeCard title="Солнце" value="" isLoading={true} />
            <BigThreeCard title="Луна" value="" isLoading={true} />
            <BigThreeCard title="Асцендент" value="" isLoading={true} />
          </div>

          {/* Planets Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>

          {/* Houses Skeleton */}
          <div>
            <Skeleton className="h-5 w-16 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Натальная карта: {name}
          </h3>
          <div className="text-sm text-gray-500">
            JD: {data.jdUT.toFixed(5)}
          </div>
        </div>

        {/* Big Three */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <BigThreeCard 
            title="Солнце" 
            value={data.bigThree.Sun} 
            isLoading={false}
          />
          <BigThreeCard 
            title="Луна" 
            value={data.bigThree.Moon} 
            isLoading={false}
          />
          <BigThreeCard 
            title="Асцендент" 
            value={data.bigThree.Ascendant} 
            isLoading={false}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Planets */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
              Планеты
            </h4>
            
            <div className="space-y-3">
              {data.planets.map((planet, index) => (
                <div 
                  key={planet.key}
                  className={`p-3 bg-gray-50 rounded-lg border transition-all duration-300 ease-out ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900">{planet.key}</div>
                    <div className="text-sm text-gray-600">
                      Дом {planet.house}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-blue-600 font-medium">{planet.sign}</div>
                    <div className="text-xs text-gray-500">
                      {planet.lon.toFixed(2)}°
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Houses */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21V9m8 12V9" />
              </svg>
              Дома
            </h4>
            
            <div className="space-y-2">
              {data.houses.cusps.map((cusp, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center p-2 bg-gray-50 rounded transition-all duration-300 ease-out ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                  style={{ transitionDelay: `${index * 30}ms` }}
                >
                  <span className="font-medium text-gray-700">
                    {index + 1} дом
                  </span>
                  <span className="text-purple-600 font-mono">
                    {cusp.toFixed(2)}°
                  </span>
                </div>
              ))}
              
              {/* ASC and MC */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div 
                  className={`flex justify-between items-center p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded transition-all duration-300 ease-out ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                  style={{ transitionDelay: '360ms' }}
                >
                  <span className="font-semibold text-orange-700">ASC</span>
                  <span className="text-orange-600 font-mono font-semibold">
                    {data.houses.asc.toFixed(2)}°
                  </span>
                </div>
                
                <div 
                  className={`flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded transition-all duration-300 ease-out ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                  style={{ transitionDelay: '390ms' }}
                >
                  <span className="font-semibold text-blue-700">MC</span>
                  <span className="text-blue-600 font-mono font-semibold">
                    {data.houses.mc.toFixed(2)}°
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}