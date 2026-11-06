import { eventSlug, uniqueSlug } from '../slug';

describe('lien de l’événement', () => {
  it('garde les mots utiles du nom, sans accents', () => {
    expect(eventSlug('Mariage de Léa et Samuel')).toBe('lea-samuel');
    expect(eventSlug('Les 30 ans d’Esther')).toBe('30-ans-esther');
    expect(eventSlug('Bar Mitzvah de Noam')).toBe('noam');
  });

  it('accepte l’hébreu et ne renvoie jamais un lien vide', () => {
    expect(eventSlug('החתונה של לאה')).toBe('החתונה-של-לאה');
    expect(eventSlug('Mariage')).toBe('mariage');
    expect(eventSlug('!!!')).toBe('evenement');
  });

  it('rend le lien unique', () => {
    const taken = new Set(['lea-samuel', 'lea-samuel-2']);
    expect(uniqueSlug('lea-samuel', (slug) => taken.has(slug))).toBe('lea-samuel-3');
    expect(uniqueSlug('noam', (slug) => taken.has(slug))).toBe('noam');
  });
});
