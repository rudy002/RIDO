import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { findMockMatch, findMockOtherLeg } from '@/lib/rides/mock';

import { RideDetails } from '../RideDetails';

async function renderDetails(rideId: string) {
  const match = findMockMatch(rideId);
  if (!match) throw new Error(`trajet ${rideId} absent des données d’exemple`);
  const handlers = { onBack: jest.fn(), onCall: jest.fn(), onMessage: jest.fn() };
  await render(
    <RideDetails
      offer={match.offer}
      otherLeg={findMockOtherLeg(match)?.offer}
      destination={{ title: 'Domaine des Oliviers', subtitle: 'Début de l’événement à 19h30' }}
      {...handlers}
    />
  );
  return handlers;
}

describe('RideDetails', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('présente le conducteur, le trajet aller et son retour', async () => {
    await renderDetails('out-david');

    expect(screen.getByRole('header', { name: 'David Cohen' })).toBeOnTheScreen();
    expect(screen.getByText('Conducteur · Ashdod, Centre-ville')).toBeOnTheScreen();
    expect(screen.getByText('Samedi 14 juin')).toBeOnTheScreen();
    expect(screen.getByText('Départ entre 18h00 et 18h30')).toBeOnTheScreen();
    expect(screen.getByText('Domaine des Oliviers')).toBeOnTheScreen();
    expect(screen.getByText('3 libres')).toBeOnTheScreen();
    expect(screen.getByText('Repart entre 00h30 et 01h00')).toBeOnTheScreen();
    expect(screen.getByText('2 libres')).toBeOnTheScreen();
  });

  it('part du lieu de l’événement quand on ouvre le retour', async () => {
    await renderDetails('ret-david');

    expect(screen.getByText('Dimanche 15 juin')).toBeOnTheScreen();
    expect(screen.getByText('Départ entre 00h30 et 01h00')).toBeOnTheScreen();
    expect(screen.getByText('Part entre 18h00 et 18h30')).toBeOnTheScreen();
  });

  it('n’affiche pas d’autre trajet si le conducteur ne fait qu’un sens', async () => {
    await renderDetails('ret-sarah');
    expect(screen.queryByText(/^Part /)).toBeNull();
  });

  it('transmet les actions de contact et de retour', async () => {
    const { onBack, onCall, onMessage } = await renderDetails('out-david');

    await fireEvent.press(screen.getByRole('button', { name: 'Appeler David' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Écrire sur WhatsApp' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));

    expect(onCall).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
