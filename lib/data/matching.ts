import type { Language } from '@/lib/i18n';
import { cityOf, describePlace, distanceKm } from '@/lib/places/places';
import type { Zone } from '@/lib/rides/types';

/**
 * Rayon « près de chez toi », à vol d'oiseau : sa ville et ses voisines immédiates
 * (Ashdod – Gan Yavne : 5 km). Les vrais itinéraires viendront avec la v1b.
 */
export const NEARBY_RADIUS_KM = 12;

export type ZoneRelation = {
  sameCity: boolean;
  /** Distance entre deux villes différentes, si les deux lieux sont connus. */
  distanceKm?: number;
  /** Un des lieux est une saisie libre : on ne peut pas mesurer la distance. */
  unknown: boolean;
};

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s\-–—_.,()'’]+/g, ' ')
    .trim();

/** Clé de ville d'une zone : la ville GeoNames, sinon le texte saisi (première partie avant la virgule). */
export function cityKeyOf(zone: Zone): string {
  if (zone.placeId) {
    const city = cityOf(zone.placeId);
    if (city) return `place:${city.id}`;
  }
  return `text:${normalize(zone.name.split(',')[0] ?? zone.name)}`;
}

/** Les deux zones sont-elles dans la même ville, sinon à quelle distance ? */
export function relateZones(a: Zone, b: Zone): ZoneRelation {
  const sameCity = cityKeyOf(a) === cityKeyOf(b);
  if (sameCity) return { sameCity, unknown: false };
  if (!a.placeId || !b.placeId) return { sameCity, unknown: true };
  const distance = distanceKm(a.placeId, b.placeId);
  return distance === undefined
    ? { sameCity, unknown: true }
    : { sameCity, distanceKm: distance, unknown: false };
}

/** Même ville ou ville voisine (dans le rayon). */
export function isNearby(relation: ZoneRelation): boolean {
  return (
    relation.sameCity ||
    (relation.distanceKm !== undefined && relation.distanceKm <= NEARBY_RADIUS_KM)
  );
}

/** Ville (et quartier) d'une zone dans la langue active ; le texte saisi pour une zone libre. */
export function describeZone(zone: Zone, language: Language): { city: string; area?: string } {
  const place = zone.placeId ? describePlace(zone.placeId, language) : undefined;
  return place ?? { city: zone.name };
}

/** « Florentin, Tel-Aviv » ou « Ashdod » : la zone en une ligne. */
export function zoneLabel(zone: Zone, language: Language): string {
  const { city, area } = describeZone(zone, language);
  return area ? `${area}, ${city}` : city;
}
