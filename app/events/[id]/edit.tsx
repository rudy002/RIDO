import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CreateEventForm } from '@/components/event/CreateEventForm';
import { EventNotFound } from '@/components/event/EventNotFound';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { registrationsLostBy } from '@/lib/data/actions';
import { deleteEvent, updateEvent } from '@/lib/data/commands';
import { useEventContext, useSingleFlight } from '@/lib/data/hooks';
import { getAppData } from '@/lib/data/store';
import type { EventDraft } from '@/lib/events/types';

/** Modification d'un événement par l'organisateur (depuis O3). */
export default function EditEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const once = useSingleFlight();
  const { event, loading } = useEventContext(id);
  // Modification en attente de confirmation (un trajet retiré efface des inscriptions).
  const [pending, setPending] = useState<{ draft: EventDraft; lost: number } | null>(null);

  const close = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/events/[id]', params: { id } });

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <EventNotFound loading={loading} />
      </>
    );
  }

  const save = (draft: EventDraft) =>
    void once(async () => {
      if (await updateEvent(event.id, draft)) close();
    });

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <CreateEventForm
        initial={{
          type: event.type,
          name: event.title,
          venue: event.venue,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          directions: event.directions,
        }}
        onClose={close}
        onCreate={(draft) => {
          const lost = registrationsLostBy(getAppData(), event.id, draft);
          if (lost > 0) setPending({ draft, lost });
          else save(draft);
        }}
        onDelete={() =>
          void once(async () => {
            if (await deleteEvent(event.id)) router.dismissTo('/my-events');
          })
        }
      />
      <ConfirmSheet
        visible={pending !== null}
        title={t('createEvent.edit.removeTrips.title')}
        message={t('createEvent.edit.removeTrips.message', { count: pending?.lost ?? 0 })}
        confirmLabel={t('createEvent.edit.removeTrips.confirm')}
        cancelLabel={t('createEvent.edit.removeTrips.keep')}
        onConfirm={() => {
          if (pending) save(pending.draft);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
