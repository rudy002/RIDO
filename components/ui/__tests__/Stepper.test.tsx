import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Stepper } from '../Stepper';

const renderStepper = async (value: number) => {
  const onChange = jest.fn();
  await render(
    <Stepper
      value={value}
      min={1}
      max={8}
      onChange={onChange}
      valueLabel={`${value} places`}
      decreaseLabel="Moins"
      increaseLabel="Plus"
    />
  );
  return onChange;
};

describe('Stepper', () => {
  it('ajoute et retire une unité', async () => {
    const onChange = await renderStepper(3);

    await fireEvent.press(screen.getByRole('button', { name: 'Plus' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Moins' }));

    expect(onChange.mock.calls).toEqual([[4], [2]]);
  });

  it('bloque aux limites', async () => {
    const onChange = await renderStepper(1);

    expect(screen.getByRole('button', { name: 'Moins' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Moins' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('se règle aussi au lecteur d’écran', async () => {
    const onChange = await renderStepper(3);

    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
