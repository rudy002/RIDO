import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { registerPushToken } from '@/lib/backend/remote';
import { callServer } from '@/lib/data/store';

import type { Reminder } from './reminders';

/*
 * Notifications sur le téléphone :
 * - envoyées par le serveur (réservation, annulation, événement modifié) : il faut que le téléphone
 *   donne son « jeton » au serveur. Impossible dans Expo Go sur Android (version de test requise) ;
 * - programmées sur le téléphone lui-même (rappel une heure avant le départ) : partout.
 * Rien sur le web.
 */

const CHANNEL_ID = 'default';
const REMINDER_PREFIX = 'reminder:';

const supported = Platform.OS !== 'web';

if (supported) {
  // Application ouverte : la notification s'affiche quand même, en bandeau.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureChannel(name: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Autorise les notifications (en le demandant si `ask`), puis enregistre ce téléphone auprès du
 * serveur. Renvoie `false` si ce n'est pas possible ou pas accepté ; aucune erreur n'est remontée :
 * les notifications sont un plus, jamais un blocage.
 */
export async function enableNotifications(options: {
  ask: boolean;
  language: string;
  channelName: string;
}): Promise<boolean> {
  if (!supported || !Device.isDevice) return false;
  try {
    await ensureChannel(options.channelName);
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && options.ask) {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return false;
    // Expo Go sur Android ne reçoit pas les notifications du serveur : les rappels suffisent.
    if (isRunningInExpoGo() && Platform.OS === 'android') return true;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (typeof projectId !== 'string') return true;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await callServer((client) => registerPushToken(client, token, options.language));
    return true;
  } catch {
    return false;
  }
}

export type ReminderText = (reminder: Reminder) => { title: string; body: string };

/**
 * Reprogramme les rappels « départ dans une heure » : les anciens sont retirés, les nouveaux
 * ajoutés (horaires modifiés, trajet annulé…). Seulement si les notifications sont autorisées.
 */
export async function scheduleReminders(reminders: Reminder[], text: ReminderText): Promise<void> {
  if (!supported) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((notification) => notification.identifier.startsWith(REMINDER_PREFIX))
        .map((notification) =>
          Notifications.cancelScheduledNotificationAsync(notification.identifier)
        )
    );
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${reminder.id}`,
        content: { ...text(reminder), sound: 'default', data: { url: reminder.url } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.at,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // Rappels indisponibles (stockage plein…) : l'appli fonctionne sans.
  }
}

/** L'écran à ouvrir quand on touche une notification (« /e/<id>/my-car »). */
export function urlOf(response: Notifications.NotificationResponse | null | undefined) {
  const url: unknown = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? url : null;
}

export const useLastNotificationResponse = supported
  ? Notifications.useLastNotificationResponse
  : () => null;
