import { Stack, useRouter } from 'expo-router';

import { ProfileForm } from '@/components/profile/ProfileForm';
import { updateProfile } from '@/lib/data/actions';
import { updateAppData, useAppData } from '@/lib/data/store';
import { deviceCountry } from '@/lib/phone/phone';
import { defaultEventCountry } from '@/lib/places/places';

/** Modifier son profil (depuis A3). */
export default function EditProfileRoute() {
  const router = useRouter();
  const data = useAppData();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ProfileForm
        profile={data.profile}
        country={defaultEventCountry(deviceCountry())}
        onClose={close}
        onSave={(profile) => {
          updateAppData((current) => updateProfile(current, profile));
          close();
        }}
      />
    </>
  );
}
