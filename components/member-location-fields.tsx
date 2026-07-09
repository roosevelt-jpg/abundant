'use client';

import { useState, useEffect } from 'react';
import { CountrySelect } from '@/components/country-select';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { MemberProfile } from '@/lib/types';

interface MemberLocationFieldsProps {
  value: MemberProfile;
  onChange: (profile: MemberProfile) => void;
}

export function MemberLocationFields({ value, onChange }: MemberLocationFieldsProps) {
  const [city, setCity] = useState(value.city || '');

  useEffect(() => {
    if (value.city) setCity(value.city);
  }, [value.city]);

  const update = (partial: Partial<MemberProfile>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="space-y-4">
      <CountrySelect
        label="Country of Residence"
        value={value.country || ''}
        onChange={(code) => {
          update({
            country: code,
            nationality: value.nationality || code,
          });
        }}
        required
      />

      <CountrySelect
        label="Nationality"
        value={value.nationality || value.country || ''}
        onChange={(code) => update({ nationality: code })}
        required
      />

      <PlacesAutocomplete
        label="City"
        value={city}
        onChange={setCity}
        onPlaceSelect={(place) => {
          const nextCity = place.city || place.formattedAddress;
          setCity(nextCity);
          update({
            city: nextCity,
            country: place.country || value.country,
          });
        }}
        types={['(cities)']}
        countryCode={value.country}
        placeholder="Search for your city..."
        required
      />

      <PlacesAutocomplete
        label="Address"
        value={value.address || ''}
        onChange={(addr) => update({ address: addr })}
        onPlaceSelect={(place) => {
          update({
            address: place.formattedAddress,
            locationPlaceId: place.placeId,
            city: place.city || value.city || city,
            country: place.country || value.country,
          });
          if (place.city) setCity(place.city);
        }}
        types={['address']}
        countryCode={value.country}
        placeholder="Search for your address..."
        required
      />
    </div>
  );
}
