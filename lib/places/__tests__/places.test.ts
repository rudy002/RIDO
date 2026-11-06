import { hasPlaces, searchPlaces } from '../places';

const ids = (query: string, language: 'fr' | 'he' | 'en' = 'fr') =>
  searchPlaces('IL', query, language).map((place) => place.id);

describe('lieux', () => {
  it('n’a de données que pour les pays intégrés', () => {
    expect(hasPlaces('IL')).toBe(true);
    expect(hasPlaces('FR')).toBe(false);
    expect(searchPlaces('FR', 'Paris', 'fr')).toEqual([]);
  });

  it('cherche dans toutes les langues, sans accents ni tirets', () => {
    const jerusalem = '281184';
    expect(ids('jerus')[0]).toBe(jerusalem);
    expect(ids('Jérus')[0]).toBe(jerusalem);
    expect(ids('ירושל', 'he')[0]).toBe(jerusalem);
    expect(ids('tel aviv')[0]).toBe(ids('tel-aviv')[0]);
  });

  it('affiche le nom dans la langue active', () => {
    expect(searchPlaces('IL', 'ashdod', 'fr')[0]).toEqual({ id: '295629', name: 'Ashdod' });
    expect(searchPlaces('IL', 'ashdod', 'he')[0]).toEqual({ id: '295629', name: 'אשדוד' });
  });

  it('rattache un quartier à sa ville', () => {
    expect(searchPlaces('IL', 'florentin', 'fr')[0]).toEqual({
      id: '8598981',
      name: 'Florentin',
      city: 'Tel-Aviv',
    });
  });

  it('classe les villes les plus peuplées en premier et limite le nombre de suggestions', () => {
    const results = searchPlaces('IL', 'tel', 'fr');
    expect(results[0].name).toBe('Tel-Aviv');
    expect(results.length).toBeLessThanOrEqual(6);
    expect(searchPlaces('IL', '   ', 'fr')).toEqual([]);
  });
});
