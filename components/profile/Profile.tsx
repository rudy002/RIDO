import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { Screen } from '@/components/ui/Screen';
import { SettingsGroup } from '@/components/ui/SettingsGroup';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { APPEARANCES, type Appearance } from '@/lib/design/appearance';
import { useTheme } from '@/lib/design/use-theme';
import { LANGUAGES, type Language } from '@/lib/i18n';
import { LANGUAGE_NAMES } from '@/lib/i18n/change-language';
import { formatPhoneNational } from '@/lib/phone/phone';
import type { CarField, UserProfile } from '@/lib/profile/types';

type ProfileProps = {
  profile: UserProfile;
  appearance: Appearance;
  onAppearanceChange: (appearance: Appearance) => void;
  /** Indique si le changement ne s'appliquera qu'au prochain lancement (passage à l'hébreu). */
  onLanguageChange: (language: Language) => Promise<{ needsRestart: boolean }>;
  onNotificationsChange: (notifications: UserProfile['notifications']) => void;
  onEditProfile: () => void;
  onEditCar: (field: CarField) => void;
  onHelp: () => void;
  onSignOut: () => void;
};

type Sheet = 'appearance' | 'language' | null;

/** Écran A3 : profil, voiture, notifications et réglages de l'appli. */
export function Profile({
  profile,
  appearance,
  onAppearanceChange,
  onLanguageChange,
  onNotificationsChange,
  onEditProfile,
  onEditCar,
  onHelp,
  onSignOut,
}: ProfileProps) {
  const { t } = useTranslation();
  const { spacing, radius, language } = useTheme();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [restartNote, setRestartNote] = useState(false);
  const [notifications, setNotifications] = useState(profile.notifications);
  const name = `${profile.firstName} ${profile.lastName}`;

  const toggle = (key: keyof UserProfile['notifications'], value: boolean) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    onNotificationsChange(next);
  };

  const chooseLanguage = async (next: Language) => {
    const { needsRestart } = await onLanguageChange(next);
    if (needsRestart) setRestartNote(true);
    else setSheet(null);
  };

  return (
    <Screen aboveTabBar>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={name} size="profile" />
        <View style={{ flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            {name}
          </AppText>
          <AppText variant="bodyStrong" color="textMuted">
            {formatPhoneNational(profile.phone)}
          </AppText>
        </View>
        <Button
          variant="outline"
          label={t('rides.edit')}
          accessibilityHint={t('profile.editHint')}
          onPress={onEditProfile}
          style={{ borderRadius: radius.pill, paddingHorizontal: spacing.lg }}
        />
      </View>

      <SettingsGroup title={t('profile.car.title')}>
        <SettingsRow
          variant="detail"
          label={t('profile.car.model')}
          value={profile.car.model}
          onPress={() => onEditCar('model')}
        />
        <SettingsRow
          variant="detail"
          label={t('profile.car.seats')}
          value={t('dashboard.zone.seats', { count: profile.car.seats })}
          onPress={() => onEditCar('seats')}
        />
        <SettingsRow
          variant="detail"
          label={t('profile.car.departure')}
          value={profile.car.usualDeparture}
          onPress={() => onEditCar('usualDeparture')}
        />
      </SettingsGroup>

      <SettingsGroup title={t('profile.notifications.title')}>
        <SettingsRow
          variant="switch"
          label={t('profile.notifications.nearbyRequests')}
          value={notifications.nearbyRequests}
          onValueChange={(value) => toggle('nearbyRequests', value)}
        />
        <SettingsRow
          variant="switch"
          label={t('profile.notifications.departureReminder')}
          value={notifications.departureReminder}
          onValueChange={(value) => toggle('departureReminder', value)}
        />
      </SettingsGroup>

      <SettingsGroup title={t('profile.app.title')}>
        <SettingsRow
          variant="value"
          label={t('profile.app.appearance')}
          value={t(`profile.appearance.${appearance}`)}
          onPress={() => setSheet('appearance')}
        />
        <SettingsRow
          variant="value"
          label={t('profile.app.language')}
          value={LANGUAGE_NAMES[language]}
          onPress={() => setSheet('language')}
        />
        <SettingsRow variant="value" label={t('profile.app.help')} onPress={onHelp} />
      </SettingsGroup>

      <LinkButton label={t('profile.signOut')} onPress={onSignOut} />

      <OptionSheet
        visible={sheet === 'appearance'}
        title={t('profile.app.appearance')}
        value={appearance}
        options={APPEARANCES.map((value) => ({ value, label: t(`profile.appearance.${value}`) }))}
        onSelect={(value) => {
          onAppearanceChange(value);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'language'}
        title={t('profile.app.language')}
        value={language}
        options={LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAMES[value] }))}
        onSelect={(value) => void chooseLanguage(value)}
        onClose={() => {
          setSheet(null);
          setRestartNote(false);
        }}
        note={restartNote ? t('profile.restartNote') : undefined}
      />
    </Screen>
  );
}
