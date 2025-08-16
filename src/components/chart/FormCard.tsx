'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PlaceResult } from '@/lib/geo/geocode';
import { getTimezone, getTimezoneOffset } from '@/lib/geo/timezone';

interface FormData {
  name: string;
  date: string;
  time: string;
  unknownTime: boolean;
  place: string;
  selectedPlace: PlaceResult | null;
  timezone: string;
  houseSystem: 'P' | 'W' | 'K' | 'E';
}

interface FormCardProps {
  onSubmit: (data: FormData & { lat: number; lon: number; tzOffset: number }) => Promise<void>;
  loading?: boolean;
  error?: string;
  onReset?: () => void;
}

const HOUSE_SYSTEMS = [
  { value: 'P', label: 'Placidus' },
  { value: 'W', label: 'Whole Sign' },
  { value: 'K', label: 'Koch' },
  { value: 'E', label: 'Equal' },
] as const;

export default function FormCard({ onSubmit, loading = false, error, onReset }: FormCardProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    date: '',
    time: '',
    unknownTime: false,
    place: '',
    selectedPlace: null,
    timezone: '',
    houseSystem: 'P',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced place search
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setPlacesLoading(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.places) {
        setPlaceSuggestions(data.places);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Place search error:', error);
      setPlaceSuggestions([]);
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  // Handle place input change with debouncing
  const handlePlaceChange = (value: string) => {
    setFormData(prev => ({ ...prev, place: value, selectedPlace: null }));
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  // Handle place selection
  const selectPlace = async (place: PlaceResult) => {
    setFormData(prev => ({
      ...prev,
      place: place.cityLikeLabel,
      selectedPlace: place,
    }));
    
    setShowSuggestions(false);
    
    // Get timezone for selected place
    const timezone = getTimezone(place.lat, place.lon);
    setFormData(prev => ({ ...prev, timezone }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      date: '',
      time: '',
      unknownTime: false,
      place: '',
      selectedPlace: null,
      timezone: '',
      houseSystem: 'P',
    });
    setShowAdvanced(false);
    setPlaceSuggestions([]);
    setShowSuggestions(false);
    onReset?.();
  };

  // Form validation
  const isValid = formData.name.trim() && 
                  formData.date && 
                  (formData.time || formData.unknownTime) && 
                  formData.selectedPlace;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || !formData.selectedPlace) return;

    const timeToUse = formData.unknownTime ? '12:00' : formData.time;
    const tzOffset = getTimezoneOffset(formData.timezone);

    await onSubmit({
      ...formData,
      time: timeToUse,
      lat: formData.selectedPlace.lat,
      lon: formData.selectedPlace.lon,
      tzOffset,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Данные рождения</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Имя *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Введите ваше имя"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Дата рождения *
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Время рождения *
                </label>
                <input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  disabled={formData.unknownTime}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                  required={!formData.unknownTime}
                />
                <div className="mt-2">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.unknownTime}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        unknownTime: e.target.checked,
                        time: e.target.checked ? '' : prev.time
                      }))}
                      className="mr-2 rounded"
                    />
                    Не знаю точное время
                  </label>
                </div>
                {formData.unknownTime && (
                  <p className="text-xs text-amber-600 mt-1">
                    Будет использовано 12:00 (точность снижена)
                  </p>
                )}
              </div>
            </div>

            {/* Place */}
            <div className="relative" ref={suggestionsRef}>
              <label htmlFor="place" className="block text-sm font-medium text-gray-700 mb-2">
                Место рождения *
              </label>
              <input
                id="place"
                type="text"
                value={formData.place}
                onChange={(e) => handlePlaceChange(e.target.value)}
                placeholder="Начните вводить город..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
                autoComplete="off"
              />
              
              {/* Loading indicator */}
              {placesLoading && (
                <div className="absolute right-3 top-12 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Suggestions dropdown */}
              {showSuggestions && placeSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {placeSuggestions.map((place, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectPlace(place)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{place.cityLikeLabel}</div>
                      <div className="text-sm text-gray-500 truncate">{place.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Section Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <span>Дополнительно</span>
            <svg
              className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coordinates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Координаты
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.selectedPlace ? formData.selectedPlace.lat.toFixed(4) : ''}
                      placeholder="Широта"
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                      readOnly
                    />
                    <input
                      type="text"
                      value={formData.selectedPlace ? formData.selectedPlace.lon.toFixed(4) : ''}
                      placeholder="Долгота"
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                      readOnly
                    />
                  </div>
                </div>

                {/* Timezone and House System */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Часовой пояс
                    </label>
                    <input
                      type="text"
                      value={formData.timezone}
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="houseSystem" className="block text-sm font-medium text-gray-700 mb-2">
                      Система домов
                    </label>
                    <select
                      id="houseSystem"
                      value={formData.houseSystem}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        houseSystem: e.target.value as 'P' | 'W' | 'K' | 'E'
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {HOUSE_SYSTEMS.map(system => (
                        <option key={system.value} value={system.value}>
                          {system.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Рассчитываю...
                </span>
              ) : (
                'Рассчитать карту'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Новый расчёт
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}