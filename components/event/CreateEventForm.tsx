import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { DateField } from '@/components/ui/DateField';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { TimeField } from '@/components/ui/TimeField';
import { moveToDay, startOfDay } from '@/lib/dates/calendar';
import { useTheme } from '@/lib/design/use-theme';
import { EVENT_TYPES, type EventDraft, type EventType } from '@/lib/events/types';
import { addMinutes, keepWindowOrdered, timeSlots } from '@/lib/rides/time-slots';
import { TRIP_DIRECTIONS, type TripDirection } from '@/lib/rides/types';

type CreateEventFormProps = {
  onClose: () => void;
  onCreate: (draft: EventDraft) => void;
  /** Aujourd'hui (paramétrable pour les tests) : premier jour possible. */
  today?: Date;
};

const DEFAULT_START_HOUR = 19;
const DEFAULT_DURATION_MINUTES = 4 * 60;
/** Un événement peut finir jusqu'à 12 h après son début, le lendemain compris. */
const MAX_DURATION_MINUTES = 12 * 60;

/** Écran O1 : l'organisateur crée un événement. */
export function CreateEventForm({ onClose, onCreate, today = new Date() }: CreateEventFormProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const firstDay = useMemo(() => startOfDay(today), [today]);

  const [type, setType] = useState<EventType>('wedding');
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  // Heures posées sur le jour choisi (ou aujourd'hui en attendant) ; la fin peut être le lendemain.
  const [schedule, setSchedule] = useState(() => {
    const from = addMinutes(firstDay, DEFAULT_START_HOUR * 60);
    return { from, to: addMinutes(from, DEFAULT_DURATION_MINUTES) };
  });
  const [directions, setDirections] = useState<TripDirection[]>([...TRIP_DIRECTIONS]);
  const venueRef = useRef<TextInput>(null);

  const day = date ?? firstDay;
  const missingTrips = directions.length === 0;
  const ready = name.trim() !== '' && venue.trim() !== '' && date !== null && !missingTrips;

  const chooseDate = (next: Date) => {
    setDate(next);
    setSchedule((current) => ({
      from: moveToDay(current.from, current.from, next),
      to: moveToDay(current.to, current.from, next),
    }));
  };

  const toggle = (direction: TripDirection, on: boolean) =>
    setDirections((current) =>
      on
        ? TRIP_DIRECTIONS.filter((item) => item === direction || current.includes(item))
        : current.filter((item) => item !== direction)
    );

  const create = () => {
    if (!ready) return;
    onCreate({
      type,
      name: name.trim(),
      venue: venue.trim(),
      startsAt: schedule.from,
      endsAt: schedule.to,
      directions,
    });
  };

  return (
    <Screen
      footer={
        <>
          <Button label={t('createEvent.submit')} disabled={!ready} onPress={create} />
          {missingTrips ? (
            <AppText color="textMuted" style={{ textAlign: 'center' }}>
              {t('createEvent.trips.missing')}
            </AppText>
          ) : null}
        </>
      }>
      <ScreenHeader action="close" onAction={onClose} title={t('createEvent.header')} />

      <AppText variant="title" accessibilityRole="header">
        {t('createEvent.title')}
      </AppText>

      <ChipGroup
        label={t('createEvent.type')}
        value={type}
        onChange={setType}
        options={EVENT_TYPES.map((value) => ({
          value,
          // « Autre » dans le choix ; « Événement » quand on l'affiche ensuite.
          label: value === 'other' ? t('createEvent.otherType') : t(`event.types.${value}`),
        }))}
      />

      <TextField
        label={t('createEvent.name.label')}
        placeholder={t('createEvent.name.placeholder')}
        value={name}
        onChangeText={setName}
        autoCapitalize="sentences"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => venueRef.current?.focus()}
      />

      <TextField
        ref={venueRef}
        label={t('createEvent.venue.label')}
        placeholder={t('createEvent.venue.placeholder')}
        value={venue}
        onChangeText={setVenue}
        autoCapitalize="words"
        returnKeyType="done"
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <FieldLabel>{t('createEvent.date')}</FieldLabel>
          <DateField
            label={t('createEvent.date')}
            placeholder={t('createEvent.datePlaceholder')}
            value={date}
            onChange={chooseDate}
            minDate={firstDay}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel>{t('createEvent.start')}</FieldLabel>
          <TimeField
            align="start"
            label={t('createEvent.start')}
            value={schedule.from}
            slots={timeSlots(day, addMinutes(day, 24 * 60 - 15))}
            onChange={(from) =>
              setSchedule((current) =>
                keepWindowOrdered(
                  {
                    from,
                    to: addMinutes(from, (current.to.getTime() - current.from.getTime()) / 60_000),
                  },
                  DEFAULT_DURATION_MINUTES
                )
              )
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel>{t('createEvent.end')}</FieldLabel>
          <TimeField
            align="start"
            label={t('createEvent.end')}
            value={schedule.to}
            slots={timeSlots(
              addMinutes(schedule.from, 15),
              addMinutes(schedule.from, MAX_DURATION_MINUTES)
            )}
            onChange={(to) => setSchedule((current) => ({ ...current, to }))}
          />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <FieldLabel>{t('createEvent.trips.label')}</FieldLabel>
        {TRIP_DIRECTIONS.map((direction) => (
          <SwitchRow
            key={direction}
            title={t(`createEvent.trips.${direction}.title`)}
            subtitle={t(`createEvent.trips.${direction}.subtitle`)}
            value={directions.includes(direction)}
            onValueChange={(on) => toggle(direction, on)}
          />
        ))}
      </View>
    </Screen>
  );
}
