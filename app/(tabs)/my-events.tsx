import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { MyEvents } from '@/components/event/MyEvents';
import { useShareEvent } from '@/components/event/use-share-event';
import { organizedEvents } from '@/lib/data/selectors';
import { useAppData } from '@/lib/data/store';
import { useTheme } from '@/lib/design/use-theme';

/** A2 : « Mes événements ». */
export default function MyEventsRoute() {
  const router = useRouter();
  const data = useAppData();
  const { language } = useTheme();
  const shareEvent = useShareEvent();
  const { upcoming, past } = useMemo(
    () => organizedEvents(data, new Date(), language),
    [data, language]
  );

  return (
    <MyEvents
      events={upcoming}
      pastCount={past.length}
      onOpenDashboard={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
      onShare={(id) => {
        const organized = upcoming.find(({ event }) => event.id === id);
        if (organized) shareEvent(organized.event);
      }}
      onOpenPast={() => router.push('/events/past')}
      onCreate={() => router.push('/events/new')}
    />
  );
}
