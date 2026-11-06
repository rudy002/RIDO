const STARTS_WITH_VOWEL = /^[aeiouyàâäéèêëîïôöùûü]/i;

/**
 * Contexte i18next pour l'élision française (« Départ d'Ashdod », « Mariage d'Esther ») :
 * les clés `_vowel` n'existent qu'en français, les autres langues reprennent la clé de base.
 */
export function elisionContext(word: string): 'vowel' | undefined {
  return STARTS_WITH_VOWEL.test(word.trim()) ? 'vowel' : undefined;
}
