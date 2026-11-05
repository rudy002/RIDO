import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToggleButton } from '../ToggleButton';

describe('ToggleButton', () => {
  it('expose son état coché et réagit à l’appui', async () => {
    const onToggle = jest.fn();
    await render(<ToggleButton label="Aller" selected onToggle={onToggle} />);

    const toggle = screen.getByRole('checkbox', { name: 'Aller' });
    expect(toggle).toBeChecked();
    await fireEvent.press(toggle);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
