import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { WEDDING as DEMO_EVENT } from '@/lib/data/__fixtures__/demo';

import { EventInvitation } from '../EventInvitation';

const noop = { onJoin: jest.fn(), onOpenMyRide: jest.fn(), onOpenDashboard: jest.fn() };

describe('EventInvitation', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('affiche les informations reçues en props', async () => {
    await render(<EventInvitation event={DEMO_EVENT} {...noop} />);

    expect(screen.getByText('Mariage')).toBeOnTheScreen();
    expect(screen.getByText('Mariage de Léa et Samuel')).toBeOnTheScreen();
    expect(screen.getByText('Samedi 14 juin · 19h30 – 01h00')).toBeOnTheScreen();
    expect(screen.getByText('Domaine des Oliviers')).toBeOnTheScreen();
    expect(screen.getByText('Covoiturage organisé par David Cohen')).toBeOnTheScreen();
    expect(screen.getByLabelText('21 places proposées')).toBeOnTheScreen();
    expect(screen.getByLabelText('18 invités inscrits')).toBeOnTheScreen();
  });

  it('accorde les libellés au singulier', async () => {
    await render(
      <EventInvitation event={{ ...DEMO_EVENT, seatsOffered: 1, guestsCount: 1 }} {...noop} />
    );

    expect(screen.getByLabelText('1 place proposée')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 invité inscrit')).toBeOnTheScreen();
  });

  it('appelle onJoin quand on rejoint le covoiturage', async () => {
    const onJoin = jest.fn();
    await render(<EventInvitation event={DEMO_EVENT} {...noop} onJoin={onJoin} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Je rejoins le covoiturage' }));

    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('propose son trajet à qui est déjà inscrit, et le tableau de bord à l’organisateur', async () => {
    const onOpenMyRide = jest.fn();
    const onOpenDashboard = jest.fn();
    const onJoin = jest.fn();
    await render(
      <EventInvitation
        event={DEMO_EVENT}
        registeredAs="driver"
        isOrganizer
        onJoin={onJoin}
        onOpenMyRide={onOpenMyRide}
        onOpenDashboard={onOpenDashboard}
      />
    );

    expect(screen.queryByRole('button', { name: 'Je rejoins le covoiturage' })).toBeNull();
    expect(
      screen.getByText('Inscription enregistrée : tu viens avec ta voiture.')
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Voir ma voiture' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier mon inscription' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Voir le tableau de bord' }));

    expect(onOpenMyRide).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onOpenDashboard).toHaveBeenCalledTimes(1);
  });
});
