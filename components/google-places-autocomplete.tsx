'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = 'Enter location...',
  disabled = false
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (typeof window !== 'undefined') {
        const google = (window as any).google;
        if (!google?.maps?.places) {
          const script = document.createElement('script');
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
          
          if (!apiKey) {
            console.warn('[v0] Google Places API key not configured');
            return;
          }

          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
      }
    };

    loadGoogleMapsScript();
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    const google = (window as any).google;
    if (!inputValue.trim() || !google?.maps?.places) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setLoading(true);
    try {
      const placesService = new google.maps.places.AutocompleteService();
      const response = await placesService.getPlacePredictions({
        input: inputValue,
        componentRestrictions: { country: 'ae' }, // Restrict to UAE, modify as needed
        types: ['(regions)', 'geocode']
      });

      setPredictions(response.predictions || []);
      setShowPredictions(true);
    } catch (error) {
      console.error('[v0] Google Places error:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrediction = async (prediction: any) => {
    onChange(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    // Optionally fetch detailed place info
    const google = (window as any).google;
    if (google?.maps?.places) {
      try {
        const placesService = new google.maps.places.PlacesService(document.createElement('div'));
        placesService.getDetails({
          placeId: prediction.place_id,
          fields: ['formatted_address', 'geometry', 'address_components']
        }, (place: any) => {
          console.log('[v0] Place details:', place);
        });
      } catch (error) {
        console.error('[v0] Error getting place details:', error);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {loading && (
          <div className="absolute right-3">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {predictions.map((prediction, index) => (
            <button
              key={`${prediction.place_id}-${index}`}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-accent/10 transition-colors border-b border-border last:border-0 focus:outline-none"
            >
              <p className="text-sm font-medium">{prediction.main_text}</p>
              <p className="text-xs text-muted-foreground">{prediction.secondary_text}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
