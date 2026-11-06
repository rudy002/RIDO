import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { MyEvents, type OrganizedEvent } from '@/components/event/MyEvents';
import { useShareEvent } from '@/components/event/use-share-event';
import { eventHighlights } from '@/lib/events/highlights';
import {
  DEMO_PAST_EVENTS_COUNT,
  findMockEvent,
  listMockEvents,
  overviewOf,
} from '@/lib/events/mock';

const organizedEvents = (): OrganizedEvent[] =>
  listMockEvents().map((event) => ({
    event,
    highlights: eventHighlights(event, overviewOf(event.id)),
  }));

/** A2 : « Mes événements ». */
export default function MyEventsRoute() {
  const router = useRouter();
  const shareEvent = useShareEvent();
  const [events, setEvents] = useState(organizedEvents);

  // Un événement créé depuis O1 apparaît en revenant sur l'onglet.
  useFocusEffect(useCallback(() => setEvents(organizedEvents()), []));

  return (
    <MyEvents
      events={events}
      pastCount={DEMO_PAST_EVENTS_COUNT}
      onOpenDashboard={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
      onShare={(id) => {
        const event = findMockEvent(id);
        if (event) shareEvent(event);
      }}
      // L'historique des événements n'a pas encore de maquette.
      onOpenPast={() => {}}
      onCreate={() => router.push('/events/new')}
    />
  );
}
