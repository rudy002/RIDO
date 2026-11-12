import { useRouter } from 'expo-router';

import { Profile } from '@/components/profile/Profile';
import { signOut, updateProfile } from '@/lib/data/commands';
import { useSingleFlight } from '@/lib/data/hooks';
import { useAppData } from '@/lib/data/store';
import { setAppearance, useAppearance } from '@/lib/design/appearance';
import { changeAppLanguage } from '@/lib/i18n/change-language';

/** A3 : « Profil ». */
export default function ProfileRoute() {
  const router = useRouter();
  const data = useAppData();
  const appearance = useAppearance();
  const once = useSingleFlight();
  const openEditor = () => router.push('/profile/edit');

  return (
    <Profile
      profile={data.profile}
      appearance={appearance}
      onAppearanceChange={(value) => void setAppearance(value)}
      onLanguageChange={(language) => void changeAppLanguage(language)}
      onNotificationsChange={(notifications) => {
        if (data.profile) void updateProfile({ ...data.profile, notifications });
      }}
      onEditProfile={openEditor}
      onEditCar={openEditor}
      // L'aide (adresse ou numéro de contact) reste à définir.
      onHelp={() => {}}
      onSignOut={() =>
        void once(async () => {
          // Sans réseau, rien n'est effacé : on reste ici, la raison est affichée.
          if (await signOut()) router.replace('/');
        })
      }
    />
  );
}
