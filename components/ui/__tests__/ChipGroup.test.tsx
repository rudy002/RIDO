import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChipGroup } from '../ChipGroup';

describe('ChipGroup', () => {
  it('ne garde qu’un choix et signale celui qui est actif', async () => {
    const onChange = jest.fn();
    await render(
      <ChipGroup
        label="Type"
        value="wedding"
        onChange={onChange}
        options={[
          { value: 'wedding', label: 'Mariage' },
          { value: 'festival', label: 'Festival' },
        ]}
      />
    );

    expect(screen.getByRole('radio', { name: 'Mariage' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Festival' })).not.toBeChecked();

    await fireEvent.press(screen.getByRole('radio', { name: 'Festival' }));
    expect(onChange).toHaveBeenCalledWith('festival');
  });
});
