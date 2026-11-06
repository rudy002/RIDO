import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from '../SegmentedControl';

describe('SegmentedControl', () => {
  it('signale l’onglet actif et renvoie celui qu’on touche', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        value="outbound"
        onChange={onChange}
        options={[
          { value: 'outbound', label: 'Aller' },
          { value: 'return', label: 'Retour' },
        ]}
      />
    );

    expect(screen.getByRole('tab', { name: 'Aller' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Retour' })).not.toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour' }));
    expect(onChange).toHaveBeenCalledWith('return');
  });
});
