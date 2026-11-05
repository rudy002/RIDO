import { Redirect } from 'expo-router';

// Provisoire : l'accueil ouvre l'invitation d'exemple, le temps de construire les autres écrans.
export default function HomeScreen() {
  return <Redirect href="/e/demo" />;
}
