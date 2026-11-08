import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type TextInputInstance } from 'react-native';

import { ZoneField, type ZoneInput } from '@/components/rides/ZoneField';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { PhoneField } from '@/components/ui/PhoneField';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Stepper } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/lib/design/use-theme';
import {
  phoneInputFromE164,
  toInternational,
  type CountryCode,
  type PhoneInput,
} from '@/lib/phone/phone';
import type { UserProfile } from '@/lib/profile/types';
import { MAX_FREE_SEATS, MIN_FREE_SEATS } from '@/lib/rides/types';

type ProfileFormProps = {
  profile: UserProfile | null;
  /** Pays proposé pour l'indicatif et pour chercher la ville. */
  country: CountryCode;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
};

const DEFAULT_SEATS = 3;

/** Modifier son profil : nom, téléphone et voiture (repris à chaque inscription). */
export function ProfileForm({ profile, country, onClose, onSave }: ProfileFormProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [phone, setPhone] = useState<PhoneInput>(() =>
    profile?.phone ? phoneInputFromE164(profile.phone, country) : { country, national: '' }
  );
  const [model, setModel] = useState(profile?.car.model ?? '');
  const [seats, setSeats] = useState(profile?.car.seats ?? DEFAULT_SEATS);
  const usual = profile?.car.usualDeparture ?? null;
  const [zone, setZone] = useState<ZoneInput>(
    usual ? { text: usual.name, zone: usual } : { text: '', zone: null }
  );
  const lastNameRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);

  const international = toInternational(phone);
  const ready = firstName.trim() !== '' && lastName.trim() !== '' && international !== null;

  const save = () => {
    if (!ready || !international) return;
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: international,
      car: { model: model.trim(), seats, usualDeparture: zone.zone },
      notifications: profile?.notifications ?? { nearbyRequests: true, departureReminder: true },
    });
  };

  return (
    <Screen footer={<Button label={t('profile.form.save')} disabled={!ready} onPress={save} />}>
      <ScreenHeader action="close" onAction={onClose} title={t('tabs.profile')} />
      <AppText variant="title" accessibilityRole="header">
        {t('profile.form.title')}
      </AppText>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <TextField
          style={{ flex: 1 }}
          label={t('join.firstName.label')}
          placeholder={t('join.firstName.placeholder')}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoComplete="given-name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => lastNameRef.current?.focus()}
        />
        <TextField
          ref={lastNameRef}
          style={{ flex: 1 }}
          label={t('join.lastName.label')}
          placeholder={t('join.lastName.placeholder')}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          autoComplete="family-name"
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

      <AppText variant="overline" color="textMuted" accessibilityRole="header">
        {t('profile.car.title')}
      </AppText>

      <TextField
        label={t('profile.car.model')}
        placeholder={t('profile.form.modelPlaceholder')}
        value={model}
        onChangeText={setModel}
        autoCapitalize="sentences"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <AppText variant="label" style={{ flex: 1 }}>
          {t('profile.car.seats')}
        </AppText>
        <Stepper
          size="compact"
          value={seats}
          min={MIN_FREE_SEATS}
          max={MAX_FREE_SEATS}
          onChange={setSeats}
          valueLabel={t('dashboard.zone.seats', { count: seats })}
          decreaseLabel={t('car.seats.decrease')}
          increaseLabel={t('car.seats.increase')}
        />
      </View>

      <ZoneField
        country={country}
        label={t('profile.car.departure')}
        value={zone}
        onChange={setZone}
      />
    </Screen>
  );
}
