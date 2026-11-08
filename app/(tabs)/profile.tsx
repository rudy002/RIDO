import { useRouter } from 'expo-router';

import { Profile } from '@/components/profile/Profile';
import { signOut, updateProfile } from '@/lib/data/actions';
import { updateAppData, useAppData } from '@/lib/data/store';
import { setAppearance, useAppearance } from '@/lib/design/appearance';
import { changeAppLanguage } from '@/lib/i18n/change-language';
import { reloadForDirection } from '@/lib/i18n/restart';

/** A3 : « Profil ». */
export default function ProfileRoute() {
  const router = useRouter();
  const data = useAppData();
  const appearance = useAppearance();
  const openEditor = () => router.push('/profile/edit');

  return (
    <Profile
      profile={data.profile}
      appearance={appearance}
      onAppearanceChange={(value) => void setAppearance(value)}
      onLanguageChange={async (language) => {
        const result = await changeAppLanguage(language);
        // Quand l'appli peut se recharger seule, inutile de demander de la rouvrir.
        if (result.needsRestart && (await reloadForDirection())) return { needsRestart: false };
        return result;
      }}
      onNotificationsChange={(notifications) =>
        updateAppData((current) =>
          current.profile ? updateProfile(current, { ...current.profile, notifications }) : current
        )
      }
      onEditProfile={openEditor}
      onEditCar={openEditor}
      // L'aide (adresse ou numéro de contact) reste à définir.
      onHelp={() => {}}
      onSignOut={() => {
        updateAppData(signOut);
        router.replace('/');
      }}
    />
  );
}
