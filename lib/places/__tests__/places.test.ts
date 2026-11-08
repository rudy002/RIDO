import {
  cityOf,
  defaultEventCountry,
  describePlace,
  distanceKm,
  hasPlaces,
  searchPlaces,
} from '../places';

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

  it('trouve une ville par ses autres orthographes, sous son nom usuel', () => {
    expect(searchPlaces('IL', 'ashkelon', 'fr')[0]).toEqual({ id: '295620', name: 'Ashkelon' });
    expect(searchPlaces('IL', 'ashqelon', 'en')[0]).toEqual({ id: '295620', name: 'Ashkelon' });
    expect(searchPlaces('IL', 'givat', 'en')[0].name).toBe('Givatayim');
  });

  it('situe un quartier dans sa ville et mesure les distances', () => {
    expect(cityOf('8598981')?.id).toBe('293397');
    expect(describePlace('8598981', 'fr')).toEqual({ city: 'Tel-Aviv', area: 'Florentin' });
    expect(describePlace('295629', 'he')).toEqual({ city: 'אשדוד' });
    // Ashdod – Yavne : environ 10 km.
    expect(distanceKm('295629', '293222')).toBeGreaterThan(5);
    expect(distanceKm('295629', '293222')).toBeLessThan(15);
    expect(distanceKm('295629', 'inconnu')).toBeUndefined();
  });
});

describe('pays d’un nouvel événement', () => {
  it('garde le pays du téléphone s’il est intégré, sinon le premier pays intégré', () => {
    expect(defaultEventCountry('IL')).toBe('IL');
    expect(defaultEventCountry('FR')).toBe('IL');
  });
});
