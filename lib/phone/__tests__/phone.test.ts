import {
  countryOf,
  listCountries,
  sanitizePhoneInput,
  searchCountries,
  toInternational,
} from '../phone';

describe('téléphone', () => {
  it('nomme les pays dans la langue active', () => {
    expect(countryOf('IL', 'fr')).toEqual({
      code: 'IL',
      name: 'Israël',
      callingCode: '+972',
      flag: '🇮🇱',
    });
    expect(countryOf('IL', 'he').name).toBe('ישראל');
    expect(countryOf('IL', 'en').name).toBe('Israel');
  });

  it('cherche par nom sans accents ou par indicatif', () => {
    const list = listCountries('fr');
    expect(searchCountries(list, 'israel').map((c) => c.code)).toEqual(['IL']);
    expect(searchCountries(list, '+972').map((c) => c.code)).toEqual(['IL']);
    expect(searchCountries(list, '')).toHaveLength(list.length);
  });

  it('ne garde que les chiffres et refuse ce qui dépasse', () => {
    const current = { country: 'IL' as const, national: '0521234567' };
    expect(sanitizePhoneInput('052-123 4567', current)).toEqual(current);
    expect(sanitizePhoneInput('05212345678', current)).toBe(current);
  });

  it('reconnaît un numéro international', () => {
    expect(sanitizePhoneInput('+33 6 12 34 56 78', { country: 'IL', national: '' })).toEqual({
      country: 'FR',
      national: '612345678',
    });
  });

  it('donne le format international d’un numéro valide', () => {
    expect(toInternational({ country: 'IL', national: '0521234567' })).toBe('+972521234567');
    expect(toInternational({ country: 'FR', national: '0612345678' })).toBe('+33612345678');
    expect(toInternational({ country: 'IL', national: '05212' })).toBeNull();
  });
});
