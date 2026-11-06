import { Tabs } from 'expo-router';
import { CalendarDays, Route, UserRound } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/components/ui/TabBar';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS = [
  { name: 'index', label: 'tabs.trips', icon: Route },
  { name: 'my-events', label: 'tabs.events', icon: CalendarDays },
  { name: 'profile', label: 'tabs.profile', icon: UserRound },
] as const;

/** Navigation principale de l'appli (A1 à A3). Les écrans invités et organisateur n'ont pas d'onglets. */
export default function TabsLayout() {
  const { t } = useTranslation();

  const renderTabBar = ({ state, navigation }: TabBarProps) => (
    <TabBar
      items={TABS.map((tab) => {
        const index = state.routes.findIndex((route) => route.name === tab.name);
        const route = state.routes[index];
        return {
          key: tab.name,
          label: t(tab.label),
          icon: tab.icon,
          selected: state.index === index,
          onPress: () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route?.key,
              canPreventDefault: true,
            });
            if (state.index !== index && !event.defaultPrevented) navigation.navigate(tab.name);
          },
        };
      })}
    />
  );

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: t(tab.label) }} />
      ))}
    </Tabs>
  );
}
