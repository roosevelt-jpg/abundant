'use client';

import { useState, useEffect } from 'react';
import { CountrySelect } from '@/components/country-select';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { MemberProfile } from '@/lib/types';

interface MemberLocationFieldsProps {
  value: MemberProfile;
  onChange: (profile: MemberProfile) => void;
  /** Show citizenship field (default true) */
  showCitizenship?: boolean;
}

export function MemberLocationFields({
  value,
  onChange,
  showCitizenship = true,
}: MemberLocationFieldsProps) {
  const [city, setCity] = useState(value.city || '');
  const residence = value.countryOfResidence || value.country || '';

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
        value={residence}
        onChange={(code) => {
          update({
            country: code,
            countryOfResidence: code,
            nationality: value.nationality || code,
            citizenship: value.citizenship || value.nationality || code,
          });
        }}
        required
      />

      <CountrySelect
        label="Nationality"
        value={value.nationality || residence}
        onChange={(code) => update({ nationality: code })}
        required
      />

      {showCitizenship && (
        <CountrySelect
          label="Citizenship"
          value={value.citizenship || value.nationality || residence}
          onChange={(code) => update({ citizenship: code })}
          required
        />
      )}

      <PlacesAutocomplete
        label="City / Location"
        value={city}
        onChange={setCity}
        onPlaceSelect={(place) => {
          const nextCity = place.city || place.formattedAddress;
          setCity(nextCity);
          update({
            city: nextCity,
            // Keep country fields on ISO codes from CountrySelect; only fill if empty
            country: value.country || place.country || residence,
            countryOfResidence: value.countryOfResidence || value.country || place.country || residence,
          });
        }}
        types={['(cities)']}
        countryCode={residence}
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
          });
          if (place.city) setCity(place.city);
        }}
        types={['address']}
        countryCode={residence}
        placeholder="Search for your address..."
      />
    </div>
  );
}
