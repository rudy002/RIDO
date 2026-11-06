import { legsOfDraft, parseCarDraft, serializeCarDraft } from '../car-draft';

const DRAFT = {
  seats: 3,
  legs: { outbound: { from: new Date(2025, 5, 14, 18), to: new Date(2025, 5, 14, 18, 30) } },
};

describe('trajet publié', () => {
  it('passe d’un écran à l’autre sans perdre les dates', () => {
    expect(parseCarDraft(serializeCarDraft(DRAFT))).toEqual(DRAFT);
  });

  it('ignore un paramètre absent ou abîmé', () => {
    expect(parseCarDraft(undefined)).toBeNull();
    expect(parseCarDraft('{oups')).toBeNull();
    expect(parseCarDraft(JSON.stringify({ seats: 40, legs: {} }))).toBeNull();
  });

  it('démarre avec une voiture vide', () => {
    expect(legsOfDraft(DRAFT)).toEqual({
      outbound: { departure: DRAFT.legs.outbound, totalSeats: 3, bookings: [] },
    });
  });
});
