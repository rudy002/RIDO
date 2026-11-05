import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button', () => {
  it('affiche son libellé et réagit à l’appui', async () => {
    const onPress = jest.fn();
    await render(<Button label="Rejoindre" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Rejoindre' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ne réagit pas quand il est désactivé', async () => {
    const onPress = jest.fn();
    await render(<Button label="Rejoindre" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Rejoindre' });
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
