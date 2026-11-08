import { DEMO } from '@/lib/data/__fixtures__/demo';
import { eventById, eventOverview, eventSummary } from '@/lib/data/selectors';

import { eventHighlights } from '../highlights';

const highlightsOf = (id: string) => {
  const event = eventById(DEMO, id)!;
  return eventHighlights(eventSummary(DEMO, event, 'fr'), eventOverview(DEMO, event, 'fr'));
};

describe('résumé d’un événement', () => {
  it('compte les personnes sans solution, une seule fois même à l’aller et au retour', () => {
    expect(highlightsOf('demo')).toEqual({ status: 'needs', freeSeats: 12, unmatched: 3 });
  });

  it('dit quand tout le monde a une place', () => {
    expect(highlightsOf('eitan').status).toBe('allSet');
  });

  it('ne crie pas victoire pour un événement sans inscrits', () => {
    expect(eventHighlights({ directions: ['outbound'], guestsCount: 0 }, {}).status).toBe('needs');
  });
});
