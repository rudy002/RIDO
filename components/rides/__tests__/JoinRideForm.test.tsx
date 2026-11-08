import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { WEDDING } from '@/lib/data/__fixtures__/demo';
import type { RideDraft, TripDirection } from '@/lib/rides/types';

import { JoinRideForm } from '../JoinRideForm';

async function renderForm({
  directions = ['outbound', 'return'],
  initial,
}: { directions?: TripDirection[]; initial?: Partial<RideDraft> } = {}) {
  const onSubmit = jest.fn();
  const onBack = jest.fn();
  await render(
    <JoinRideForm
      outboundWindow={WEDDING.outboundWindow}
      returnAround={WEDDING.returnAround}
      activeZones={WEDDING.activeZones}
      defaultCountry="IL"
      directions={directions}
      initial={initial}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
  return { onSubmit, onBack };
}

describe('JoinRideForm', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('affiche les trajets et les zones reçus en props', async () => {
    await renderForm();

    expect(screen.getByText('Étape 1 sur 2')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Aller · 18h–19h30' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Retour · vers 01h' })).toBeChecked();
    expect(
      screen.getByText(
        'Déjà actives\u00a0: Ashdod (8), Tel-Aviv (5), Ashkelon (3), Gan Yavne (1), Kiryat Gat (1)'
      )
    ).toBeOnTheScreen();
  });

  async function fillIdentity(phone: string) {
    const zone = screen.getByLabelText('D’où pars-tu ?');
    await fireEvent(zone, 'focus');
    await fireEvent.changeText(zone, 'Ashd');
    await fireEvent.press(screen.getByRole('button', { name: 'Ashdod' }));
    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Levy');
    await fireEvent.changeText(screen.getByLabelText('Prénom'), 'David');
    await fireEvent.changeText(screen.getByLabelText('Téléphone'), phone);
  }

  it('n’autorise la suite qu’une fois tout rempli, puis envoie les réponses', async () => {
    const { onSubmit } = await renderForm();
    const next = screen.getByRole('button', { name: 'Continuer' });
    expect(next).toBeDisabled();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Retour · vers 01h' }));
    await fillIdentity('052 123 4567');
    expect(next).toBeDisabled();

    await fireEvent.press(screen.getByRole('radio', { name: 'J’ai une voiture' }));
    expect(next).toBeEnabled();
    await fireEvent.press(next);

    expect(onSubmit).toHaveBeenCalledWith({
      role: 'driver',
      directions: ['outbound'],
      zone: { placeId: '295629', name: 'Ashdod' },
      lastName: 'Levy',
      firstName: 'David',
      phone: '+972521234567',
      partySize: 1,
    });
  });

  it('demande combien on est, seulement pour chercher une place', async () => {
    const { onSubmit } = await renderForm();

    expect(screen.queryByText('Combien êtes-vous ?')).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Je cherche une place' }));
    expect(screen.getByText('Combien êtes-vous ?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Une personne de plus' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Une personne de plus' }));
    await fillIdentity('0521234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'passenger', partySize: 3 })
    );
  });

  it('ne propose que les trajets ouverts par l’organisateur', async () => {
    await renderForm({ directions: ['return'] });

    expect(screen.queryByRole('checkbox', { name: 'Aller · 18h–19h30' })).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Retour · vers 01h' })).toBeChecked();
  });

  it('reprend une inscription existante pour la modifier', async () => {
    const { onSubmit } = await renderForm({
      initial: {
        role: 'passenger',
        directions: ['return'],
        zone: { placeId: '8598981', name: 'Florentin, Tel-Aviv' },
        firstName: 'Noam',
        lastName: 'Katz',
        phone: '+972521230987',
        partySize: 2,
      },
    });

    expect(screen.getByRole('radio', { name: 'Je cherche une place' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Aller · 18h–19h30' })).not.toBeChecked();
    expect(screen.getByLabelText('D’où pars-tu ?')).toHaveDisplayValue('Florentin, Tel-Aviv');
    expect(screen.getByLabelText('Téléphone')).toHaveDisplayValue('0521230987');

    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
    expect(onSubmit).toHaveBeenCalledWith({
      role: 'passenger',
      directions: ['return'],
      zone: { placeId: '8598981', name: 'Florentin, Tel-Aviv' },
      lastName: 'Katz',
      firstName: 'Noam',
      phone: '+972521230987',
      partySize: 2,
    });
  });

  it('propose l’indicatif du pays de l’événement', async () => {
    await renderForm();

    expect(screen.getByRole('button', { name: 'Indicatif : Israël +972' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Téléphone')).toHaveProp('placeholder', '050-234-5678');
  });

  it('refuse les chiffres en trop pour le pays', async () => {
    await renderForm();
    const phone = screen.getByLabelText('Téléphone');

    await fireEvent.changeText(phone, '0521234567');
    await fireEvent.changeText(phone, '05212345678');

    expect(phone).toHaveDisplayValue('0521234567');
  });

  it('reconnaît un numéro international collé', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.press(screen.getByRole('radio', { name: 'Je cherche une place' }));
    await fillIdentity('+33 6 12 34 56 78');

    expect(screen.getByRole('button', { name: 'Indicatif : France +33' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ phone: '+33612345678' }));
  });

  it('change d’indicatif depuis la liste des pays', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Indicatif : Israël +972' }));
    await fireEvent.changeText(screen.getByLabelText('Rechercher un pays'), 'franc');
    await fireEvent.press(screen.getByRole('button', { name: 'France +33' }));

    await fireEvent.press(screen.getByRole('radio', { name: 'J’ai une voiture' }));
    await fillIdentity('06 12 34 56 78');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ phone: '+33612345678' }));
  });

  it('refuse un téléphone trop court', async () => {
    await renderForm();

    await fireEvent.press(screen.getByRole('radio', { name: 'J’ai une voiture' }));
    await fillIdentity('05212');

    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  it('bloque la suite si aucun trajet n’est choisi', async () => {
    await renderForm();

    await fireEvent.press(screen.getByRole('radio', { name: 'Je cherche une place' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Aller · 18h–19h30' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Retour · vers 01h' }));
    await fillIdentity('0521234567');

    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  it('propose les quartiers avec leur ville', async () => {
    await renderForm();
    const zone = screen.getByLabelText('D’où pars-tu ?');

    await fireEvent(zone, 'focus');
    await fireEvent.changeText(zone, 'floren');
    await fireEvent.press(screen.getByRole('button', { name: 'Florentin, Tel-Aviv' }));

    expect(zone).toHaveDisplayValue('Florentin, Tel-Aviv');
    expect(screen.queryByRole('button', { name: 'Florentin, Tel-Aviv' })).not.toBeOnTheScreen();
  });

  it('accepte un lieu absent de la liste via « Autre »', async () => {
    const { onSubmit } = await renderForm();
    const zone = screen.getByLabelText('D’où pars-tu ?');

    await fireEvent.press(screen.getByRole('radio', { name: 'J’ai une voiture' }));
    await fireEvent(zone, 'focus');
    await fireEvent.changeText(zone, 'Moshav Zzz');
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Autre\u00a0: «\u00a0Moshav Zzz\u00a0»' })
    );
    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Levy');
    await fireEvent.changeText(screen.getByLabelText('Prénom'), 'David');
    await fireEvent.changeText(screen.getByLabelText('Téléphone'), '0521234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ zone: { placeId: null, name: 'Moshav Zzz' } })
    );
  });

  it('revient en arrière', async () => {
    const { onBack } = await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
