import { DEMO, NOW } from '@/lib/data/__fixtures__/demo';
import { REMINDER_LEAD_MS, remindersFor } from '@/lib/notifications/reminders';

describe('rappels « départ dans une heure »', () => {
  it('un rappel par trajet dont l’heure de départ est connue', () => {
    const reminders = remindersFor(DEMO, NOW);
    expect(reminders.map((r) => r.id)).toEqual(
      expect.arrayContaining(['demo:outbound', 'demo:return', 'noa:outbound'])
    );
    // Au retour des 30 ans de Noa, David cherche encore : pas d'heure, pas de rappel.
    expect(reminders.map((r) => r.id)).not.toContain('noa:return');
    for (const reminder of reminders) {
      expect(reminder.departure.getTime() - reminder.at.getTime()).toBe(REMINDER_LEAD_MS);
    }
  });

  it('dit avec qui part le passager, et ouvre le bon écran', () => {
    const reminders = remindersFor(DEMO, NOW);
    const asPassenger = reminders.find((r) => r.id === 'noa:outbound');
    const asDriver = reminders.find((r) => r.id === 'demo:outbound');
    expect(asPassenger).toMatchObject({ driverFirstName: 'Myriam', url: '/e/noa/rides' });
    expect(asDriver).toMatchObject({ url: '/e/demo/my-car' });
    expect(asDriver).not.toHaveProperty('driverFirstName');
  });

  it('rien quand l’utilisateur a coupé les rappels', () => {
    const profile = DEMO.profile;
    if (!profile) throw new Error('profil absent');
    const off = {
      ...DEMO,
      profile: {
        ...profile,
        notifications: { ...profile.notifications, departureReminder: false },
      },
    };
    expect(remindersFor(off, NOW)).toEqual([]);
  });

  it('rien pour un départ dans moins d’une heure', () => {
    const first = remindersFor(DEMO, NOW)[0];
    if (!first) throw new Error('aucun rappel');
    const later = new Date(first.at.getTime() + 60_000);
    expect(remindersFor(DEMO, later).map((r) => r.id)).not.toContain(first.id);
  });
});
