import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_EVENT } from '@/lib/events/mock';

import { EventInvitation } from '../EventInvitation';

describe('EventInvitation', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('affiche les informations reçues en props', async () => {
    await render(<EventInvitation event={DEMO_EVENT} onJoin={jest.fn()} />);

    expect(screen.getByText('Mariage')).toBeOnTheScreen();
    expect(screen.getByText('Léa et Samuel')).toBeOnTheScreen();
    expect(screen.getByText('Samedi 14 juin · 19h30 – 01h00')).toBeOnTheScreen();
    expect(screen.getByText('Domaine des Oliviers')).toBeOnTheScreen();
    expect(screen.getByText('Covoiturage organisé par Léa Cohen')).toBeOnTheScreen();
    expect(screen.getByLabelText('14 places proposées')).toBeOnTheScreen();
    expect(screen.getByLabelText('23 invités inscrits')).toBeOnTheScreen();
  });

  it('accorde les libellés au singulier', async () => {
    await render(
      <EventInvitation
        event={{ ...DEMO_EVENT, seatsOffered: 1, guestsCount: 1 }}
        onJoin={jest.fn()}
      />
    );

    expect(screen.getByLabelText('1 place proposée')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 invité inscrit')).toBeOnTheScreen();
  });

  it('appelle onJoin quand on rejoint le covoiturage', async () => {
    const onJoin = jest.fn();
    await render(<EventInvitation event={DEMO_EVENT} onJoin={onJoin} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Je rejoins le covoiturage' }));

    expect(onJoin).toHaveBeenCalledTimes(1);
  });
});
