'use client';

import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { MapPin } from 'lucide-react';

export interface PlaceResult {
  formattedAddress: string;
  name?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceResult) => void;
  label?: string;
  placeholder?: string;
  types?: string[];
  countryCode?: string;
  required?: boolean;
  className?: string;
}

function parseAddressComponents(components?: google.maps.places.GeocoderAddressComponent[]): Partial<PlaceResult> {
  if (!components) return {};
  let city = '';
  let country = '';

  for (const c of components) {
    if (c.types.includes('locality')) city = c.long_name;
    else if (c.types.includes('administrative_area_level_1') && !city) city = c.long_name;
    if (c.types.includes('country')) country = c.short_name;
  }

  return { city, country };
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  label,
  placeholder = 'Start typing an address...',
  types = ['geocode', 'establishment'],
  countryCode,
  required = false,
  className = '',
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const { ready, error, configured } = useGoogleMaps();
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onChange, onPlaceSelect]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google?.maps?.places) return;

    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    const options: google.maps.places.AutocompleteOptions = {
      types,
      fields: ['formatted_address', 'name', 'place_id', 'geometry', 'address_components'],
    };

    if (countryCode) {
      options.componentRestrictions = { country: countryCode.toLowerCase() };
    }

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, options);
    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const formatted = place.formatted_address || place.name || '';
      const parsed = parseAddressComponents(place.address_components);

      setInputValue(formatted);
      onChangeRef.current(formatted);

      onPlaceSelectRef.current?.({
        formattedAddress: formatted,
        name: place.name,
        placeId: place.place_id,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
        city: parsed.city,
        country: parsed.country,
      });
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [ready, countryCode, types.join(',')]);

  const inputCls =
    'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && ' *'}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={configured ? placeholder : 'Enter location manually (Google Maps not configured)'}
          required={required}
          className={`${inputCls} pl-10`}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {!configured && (
        <p className="text-xs text-muted-foreground mt-1">
          Add Google Maps API key in Settings → Integrations for autocomplete
        </p>
      )}
    </div>
  );
}
