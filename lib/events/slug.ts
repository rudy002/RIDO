// Mots sans intérêt dans un lien : « Mariage de Léa et Samuel » → « lea-samuel ».
const FILLER_WORDS = new Set([
  'de',
  'd',
  'du',
  'des',
  'la',
  'le',
  'les',
  'l',
  'et',
  'a',
  'au',
  'aux',
  'chez',
  'pour',
  'the',
  'and',
  'of',
  's',
  'mariage',
  'anniversaire',
  'festival',
  'bar',
  'bat',
  'mitzvah',
  'evenement',
  'wedding',
  'birthday',
  'party',
  'event',
]);

const FALLBACK_SLUG = 'evenement';
const MAX_LENGTH = 40;

/** Identifiant lisible pour le lien de partage, à partir du nom de l'événement. */
export function eventSlug(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-֑ͯ-ׇ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9א-ת]+/)
    .filter((word) => word.length > 0);
  const meaningful = words.filter((word) => !FILLER_WORDS.has(word));
  const slug = (meaningful.length > 0 ? meaningful : words).join('-').slice(0, MAX_LENGTH);
  return slug.replace(/-+$/, '') || FALLBACK_SLUG;
}

/** Ajoute « -2 », « -3 »… si le lien est déjà pris. */
export function uniqueSlug(slug: string, taken: (candidate: string) => boolean): string {
  if (!taken(slug)) return slug;
  let index = 2;
  while (taken(`${slug}-${index}`)) index += 1;
  return `${slug}-${index}`;
}
