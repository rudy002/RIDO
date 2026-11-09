import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Screen } from '@/components/ui/Screen';
import { SeatIcon } from '@/components/ui/SeatIcon';
import { StepHeader } from '@/components/ui/StepHeader';
import { Stepper } from '@/components/ui/Stepper';
import { TimeField } from '@/components/ui/TimeField';
import { useTheme } from '@/lib/design/use-theme';
import { addMinutes, keepWindowOrdered, timeSlots } from '@/lib/rides/time-slots';
import {
  MAX_FREE_SEATS,
  MIN_FREE_SEATS,
  type CarDraft,
  type TimeWindow,
  type TripDirection,
} from '@/lib/rides/types';

type CarFormProps = {
  /** Sens choisis à l'étape 1 : seuls ceux-là sont demandés. */
  directions: TripDirection[];
  /** Créneaux proposés au départ, un par sens (ceux déjà publiés quand on modifie sa voiture). */
  defaults: Record<TripDirection, TimeWindow>;
  /** Places déjà publiées, ou celles du profil. */
  initialSeats?: number;
  /** Places déjà prises : on ne peut pas descendre en dessous. */
  minSeats?: number;
  /** Aide sous l'aller (« L'événement commence à 19h30. »), selon le contexte du trajet. */
  outboundHint?: string;
  onBack: () => void;
  onSubmit: (draft: CarDraft) => void;
};

const DEFAULT_SEATS = 3;
/** Amplitude des heures proposées autour du créneau par défaut. */
const RANGE_MINUTES = 3 * 60;

/** Écran C2 : places libres et créneaux de départ du conducteur. */
export function CarForm({
  directions,
  defaults,
  initialSeats = DEFAULT_SEATS,
  minSeats = MIN_FREE_SEATS,
  outboundHint,
  onBack,
  onSubmit,
}: CarFormProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [seats, setSeats] = useState(initialSeats);
  const [legs, setLegs] = useState(() =>
    Object.fromEntries(directions.map((direction) => [direction, defaults[direction]]))
  );

  const setLeg = (direction: TripDirection, window: TimeWindow) =>
    setLegs((current) => ({ ...current, [direction]: keepWindowOrdered(window) }));

  const leg = (direction: TripDirection) => {
    const window = legs[direction];
    if (!window) return null;
    const around = defaults[direction].from;
    const hint = direction === 'outbound' ? outboundHint : t('car.return.hint');

    return (
      <View key={direction}>
        <FieldLabel>{t(`car.${direction}.label`)}</FieldLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <TimeField
            style={{ flex: 1 }}
            label={t('car.window.start')}
            value={window.from}
            slots={timeSlots(addMinutes(around, -RANGE_MINUTES), addMinutes(around, RANGE_MINUTES))}
            onChange={(from) => setLeg(direction, { ...window, from })}
          />
          <AppText variant="label">{t('car.window.and')}</AppText>
          <TimeField
            style={{ flex: 1 }}
            label={t('car.window.end')}
            value={window.to}
            slots={timeSlots(window.from, addMinutes(window.from, RANGE_MINUTES))}
            onChange={(to) => setLeg(direction, { ...window, to })}
          />
        </View>
        {hint ? (
          <AppText color="textMuted" style={{ marginTop: spacing.sm }}>
            {hint}
          </AppText>
        ) : null}
      </View>
    );
  };

  return (
    <Screen footer={<Button label={t('car.publish')} onPress={() => onSubmit({ seats, legs })} />}>
      <StepHeader current={2} total={2} onBack={onBack} />

      <AppText variant="title" accessibilityRole="header">
        {t('car.title')}
      </AppText>

      <Card style={{ gap: spacing.lg }}>
        <AppText variant="label">{t('car.seats.label')}</AppText>
        <Stepper
          value={seats}
          min={minSeats}
          max={MAX_FREE_SEATS}
          onChange={setSeats}
          valueLabel={t('car.seats.value', { count: seats })}
          decreaseLabel={t('car.seats.decrease')}
          increaseLabel={t('car.seats.increase')}
        />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: spacing.sm,
          }}>
          {Array.from({ length: seats }, (_, index) => (
            <SeatIcon key={index} free />
          ))}
        </View>
      </Card>

      {directions.map(leg)}
    </Screen>
  );
}
