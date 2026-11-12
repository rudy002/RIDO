import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAppData } from '@/lib/data/store';
import { useTheme } from '@/lib/design/use-theme';
import i18n from '@/lib/i18n';
import { formatTime } from '@/lib/i18n/format';

import {
  enableNotifications,
  scheduleReminders,
  urlOf,
  useLastNotificationResponse,
  type ReminderText,
} from './device';
import { remindersFor } from './reminders';

/** Les rappels attendent que les changements rapprochés (relectures) soient passés. */
const REMINDER_DELAY_MS = 1500;

/**
 * Demande l'autorisation d'envoyer des notifications, au moment où elles deviennent utiles
 * (après une inscription, une voiture publiée, un événement créé). Une seule fois : Android ne
 * redemande pas après un refus.
 */
export function askForNotifications(): void {
  void enableNotifications({
    ask: true,
    language: i18n.language,
    channelName: i18n.t('notifications.channel'),
  });
}

/**
 * Notifications de l'appli, à monter une fois à la racine : enregistre ce téléphone (s'il les
 * accepte déjà), tient les rappels à jour, et ouvre l'écran d'une notification touchée.
 */
export function useNotifications(): void {
  const router = useRouter();
  const data = useAppData();
  const { language } = useTheme();

  // Compte ou langue qui change : le serveur doit savoir où et comment écrire.
  useEffect(() => {
    if (!data.userId) return;
    void enableNotifications({
      ask: false,
      language,
      channelName: i18n.t('notifications.channel'),
    });
  }, [data.userId, language]);

  useEffect(() => {
    const text: ReminderText = (reminder) => {
      const time = formatTime(reminder.departure, language);
      return {
        title: i18n.t('notifications.reminder.title'),
        body: reminder.driverFirstName
          ? i18n.t('notifications.reminder.passenger', {
              driver: reminder.driverFirstName,
              event: reminder.eventTitle,
              time,
            })
          : i18n.t('notifications.reminder.driver', { event: reminder.eventTitle, time }),
      };
    };
    const timer = setTimeout(
      () => void scheduleReminders(remindersFor(data, new Date()), text),
      REMINDER_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [data, language]);

  // Notification touchée (appli ouverte, en arrière-plan ou fermée) : son écran s'ouvre, une fois.
  const response = useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    const url = urlOf(response);
    const id = response?.notification.request.identifier ?? null;
    if (!url || id === handled.current) return;
    handled.current = id;
    router.push(url as Href);
  }, [response, router]);
}
