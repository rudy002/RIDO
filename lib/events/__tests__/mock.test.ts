import { createMockEvent, findMockEvent } from '../mock';

const DRAFT = {
  type: 'birthday' as const,
  name: 'Les 30 ans d’Esther',
  venue: 'Rooftop Florentin',
  startsAt: new Date(2025, 8, 20, 20, 0),
  endsAt: new Date(2025, 8, 21, 2, 0),
  directions: ['return' as const],
};

describe('événement créé', () => {
  it('reçoit un lien lisible et devient consultable', () => {
    const event = createMockEvent(DRAFT, 'IL');

    expect(event.id).toBe('30-ans-esther');
    expect(findMockEvent(event.id)).toBe(event);
    expect(event.outboundWindow).toEqual({
      from: new Date(2025, 8, 20, 18, 30),
      to: DRAFT.startsAt,
    });
    expect(event.returnAround).toEqual(DRAFT.endsAt);
    expect(event.directions).toEqual(['return']);
  });

  it('ne réutilise jamais un lien existant', () => {
    expect(createMockEvent(DRAFT, 'IL').id).toBe('30-ans-esther-2');
  });
});
