import type { Language } from '@/lib/i18n';
import type { CountryCode } from '@/lib/phone/phone';

import IL from './data/IL.json';

// Villes et quartiers issus de GeoNames (CC BY 4.0), générés par scripts/build-places.mjs.

export type PlaceKind = 'city' | 'neighborhood';

export type Place = {
  id: string;
  kind: PlaceKind;
  names: Partial<Record<Language, string>> & { en: string };
  lat: number;
  lng: number;
  population: number;
  /** Ville de rattachement d'un quartier. */
  cityId?: string;
};

/** Suggestion prête à afficher : « Florentin » + « Tel-Aviv ». */
export type PlaceSuggestion = { id: string; name: string; city?: string };

// Seuls les pays où ont lieu des événements sont intégrés à l'appli.
const PLACES: Partial<Record<CountryCode, Place[]>> = { IL: IL as Place[] };

const MAX_SUGGESTIONS = 6;

export function hasPlaces(country: CountryCode): boolean {
  return Boolean(PLACES[country]?.length);
}

function nameOf(place: Place, language: Language): string {
  return place.names[language] ?? place.names.en;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u0591-\u05c7`'‘’ʼ]/g, '')
    .toLowerCase()
    .replace(/[\s\-–—_.,()/]+/g, ' ')
    .trim();
}

type SearchIndex = {
  entries: { place: Place; keys: string[] }[];
  byId: Map<string, Place>;
};

// Index de recherche : tous les noms connus (he, fr, en) normalisés, calculé une fois par pays.
const searchIndexes = new Map<CountryCode, SearchIndex>();

function indexOf(country: CountryCode): SearchIndex {
  let index = searchIndexes.get(country);
  if (!index) {
    const places = PLACES[country] ?? [];
    index = {
      entries: places.map((place) => ({
        place,
        keys: [...new Set(Object.values(place.names).map(normalize))],
      })),
      byId: new Map(places.map((place) => [place.id, place])),
    };
    searchIndexes.set(country, index);
  }
  return index;
}

/**
 * Villes et quartiers dont un nom commence par la saisie (ou contient un mot qui commence par elle),
 * les plus peuplés d'abord.
 */
export function searchPlaces(
  country: CountryCode,
  query: string,
  language: Language
): PlaceSuggestion[] {
  const needle = normalize(query);
  if (!needle) return [];
  const { entries, byId } = indexOf(country);

  const scored: { place: Place; score: number }[] = [];
  for (const { place, keys } of entries) {
    const prefix = keys.some((key) => key.startsWith(needle));
    const word = !prefix && keys.some((key) => key.includes(` ${needle}`));
    if (prefix || word) scored.push({ place, score: prefix ? 0 : 1 });
  }

  return scored
    .sort((a, b) => a.score - b.score || b.place.population - a.place.population)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ place }) => {
      const city = place.cityId ? byId.get(place.cityId) : undefined;
      return {
        id: place.id,
        name: nameOf(place, language),
        ...(city ? { city: nameOf(city, language) } : {}),
      };
    });
}
