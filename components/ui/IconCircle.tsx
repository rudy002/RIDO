import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { Icon } from './Icon';

type IconCircleProps = {
  icon: LucideIcon;
};

/** Grand rond jaune avec une icône (réussite d'une action). Décoratif. */
export function IconCircle({ icon }: IconCircleProps) {
  const { colors, sizes, radius } = useTheme();

  return (
    <View
      style={{
        width: sizes.iconCircle,
        height: sizes.iconCircle,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon as={icon} color="onPrimary" size={sizes.iconCircleGlyph} />
    </View>
  );
}
