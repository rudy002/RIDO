import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { loadAppearance, setAppearance } from '../appearance';
import { useTheme } from '../use-theme';

function SchemeProbe() {
  const { scheme } = useTheme();
  return <Text>{scheme}</Text>;
}

describe('apparence choisie', () => {
  afterEach(async () => {
    await act(() => setAppearance('system'));
  });

  it('remplace le thème du téléphone et se retient', async () => {
    await render(<SchemeProbe />);
    expect(screen.getByText('light')).toBeOnTheScreen();

    await act(() => setAppearance('dark'));
    expect(screen.getByText('dark')).toBeOnTheScreen();
    expect(await AsyncStorage.getItem('rido.appearance')).toBe('dark');
  });

  it('relit le choix au démarrage', async () => {
    await AsyncStorage.setItem('rido.appearance', 'dark');
    await render(<SchemeProbe />);

    await act(() => loadAppearance());
    expect(screen.getByText('dark')).toBeOnTheScreen();
  });
});
