// Langue et région du téléphone, pour les tests sur le vrai Supabase (environnement Node, sans
// module natif). Voir jest.live.config.js.
module.exports = {
  getLocales: () => [{ languageCode: 'fr', languageTag: 'fr-IL', regionCode: 'IL' }],
};
