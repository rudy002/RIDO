import '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { CalendarDays, Route } from 'lucide-react-native';

import { TabBar } from '../TabBar';

describe('TabBar', () => {
  it('signale l’onglet actif et transmet le choix', async () => {
    const onEvents = jest.fn();
    await render(
      <TabBar
        items={[
          { key: 'trips', label: 'Mes trajets', icon: Route, selected: true, onPress: jest.fn() },
          {
            key: 'events',
            label: 'Mes événements',
            icon: CalendarDays,
            selected: false,
            onPress: onEvents,
          },
        ]}
      />
    );

    expect(screen.getByRole('tab', { name: 'Mes trajets' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Mes événements' })).not.toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Mes événements' }));
    expect(onEvents).toHaveBeenCalledTimes(1);
  });
});
