import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { CarFront } from 'lucide-react-native';

import { RadioCard } from '../RadioCard';

describe('RadioCard', () => {
  it('est annoncé comme bouton radio avec son état', async () => {
    await render(
      <RadioCard
        icon={CarFront}
        title="J’ai une voiture"
        description="Je peux emmener des gens"
        selected
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByRole('radio', { name: 'J’ai une voiture' })).toBeChecked();
    expect(screen.getByText('Je peux emmener des gens')).toBeOnTheScreen();
  });

  it('appelle onSelect à l’appui', async () => {
    const onSelect = jest.fn();
    await render(
      <RadioCard
        icon={CarFront}
        title="J’ai une voiture"
        description="Je peux emmener des gens"
        selected={false}
        onSelect={onSelect}
      />
    );

    const radio = screen.getByRole('radio', { name: 'J’ai une voiture' });
    expect(radio).not.toBeChecked();
    await fireEvent.press(radio);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
