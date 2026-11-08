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

// Signes de translittération savante retirés (« Yitsẖaq », « Rīna », le ‘ du ayin dans « Giv‘atayim »),
// accents français conservés. L'apostrophe de l'aleph (« Be’er ») reste.
const TRANSLITERATION_MARKS = /[\u0304\u0306\u0323\u0331\u0332\u2018\u02bf]/g;
// Marques de sens invisibles (RLM, LRM…) parfois collées aux noms.
const BIDI_CONTROLS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const clean = (name) => name.replace(BIDI_CONTROLS, '').trim();
// Abréviations hébraïques : gershayim (״) et geresh (׳) plutôt que des apostrophes (« רובע י’’א »).
const cleanHebrew = (name) =>
  clean(name)
    .replace(/(’’|''|")/g, '\u05f4')
    .replace(/([\u05d0-\u05ea])[’'‘]/g, '$1\u05f3');
const cleanLatin = (name) =>
  clean(name).normalize('NFD').replace(TRANSLITERATION_MARKS, '').normalize('NFC');

const HEBREW_LETTER = /[\u05d0-\u05ea]/;
const LATIN_ONLY = /^[\p{Script=Latin}\s'’\-.()]+$/u;
// Codes GeoNames qui ne sont pas des noms (liens, codes postaux, aéroports…).
const NOT_A_NAME = new Set([
  'link',
  'post',
  'iata',
  'icao',
  'faac',
  'abbr',
  'wkdt',
  'unlc',
  'fr_1793',
]);
// Autres orthographes gardées pour la recherche seulement (« Ashkelon », « Ashqelon »…).
const MAX_ALIASES = 6;

// Noms usuels qui manquent ou sont trop savants dans GeoNames, pour les plus grandes villes.
const OVERRIDES = {
  295620: { fr: 'Ashkelon', en: 'Ashkelon' },
  293703: { en: 'Rishon LeZion' },
  293222: { en: 'Yavne' },
  293322: { en: 'Tiberias' },
  294097: { fr: 'Nof HaGalil', en: 'Nof HaGalil' },
  293822: { en: 'Kiryat Yam' },
  293943: { en: 'Pardes Hanna-Karkur', fr: 'Pardès Hanna-Karkour' },
  8199378: { he: 'מודיעין עילית', en: 'Modiin Illit' },
  293690: { he: 'ראש העין', en: 'Rosh HaAyin' },
};

const normalizeForSearch = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f'’‘]/g, '')
    .toLowerCase()
    .replace(/[\s\-.]+/g, ' ')
    .trim();

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
    aliases: new Set(),
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
  if (!place || historic === '1') continue;
  // Toute orthographe latine courante sert à la recherche, quelle que soit sa langue.
  if (
    !NOT_A_NAME.has(language) &&
    LATIN_ONLY.test(cleanLatin(name)) &&
    cleanLatin(name).length > 2
  ) {
    place.aliases.add(cleanLatin(name));
  }
  if (!LANGUAGES.includes(language) || colloquial === '1') continue;
  // Certains noms marqués « he » sont en lettres latines : on garde seulement le vrai hébreu.
  if (language === 'he' && !HEBREW_LETTER.test(name)) continue;
  const key = `${id}:${language}`;
  const rank = preferred === '1' ? 0 : 1;
  if (!ranked.has(key) || rank < ranked.get(key)) {
    ranked.set(key, rank);
    place.names[language] = language === 'he' ? cleanHebrew(name) : cleanLatin(name);
  }
}

for (const [id, names] of Object.entries(OVERRIDES)) {
  const place = places.get(id);
  if (place) Object.assign(place.names, names);
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
    const known = new Set(Object.values(p.names).map(normalizeForSearch));
    const aliases = [];
    for (const alias of [...p.aliases].sort((a, b) => a.length - b.length)) {
      const key = normalizeForSearch(alias);
      if (known.has(key) || aliases.length >= MAX_ALIASES) continue;
      known.add(key);
      aliases.push(alias);
    }
    return {
      id: p.id,
      kind: p.kind,
      names: p.names,
      ...(aliases.length > 0 ? { aliases } : {}),
      // Précision ~100 m : on ne manipule que des villes et quartiers, jamais d'adresse exacte.
      lat: Math.round(p.lat * 1000) / 1000,
      lng: Math.round(p.lng * 1000) / 1000,
      population: p.population,
      ...(parent ? { cityId: parent.id } : {}),
    };
  })
  // Un quartier sans ville de rattachement serait ambigu dans les suggestions.
  .filter((p) => p.kind === 'city' || p.cityId)
  // Même quartier enregistré deux fois (« Rova‘ HaKirya » / « Rova‘ HaQirya ») : on n'en garde qu'un.
  .filter((p, index, all) => {
    if (p.kind !== 'neighborhood' || !p.names.he) return true;
    return all.findIndex((q) => q.cityId === p.cityId && q.names.he === p.names.he) === index;
  })
  .sort((a, b) => b.population - a.population || a.names.en.localeCompare(b.names.en));

const target = join('lib', 'places', 'data', `${country}.json`);
writeFileSync(target, JSON.stringify(output));
console.log(`${target} : ${output.length} lieux`);
