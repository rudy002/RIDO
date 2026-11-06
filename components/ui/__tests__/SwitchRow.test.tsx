import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { SwitchRow } from '../SwitchRow';

describe('SwitchRow', () => {
  it('expose un interrupteur coché qui bascule', async () => {
    const onValueChange = jest.fn();
    await render(
      <SwitchRow
        title="Aller"
        subtitle="Vers le lieu de l’événement"
        value
        onValueChange={onValueChange}
      />
    );

    const toggle = screen.getByRole('switch', { name: 'Aller, Vers le lieu de l’événement' });
    expect(toggle).toBeChecked();

    await fireEvent.press(toggle);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('bascule aussi en touchant le texte', async () => {
    const onValueChange = jest.fn();
    await render(<SwitchRow title="Retour" value={false} onValueChange={onValueChange} />);

    await fireEvent.press(screen.getByText('Retour'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
