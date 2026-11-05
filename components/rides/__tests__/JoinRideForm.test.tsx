import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_EVENT } from '@/lib/events/mock';

import { JoinRideForm } from '../JoinRideForm';

async function renderForm() {
  const onSubmit = jest.fn();
  const onBack = jest.fn();
  await render(
    <JoinRideForm
      outboundWindow={DEMO_EVENT.outboundWindow}
      returnAround={DEMO_EVENT.returnAround}
      activeZones={DEMO_EVENT.activeZones}
      defaultCountry="IL"
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
      screen.getByText('Déjà actives : Ashdod (5), Tel-Aviv (8), Yavne (1)')
    ).toBeOnTheScreen();
  });

  async function fillIdentity(phone: string) {
    await fireEvent.changeText(screen.getByLabelText('D’où pars-tu ?'), 'Ashdod');
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
      zone: 'Ashdod',
      lastName: 'Levy',
      firstName: 'David',
      phone: '+972521234567',
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

  it('revient en arrière', async () => {
    const { onBack } = await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
