import { CarFront, User } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { PhoneField } from '@/components/ui/PhoneField';
import { RadioCard } from '@/components/ui/RadioCard';
import { Screen } from '@/components/ui/Screen';
import { StepHeader } from '@/components/ui/StepHeader';
import { TextField } from '@/components/ui/TextField';
import { ToggleButton } from '@/components/ui/ToggleButton';
import { useTheme } from '@/lib/design/use-theme';
import { formatShortTime, formatTimeWindow } from '@/lib/i18n/format';
import { toInternational, type CountryCode, type PhoneInput } from '@/lib/phone/phone';
import {
  rideDraftSchema,
  type RideDraft,
  type RideRole,
  type TimeWindow,
  type TripDirection,
  type ZoneActivity,
} from '@/lib/rides/types';

import { ZoneField, type ZoneInput } from './ZoneField';

type JoinRideFormProps = {
  outboundWindow: TimeWindow;
  returnAround: Date;
  activeZones: ZoneActivity[];
  /** Pays proposé par défaut pour l'indicatif. */
  defaultCountry: CountryCode;
  onBack: () => void;
  onSubmit: (draft: RideDraft) => void;
};

const TRIPS_LABEL_ID = 'join-trips-label';

/** Écran I2 : rôle (conducteur / passager), trajets, zone de départ et contact. */
export function JoinRideForm({
  outboundWindow,
  returnAround,
  activeZones,
  defaultCountry,
  onBack,
  onSubmit,
}: JoinRideFormProps) {
  const { t } = useTranslation();
  const { spacing, language } = useTheme();

  const [role, setRole] = useState<RideRole | null>(null);
  // La plupart des invités font l'aller et le retour : les deux sont cochés d'office.
  const [directions, setDirections] = useState<TripDirection[]>(['outbound', 'return']);
  const [zone, setZone] = useState<ZoneInput>({ text: '', zone: null });
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState<PhoneInput>({ country: defaultCountry, national: '' });

  const lastNameRef = useRef<TextInput>(null);
  const firstNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const draft = rideDraftSchema.safeParse({
    role,
    directions,
    zone: zone.zone,
    lastName,
    firstName,
    phone: toInternational(phone),
  });

  const toggleDirection = (direction: TripDirection) =>
    setDirections((current) =>
      current.includes(direction)
        ? current.filter((item) => item !== direction)
        : [...current, direction]
    );

  const zonesHint =
    activeZones.length > 0
      ? t('join.zone.active', {
          zones: activeZones.map(({ zone: name, count }) => `${name} (${count})`).join(', '),
        })
      : undefined;

  return (
    <Screen
      footer={
        <Button
          label={t('join.continue')}
          disabled={!draft.success}
          onPress={() => draft.success && onSubmit(draft.data)}
        />
      }>
      <StepHeader current={1} total={2} onBack={onBack} />

      <AppText variant="title" accessibilityRole="header">
        {t('join.title')}
      </AppText>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('join.roles')}
        style={{ gap: spacing.md }}>
        <RadioCard
          icon={CarFront}
          tone="success"
          title={t('join.driver.title')}
          description={t('join.driver.description')}
          selected={role === 'driver'}
          onSelect={() => setRole('driver')}
        />
        <RadioCard
          icon={User}
          tone="accent"
          title={t('join.passenger.title')}
          description={t('join.passenger.description')}
          selected={role === 'passenger'}
          onSelect={() => setRole('passenger')}
        />
      </View>

      <View accessibilityLabelledBy={TRIPS_LABEL_ID}>
        <FieldLabel nativeID={TRIPS_LABEL_ID}>{t('join.trips.label')}</FieldLabel>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <ToggleButton
            style={{ flex: 1 }}
            label={t('join.trips.outbound', {
              window: formatTimeWindow(outboundWindow.from, outboundWindow.to, language),
            })}
            selected={directions.includes('outbound')}
            onToggle={() => toggleDirection('outbound')}
          />
          <ToggleButton
            style={{ flex: 1 }}
            label={t('join.trips.return', { time: formatShortTime(returnAround, language) })}
            selected={directions.includes('return')}
            onToggle={() => toggleDirection('return')}
          />
        </View>
      </View>

      <ZoneField
        country={defaultCountry}
        hint={zonesHint}
        value={zone}
        onChange={setZone}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => lastNameRef.current?.focus()}
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <TextField
          ref={lastNameRef}
          style={{ flex: 1 }}
          label={t('join.lastName.label')}
          placeholder={t('join.lastName.placeholder')}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => firstNameRef.current?.focus()}
        />
        <TextField
          ref={firstNameRef}
          style={{ flex: 1 }}
          label={t('join.firstName.label')}
          placeholder={t('join.firstName.placeholder')}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
      </View>

      <PhoneField
        ref={phoneRef}
        label={t('join.phone.label')}
        countryLabel={t('join.phone.countryLabel')}
        value={phone}
        onChange={setPhone}
      />
    </Screen>
  );
}
