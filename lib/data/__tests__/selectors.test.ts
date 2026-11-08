import { buildDemoData, DEMO_EVENT_ID } from '../demo';
import {
  eventById,
  eventOverview,
  eventSummary,
  matchesFor,
  myParticipant,
  nearbyRequests,
  organizedEvents,
  participantById,
  passengerStatusOf,
  tripsOf,
} from '../selectors';

// Lundi 2 juin 2025 : le mariage de la démo tombe le samedi 14 juin.
const NOW = new Date(2025, 5, 2, 10, 0);
const data = buildDemoData(NOW);
const wedding = eventById(data, DEMO_EVENT_ID)!;

describe('sélecteurs sur la démo', () => {
  it('résume l’événement à partir des inscriptions', () => {
    const summary = eventSummary(data, wedding, 'fr');
    expect(summary.startsAt).toEqual(new Date(2025, 5, 14, 19, 30));
    expect(summary.guestsCount).toBe(18);
    expect(summary.seatsOffered).toBe(21);
    expect(summary.outboundWindow).toEqual({
      from: new Date(2025, 5, 14, 18, 0),
      to: new Date(2025, 5, 14, 19, 30),
    });
    expect(summary.activeZones).toEqual([
      { zone: 'Ashdod', count: 8 },
      { zone: 'Tel-Aviv', count: 5 },
      { zone: 'Ashkelon', count: 3 },
      { zone: 'Gan Yavne', count: 1 },
      { zone: 'Kiryat Gat', count: 1 },
    ]);
  });

  it('propose à un passager les conducteurs de sa ville et des villes voisines', () => {
    const esther = participantById(data, 'p-esther')!;
    const matches = matchesFor(data, esther, 'fr');
    const outbound = matches.filter((m) => m.offer.direction === 'outbound');

    expect(outbound.map((m) => m.offer.driver.firstName)).toEqual([
      'Yoni',
      'David',
      'Myriam',
      'Ruth',
    ]);
    expect(outbound.filter((m) => m.sameCity).map((m) => m.offer.seats.free)).toEqual([0, 1, 1]);
    const ruth = outbound.find((m) => m.offer.driver.firstName === 'Ruth')!;
    expect(ruth.sameCity).toBe(false);
    expect(ruth.distanceKm).toBeLessThanOrEqual(12);
    expect(ruth.offer.home).toEqual({ city: 'Gan Yavne' });
    // Tel-Aviv est trop loin d'Ashdod.
    expect(matches.some((m) => m.offer.driver.firstName === 'Avi')).toBe(false);
  });

  it('suit la recherche d’un passager, sens par sens', () => {
    const me = myParticipant(data, 'noa')!;
    expect(passengerStatusOf(data, me)).toEqual({
      outbound: {
        legId: 's-noa-me-out',
        found: true,
        offerId: 'd-noa-myriam-out',
        departure: { from: new Date(2025, 5, 20, 20, 15) },
        driver: { firstName: 'Myriam', lastName: 'Benhamou' },
      },
      return: { legId: 's-noa-me-ret', found: false },
    });
  });

  it('montre au conducteur ceux qui cherchent près de chez lui', () => {
    const david = myParticipant(data, DEMO_EVENT_ID)!;
    const requests = nearbyRequests(data, david, 'fr');
    expect(requests.map((r) => `${r.passenger.firstName} ${r.direction}`)).toEqual([
      'Nathan outbound',
      'Rachel outbound',
      'Rachel return',
    ]);
    expect(requests[0].home).toEqual({ city: 'Ashdod', area: 'Rova HaKirya' });
  });

  it('calcule la vue de l’organisateur', () => {
    const overview = eventOverview(data, wedding, 'fr');
    expect(overview.outbound?.drivers).toBe(6);
    expect(overview.outbound?.freeSeats).toBe(12);
    expect(overview.outbound?.unmatched.map((g) => `${g.name} · ${g.city}`)).toEqual([
      'Paul Amsellem · Ashkelon',
      'Sarah Dahan · Ashkelon',
      'Michaël Ohana · Kiryat Gat',
    ]);
    expect(overview.outbound?.zones).toEqual([
      { zone: 'Ashkelon', seats: 0, requests: 3 },
      { zone: 'Tel-Aviv', seats: 8, requests: 2 },
      { zone: 'Ashdod', seats: 2, requests: 2 },
      { zone: 'Kiryat Gat', seats: 0, requests: 1 },
      { zone: 'Gan Yavne', seats: 2, requests: 0 },
    ]);
    expect(overview.return?.drivers).toBe(4);
    expect(overview.return?.freeSeats).toBe(10);
    expect(overview.return?.unmatched.map((g) => g.name)).toEqual(['Michaël Ohana']);
  });

  it('sépare les trajets à venir et passés de l’utilisateur', () => {
    const { upcoming, past } = tripsOf(data, NOW);
    expect(upcoming.map((t) => `${t.context.title} · ${t.role}`)).toEqual([
      'Mariage de Léa et Samuel · driver',
      'Les 30 ans de Noa · passenger',
    ]);
    expect(past.map((t) => t.id)).toEqual(['maya', 'fin-annee', 'yossi-dana']);
    const noa = upcoming[1];
    expect(noa.role === 'passenger' && noa.legs.return).toEqual({ found: false });
  });

  it('liste les événements organisés et ce qu’il y reste à faire', () => {
    const { upcoming, past } = organizedEvents(data, NOW, 'fr');
    expect(upcoming.map((e) => [e.event.title, e.highlights])).toEqual([
      ['Mariage de Léa et Samuel', { status: 'needs', freeSeats: 12, unmatched: 3 }],
      ['Bar mitzvah d’Eitan', { status: 'allSet', freeSeats: 3, unmatched: 0 }],
    ]);
    expect(upcoming[1].event.guestsCount).toBe(8);
    expect(past.map((e) => e.event.id)).toEqual(['maya', 'fin-annee']);
  });
});
