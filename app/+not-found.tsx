import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View>
        <Text>Cet écran n’existe pas.</Text>

        <Link href="/">
          <Text>Retour à l’accueil</Text>
        </Link>
      </View>
    </>
  );
}
