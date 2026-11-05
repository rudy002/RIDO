import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('TextField', () => {
  it('relie le libellé au champ et affiche l’aide', async () => {
    const onChangeText = jest.fn();
    await render(
      <TextField
        label="Ton prénom"
        hint="Visible par les invités"
        value=""
        onChangeText={onChangeText}
      />
    );

    await fireEvent.changeText(screen.getByLabelText('Ton prénom'), 'David');

    expect(onChangeText).toHaveBeenCalledWith('David');
    expect(screen.getByText('Visible par les invités')).toBeOnTheScreen();
  });
});
