const COUNTRY_STATE_CITY_BASE_URL = 'https://api.countrystatecity.in/v1';
const COLOMBIA_ISO2 = 'CO';
const COUNTRY_STATE_CITY_API_KEY = process.env.EXPO_PUBLIC_CSC_API_KEY ?? '';

export type LocationOption = {
  label: string;
  value: string;
};

type CountryStateCityState = {
  id: number;
  name: string;
  iso2: string;
};

type CountryStateCityCity = {
  id: number;
  name: string;
};

export function isCountryStateCityConfigured(): boolean {
  return COUNTRY_STATE_CITY_API_KEY.trim().length > 0;
}

function getCountryStateCityHeaders(): HeadersInit {
  if (!isCountryStateCityConfigured()) {
    throw new Error('Falta configurar EXPO_PUBLIC_CSC_API_KEY para cargar municipios y ciudades');
  }

  return {
    'Content-Type': 'application/json',
    'X-CSCAPI-KEY': COUNTRY_STATE_CITY_API_KEY,
  };
}

async function fetchCountryStateCity<T>(path: string): Promise<T> {
  const response = await fetch(`${COUNTRY_STATE_CITY_BASE_URL}${path}`, {
    headers: getCountryStateCityHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    const message =
      body && body !== '[object Object]'
        ? body
        : `No se pudo cargar la informacion de ubicacion (${response.status})`;

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function getColombiaMunicipalities(): Promise<LocationOption[]> {
  const states = await fetchCountryStateCity<CountryStateCityState[]>(
    `/countries/${COLOMBIA_ISO2}/states`
  );

  return states
    .map((state) => ({
      label: state.name,
      value: state.iso2,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export async function getColombiaCities(stateIso2: string): Promise<LocationOption[]> {
  if (!stateIso2) return [];

  const cities = await fetchCountryStateCity<CountryStateCityCity[]>(
    `/countries/${COLOMBIA_ISO2}/states/${stateIso2}/cities`
  );

  return cities
    .map((city) => ({
      label: city.name,
      value: city.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}
