import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@/lib/design/use-theme';

type SeatIconProps = {
  /** Libre : vert avec contour ; pris : gris plein. */
  free: boolean;
  /** Plus grand, pour sa propre voiture. */
  large?: boolean;
};

/** Siège de voiture (dossier + assise), décoratif : le nombre de places est dit en texte à côté. */
export function SeatIcon({ free, large = false }: SeatIconProps) {
  const { components, sizes } = useTheme();
  const { back, base, ...states } = components.seat;
  const { fill, stroke, strokeWidth } = free ? states.free : states.taken;

  return (
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg
        width={large ? sizes.seatWidth * sizes.seatLargeScale : sizes.seatWidth}
        height={large ? sizes.seatHeight * sizes.seatLargeScale : sizes.seatHeight}
        viewBox={`0 0 ${sizes.seatWidth} ${sizes.seatHeight}`}>
        <Rect {...back} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <Rect {...base} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </Svg>
    </View>
  );
}
