import { eventHighlights } from '../highlights';
import { DEMO_EVENT, DEMO_EVENT_ALL_SET, overviewOf } from '../mock';

describe('résumé d’un événement', () => {
  it('signale les invités sans solution', () => {
    expect(eventHighlights(DEMO_EVENT, overviewOf(DEMO_EVENT.id))).toEqual({
      status: 'needs',
      freeSeats: 14,
      unmatched: 3,
    });
  });

  it('dit quand tout le monde a une place', () => {
    expect(eventHighlights(DEMO_EVENT_ALL_SET, overviewOf(DEMO_EVENT_ALL_SET.id)).status).toBe(
      'allSet'
    );
  });

  it('ne crie pas victoire pour un événement sans inscrits', () => {
    expect(
      eventHighlights({ directions: ['outbound'], guestsCount: 0 }, overviewOf('nouveau')).status
    ).toBe('needs');
  });
});
