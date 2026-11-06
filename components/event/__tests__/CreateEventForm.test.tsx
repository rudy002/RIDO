import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { CreateEventForm } from '../CreateEventForm';

const TODAY = new Date(2025, 5, 2, 10, 0);

async function renderForm() {
  const onCreate = jest.fn();
  const onClose = jest.fn();
  await render(<CreateEventForm onClose={onClose} onCreate={onCreate} today={TODAY} />);
  return { onCreate, onClose };
}

async function fillRequired() {
  await fireEvent.changeText(
    screen.getByLabelText('Nom de l’événement'),
    'Mariage de Léa et Samuel'
  );
  await fireEvent.changeText(screen.getByLabelText('Lieu'), 'Domaine des Oliviers');
  await fireEvent.press(screen.getByRole('button', { name: 'Date, Choisir' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Samedi 14 juin' }));
}

describe('CreateEventForm', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('propose Mariage, l’aller et le retour par défaut', async () => {
    await renderForm();

    expect(screen.getByText('Nouvel événement')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Mariage' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Bar/Bat mitzvah' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: /^Aller/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: /^Retour/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Créer et obtenir le lien' })).toBeDisabled();
  });

  it('crée l’événement avec la date, les heures et les trajets', async () => {
    const { onCreate } = await renderForm();
    await fillRequired();

    expect(screen.getByRole('button', { name: 'Date, Sam. 14/06' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Début, 19h00' }));
    await fireEvent.press(screen.getByRole('button', { name: '19h30' }));
    // La fin suit le début : 4 h plus tard, donc après minuit.
    expect(screen.getByRole('button', { name: 'Fin, 23h30' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fin, 23h30' }));
    await fireEvent.press(screen.getByRole('button', { name: '01h00' }));

    await fireEvent.press(screen.getByRole('radio', { name: 'Festival' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Créer et obtenir le lien' }));

    expect(onCreate).toHaveBeenCalledWith({
      type: 'festival',
      name: 'Mariage de Léa et Samuel',
      venue: 'Domaine des Oliviers',
      startsAt: new Date(2025, 5, 14, 19, 30),
      endsAt: new Date(2025, 5, 15, 1, 0),
      directions: ['outbound', 'return'],
    });
  });

  it('bloque et explique quand aucun trajet n’est choisi', async () => {
    const { onCreate } = await renderForm();
    await fillRequired();

    await fireEvent.press(screen.getByRole('switch', { name: /^Aller/ }));
    await fireEvent.press(screen.getByRole('switch', { name: /^Retour/ }));

    expect(
      screen.getByText('Choisis au moins un trajet : l’aller, le retour ou les deux.')
    ).toBeOnTheScreen();
    const submit = screen.getByRole('button', { name: 'Créer et obtenir le lien' });
    expect(submit).toBeDisabled();
    await fireEvent.press(submit);
    expect(onCreate).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('switch', { name: /^Retour/ }));
    expect(submit).toBeEnabled();
  });

  it('se ferme avec la croix', async () => {
    const { onClose } = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
