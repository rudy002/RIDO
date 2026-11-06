// Génère lib/places/data/<PAYS>.json à partir des exports GeoNames (https://www.geonames.org, CC BY 4.0).
//
// 1. Télécharger dans un dossier vide :
//      https://download.geonames.org/export/dump/<PAYS>.zip
//      https://download.geonames.org/export/dump/alternatenames/<PAYS>.zip  (dans alt/)
// 2. Dézipper les deux, puis : node scripts/build-places.mjs <PAYS> <dossier>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [country, dir] = process.argv.slice(2);
if (!country || !dir) {
  console.error('Usage : node scripts/build-places.mjs <PAYS> <dossier GeoNames>');
  process.exit(1);
}

// Lieux habités, sans les lieux abandonnés (PPLQ), historiques (PPLH) ni les bases (PPLR).
const CITY_CODES = new Set(['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLL', 'STLMT']);
const NEIGHBORHOOD_CODE = 'PPLX';
const LANGUAGES = ['he', 'fr', 'en'];
// Quartier rattaché à la grande ville qui « l'attire » le plus (distance pondérée par la population :
// le centre officiel d'une métropole est parfois loin de ses quartiers), sinon à la ville la plus proche.
const BIG_CITY_POPULATION = 20000;
const BIG_CITY_RADIUS_KM = 10;
const ANY_CITY_RADIUS_KM = 5;

// Signes de translittération savante (« Yitsẖaq », « Rīna ») retirés, accents français conservés.
const TRANSLITERATION_MARKS = /[\u0304\u0306\u0323\u0331\u0332]/g;
const cleanLatin = (name) =>
  name.normalize('NFD').replace(TRANSLITERATION_MARKS, '').normalize('NFC');

const HEBREW_LETTER = /[\u05d0-\u05ea]/;

const lines = (file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'));

const places = new Map();
for (const c of lines(join(dir, `${country}.txt`))) {
  const [id, name, , , lat, lng, featureClass, code, , , , , , , population] = c;
  if (featureClass !== 'P') continue;
  const kind = CITY_CODES.has(code) ? 'city' : code === NEIGHBORHOOD_CODE ? 'neighborhood' : null;
  if (!kind) continue;
  places.set(id, {
    id,
    kind,
    names: { en: cleanLatin(name) },
    lat: Number(lat),
    lng: Number(lng),
    population: Number(population) || 0,
  });
}

// Noms par langue : nom préféré d'abord, sinon le premier nom courant (ni historique, ni familier).
const ranked = new Map();
for (const c of lines(join(dir, 'alt', `${country}.txt`))) {
  const [, id, language, name, preferred, , colloquial, historic] = c;
  const place = places.get(id);
  if (!place || !LANGUAGES.includes(language) || historic === '1' || colloquial === '1') continue;
  // Certains noms marqués « he » sont en lettres latines : on garde seulement le vrai hébreu.
  if (language === 'he' && !HEBREW_LETTER.test(name)) continue;
  const key = `${id}:${language}`;
  const rank = preferred === '1' ? 0 : 1;
  if (!ranked.has(key) || rank < ranked.get(key)) {
    ranked.set(key, rank);
    place.names[language] = language === 'he' ? name : cleanLatin(name);
  }
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function nearest(place, candidates, radiusKm, weighted) {
  let best = null;
  for (const city of candidates) {
    const d = distanceKm(place, city);
    if (d > radiusKm) continue;
    const score = weighted ? d / Math.sqrt(city.population) : d;
    if (!best || score < best.score) best = { city, score };
  }
  return best?.city ?? null;
}

const cities = [...places.values()].filter((p) => p.kind === 'city');
const bigCities = cities.filter((p) => p.population >= BIG_CITY_POPULATION);

const output = [...places.values()]
  .map((p) => {
    const parent =
      p.kind === 'neighborhood'
        ? (nearest(p, bigCities, BIG_CITY_RADIUS_KM, true) ??
          nearest(p, cities, ANY_CITY_RADIUS_KM, false))
        : null;
    return {
      id: p.id,
      kind: p.kind,
      names: p.names,
      // Précision ~100 m : on ne manipule que des villes et quartiers, jamais d'adresse exacte.
      lat: Math.round(p.lat * 1000) / 1000,
      lng: Math.round(p.lng * 1000) / 1000,
      population: p.population,
      ...(parent ? { cityId: parent.id } : {}),
    };
  })
  // Un quartier sans ville de rattachement serait ambigu dans les suggestions.
  .filter((p) => p.kind === 'city' || p.cityId)
  .sort((a, b) => b.population - a.population || a.names.en.localeCompare(b.names.en));

const target = join('lib', 'places', 'data', `${country}.json`);
writeFileSync(target, JSON.stringify(output));
console.log(`${target} : ${output.length} lieux`);
