import { cityKeyOf, describeZone, isNearby, relateZones, zoneLabel } from '../matching';

const ASHDOD = { placeId: '295629', name: 'Ashdod' };
const ASHDOD_KIRYA = { placeId: '11401067', name: 'Rova HaKirya, Ashdod' };
const GAN_YAVNE = { placeId: '295080', name: 'Gan Yavne' };
const ASHKELON = { placeId: '295620', name: 'Ashkelon' };
const FREE_TEXT = { placeId: null, name: 'Moshav Bnei Darom' };

describe('proximité des zones', () => {
  it('reconnaît un quartier de la même ville', () => {
    expect(cityKeyOf(ASHDOD_KIRYA)).toBe(cityKeyOf(ASHDOD));
    expect(relateZones(ASHDOD_KIRYA, ASHDOD)).toEqual({ sameCity: true, unknown: false });
  });

  it('mesure la distance entre deux villes et garde les voisines', () => {
    const near = relateZones(ASHDOD_KIRYA, GAN_YAVNE);
    expect(near.sameCity).toBe(false);
    expect(near.distanceKm).toBe(5);
    expect(isNearby(near)).toBe(true);
    expect(isNearby(relateZones(ASHDOD, ASHKELON))).toBe(false);
  });

  it('compare les saisies libres par leur texte', () => {
    expect(relateZones(FREE_TEXT, ASHDOD)).toEqual({ sameCity: false, unknown: true });
    expect(relateZones({ placeId: null, name: 'ashdod' }, ASHDOD).sameCity).toBe(false);
    expect(relateZones({ placeId: null, name: 'Moshav Bnei-Darom' }, FREE_TEXT).sameCity).toBe(
      true
    );
  });

  it('décrit la zone dans la langue active', () => {
    expect(describeZone(ASHDOD_KIRYA, 'he')).toEqual({ city: 'אשדוד', area: 'רובע הקריה' });
    expect(zoneLabel(ASHDOD_KIRYA, 'fr')).toBe('Rova HaKirya, Ashdod');
    expect(zoneLabel(FREE_TEXT, 'fr')).toBe('Moshav Bnei Darom');
  });
});
