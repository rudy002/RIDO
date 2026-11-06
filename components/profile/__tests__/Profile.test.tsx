import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_PROFILE } from '@/lib/profile/mock';

import { Profile } from '../Profile';

async function renderProfile(needsRestart = false) {
  const handlers = {
    onAppearanceChange: jest.fn(),
    onLanguageChange: jest.fn(() => Promise.resolve({ needsRestart })),
    onNotificationsChange: jest.fn(),
    onEditProfile: jest.fn(),
    onEditCar: jest.fn(),
    onHelp: jest.fn(),
    onSignOut: jest.fn(),
  };
  await render(<Profile profile={DEMO_PROFILE} appearance="system" {...handlers} />);
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

    expect(onNotificationsChange).toHaveBeenLastCalledWith({
      nearbyRequests: false,
      departureReminder: false,
    });
  });

  it('choisit l’apparence dans une feuille', async () => {
    const { onAppearanceChange } = await renderProfile();

    await fireEvent.press(screen.getByRole('button', { name: 'Apparence, Automatique' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sombre' }));

    expect(onAppearanceChange).toHaveBeenCalledWith('dark');
  });

  it('prévient qu’un redémarrage est nécessaire pour l’hébreu', async () => {
    const { onLanguageChange } = await renderProfile(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue, Français' }));
    await fireEvent.press(screen.getByRole('button', { name: 'עברית' }));

    expect(onLanguageChange).toHaveBeenCalledWith('he');
    expect(
      screen.getByText(
        'Ferme puis rouvre l’appli pour appliquer le sens de lecture de cette langue.'
      )
    ).toBeOnTheScreen();
  });

  it('transmet les autres actions', async () => {
    const handlers = await renderProfile();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Départ habituel, Ashdod, centre-ville' })
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Aide et contact' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Se déconnecter' }));

    expect(handlers.onEditCar).toHaveBeenCalledWith('usualDeparture');
    expect(handlers.onEditProfile).toHaveBeenCalledTimes(1);
    expect(handlers.onHelp).toHaveBeenCalledTimes(1);
    expect(handlers.onSignOut).toHaveBeenCalledTimes(1);
  });
});
