import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@/lib/design/use-theme';

type SeatIconProps = {
  /** Libre : vert avec contour ; pris : gris plein. */
  free: boolean;
};

/** Siège de voiture (dossier + assise), décoratif : le nombre de places est dit en texte à côté. */
export function SeatIcon({ free }: SeatIconProps) {
  const { components, sizes } = useTheme();
  const { back, base, ...states } = components.seat;
  const { fill, stroke, strokeWidth } = free ? states.free : states.taken;

  return (
    <Svg
      width={sizes.seatWidth}
      height={sizes.seatHeight}
      viewBox={`0 0 ${sizes.seatWidth} ${sizes.seatHeight}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Rect {...back} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <Rect {...base} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </Svg>
  );
}
