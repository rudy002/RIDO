import { Profile } from '@/components/profile/Profile';
import { setAppearance, useAppearance } from '@/lib/design/appearance';
import { changeAppLanguage } from '@/lib/i18n/change-language';
import { reloadForDirection } from '@/lib/i18n/restart';
import { DEMO_PROFILE } from '@/lib/profile/mock';

/** A3 : « Profil ». */
export default function ProfileRoute() {
  const appearance = useAppearance();

  return (
    <Profile
      // Pas encore de compte : profil de démo. L'apparence et la langue, elles, sont vraiment retenues.
      profile={DEMO_PROFILE}
      appearance={appearance}
      onAppearanceChange={(value) => void setAppearance(value)}
      onLanguageChange={async (language) => {
        const result = await changeAppLanguage(language);
        // Quand l'appli peut se recharger seule, inutile de demander de la rouvrir.
        if (result.needsRestart && (await reloadForDirection())) return { needsRestart: false };
        return result;
      }}
      // Les écrans d'édition, l'aide et les comptes n'ont pas encore de maquette.
      onNotificationsChange={() => {}}
      onEditProfile={() => {}}
      onEditCar={() => {}}
      onHelp={() => {}}
      onSignOut={() => {}}
    />
  );
}
