import * as Linking from 'expo-linking';

/**
 * Lien à partager pour un événement. Sans domaine choisi, c'est le lien de l'appli elle-même
 * (exp://… en développement, l'adresse du site sur le web) : il fonctionne déjà pour tester.
 * `EXPO_PUBLIC_SHARE_BASE_URL` (ex. : https://rido.app) le remplacera une fois le domaine validé.
 */
export function eventShareUrl(id: string): string {
  const base = process.env.EXPO_PUBLIC_SHARE_BASE_URL;
  const path = `e/${encodeURIComponent(id)}`;
  return base ? `${base.replace(/\/+$/, '')}/${path}` : Linking.createURL(path);
}

/** Version affichée, sans « https:// » : « rido.app/e/lea-samuel ». */
export function displayUrl(url: string): string {
  return decodeURIComponent(url.replace(/^[a-z]+:\/\//i, ''));
}
