import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { PastEvents } from '@/components/event/PastEvents';
import { organizedEvents } from '@/lib/data/selectors';
import { useAppData } from '@/lib/data/store';
import { useTheme } from '@/lib/design/use-theme';

/** Événements terminés que l'utilisateur a organisés. */
export default function PastEventsRoute() {
  const router = useRouter();
  const data = useAppData();
  const { language } = useTheme();
  const { past } = useMemo(() => organizedEvents(data, new Date(), language), [data, language]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PastEvents
        events={past}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/my-events'))}
        onOpenDashboard={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
      />
    </>
  );
}
