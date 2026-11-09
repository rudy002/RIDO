import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO } from '@/lib/data/__fixtures__/demo';

import { Profile } from '../Profile';

async function renderProfile(profile = DEMO.profile) {
  const handlers = {
    onAppearanceChange: jest.fn(),
    onLanguageChange: jest.fn(),
    onNotificationsChange: jest.fn(),
    onEditProfile: jest.fn(),
    onEditCar: jest.fn(),
    onHelp: jest.fn(),
    onSignOut: jest.fn(),
  };
  await render(<Profile profile={profile} appearance="system" {...handlers} />);
  return handlers;
}

describe('Profile', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('présente la personne, sa voiture et ses réglages', async () => {
    await renderProfile();

    expect(screen.getByRole('header', { name: 'David Cohen' })).toBeOnTheScreen();
    expect(screen.getByText('052-123-4567')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Modèle et couleur, Toyota Corolla grise' })
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Places en général, 4 places' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Apparence, Automatique' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Langue, Français' })).toBeOnTheScreen();
  });

  it('bascule les notifications, aussi en touchant le texte', async () => {
    const { onNotificationsChange } = await renderProfile();

    const nearby = screen.getByRole('switch', { name: 'Quelqu’un cherche une place dans ma zone' });
    expect(nearby).toBeChecked();
    await fireEvent.press(nearby);
    await fireEvent.press(screen.getByText('Rappel une heure avant le départ'));

    expect(onNotificationsChange.mock.calls).toEqual([
      [{ nearbyRequests: false, departureReminder: true }],
      [{ nearbyRequests: true, departureReminder: false }],
    ]);
  });

  it('choisit l’apparence dans une feuille', async () => {
    const { onAppearanceChange } = await renderProfile();

    await fireEvent.press(screen.getByRole('button', { name: 'Apparence, Automatique' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sombre' }));

    expect(onAppearanceChange).toHaveBeenCalledWith('dark');
  });

  it('change de langue dans une feuille, sans redémarrage', async () => {
    const { onLanguageChange } = await renderProfile();

    await fireEvent.press(screen.getByRole('button', { name: 'Langue, Français' }));
    await fireEvent.press(screen.getByRole('button', { name: 'עברית' }));

    expect(onLanguageChange).toHaveBeenCalledWith('he');
    expect(screen.queryByRole('button', { name: 'עברית' })).toBeNull();
  });

  it('transmet les autres actions', async () => {
    const handlers = await renderProfile();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Départ habituel, Rova HaKirya, Ashdod' })
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Aide et contact' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(handlers.onSignOut).not.toHaveBeenCalled();
    // La confirmation : son bouton porte le même nom, c'est le dernier affiché.
    await fireEvent.press(screen.getAllByRole('button', { name: 'Se déconnecter' }).at(-1)!);

    expect(handlers.onEditCar).toHaveBeenCalledWith('usualDeparture');
    expect(handlers.onEditProfile).toHaveBeenCalledTimes(1);
    expect(handlers.onHelp).toHaveBeenCalledTimes(1);
    expect(handlers.onSignOut).toHaveBeenCalledTimes(1);
  });

  it('propose de créer un profil quand il n’y en a pas', async () => {
    const handlers = await renderProfile(null);

    expect(screen.queryByRole('button', { name: 'Se déconnecter' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Créer mon profil' }));
    expect(handlers.onEditProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Apparence, Automatique' })).toBeOnTheScreen();
  });
});
