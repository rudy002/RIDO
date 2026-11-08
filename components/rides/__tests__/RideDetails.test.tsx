import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO } from '@/lib/data/__fixtures__/demo';
import { offerView, otherLegOf } from '@/lib/data/selectors';

import { RideDetails } from '../RideDetails';

async function renderDetails(rideId: string) {
  const leg = DEMO.driverLegs.find((d) => d.id === rideId);
  const offer = leg ? offerView(DEMO, leg, 'fr') : undefined;
  if (!leg || !offer) throw new Error(`trajet ${rideId} absent des données d’exemple`);
  const other = otherLegOf(DEMO, leg);
  const handlers = { onBack: jest.fn(), onCall: jest.fn(), onMessage: jest.fn() };
  await render(
    <RideDetails
      offer={offer}
      otherLeg={other ? offerView(DEMO, other, 'fr') : undefined}
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
    await renderDetails('d-david-out');

    expect(screen.getByRole('header', { name: 'David Cohen' })).toBeOnTheScreen();
    expect(screen.getByText('Conducteur · Ashdod, Rova HaKirya')).toBeOnTheScreen();
    expect(screen.getByText('Samedi 14 juin')).toBeOnTheScreen();
    expect(screen.getByText('Départ entre 18h00 et 18h30')).toBeOnTheScreen();
    expect(screen.getByText('Domaine des Oliviers')).toBeOnTheScreen();
    expect(screen.getByText('1 libre')).toBeOnTheScreen();
    expect(screen.getByText('Repart entre 00h30 et 01h00')).toBeOnTheScreen();
    expect(screen.getByText('2 libres')).toBeOnTheScreen();
  });

  it('part du lieu de l’événement quand on ouvre le retour', async () => {
    await renderDetails('d-david-ret');

    expect(screen.getByText('Dimanche 15 juin')).toBeOnTheScreen();
    expect(screen.getByText('Départ entre 00h30 et 01h00')).toBeOnTheScreen();
    expect(screen.getByText('Part entre 18h00 et 18h30')).toBeOnTheScreen();
  });

  it('n’affiche pas d’autre trajet si le conducteur ne fait qu’un sens', async () => {
    await renderDetails('d-myriam-out');
    expect(screen.queryByText(/^Part /)).toBeNull();
  });

  it('transmet les actions de contact et de retour', async () => {
    const { onBack, onCall, onMessage } = await renderDetails('d-david-out');

    await fireEvent.press(screen.getByRole('button', { name: 'Appeler David' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Écrire sur WhatsApp' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));

    expect(onCall).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
