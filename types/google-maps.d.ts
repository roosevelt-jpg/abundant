declare namespace google.maps.places {
  interface AutocompleteOptions {
    types?: string[];
    fields?: string[];
    componentRestrictions?: { country: string | string[] };
  }

  interface Autocomplete {
    getPlace(): PlaceResult;
    addListener(event: string, handler: () => void): void;
  }

  interface PlaceResult {
    formatted_address?: string;
    name?: string;
    place_id?: string;
    geometry?: {
      location?: { lat(): number; lng(): number };
    };
    address_components?: GeocoderAddressComponent[];
  }

  interface GeocoderAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  class Autocomplete {
    constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
    getPlace(): PlaceResult;
    addListener(event: string, handler: () => void): void;
  }
}

declare namespace google.maps {
  function importLibrary(name: string): Promise<unknown>;

  namespace event {
    function clearInstanceListeners(instance: object): void;
  }

  namespace places {
    class Autocomplete {
      constructor(input: HTMLInputElement, opts?: google.maps.places.AutocompleteOptions);
      getPlace(): google.maps.places.PlaceResult;
      addListener(event: string, handler: () => void): void;
    }
  }
}

interface Window {
  google?: {
    maps: typeof google.maps;
  };
}
