import * as SwitchPrimitive from '@rn-primitives/switch';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Lu par le lecteur d'écran. */
  label: string;
};

/**
 * Interrupteur dessiné avec les tokens, identique sur iOS, Android et web.
 * Le comportement et l'accessibilité (rôle « switch », état coché) viennent de @rn-primitives.
 */
export function Switch({ value, onValueChange, label }: SwitchProps) {
  const { components, radius } = useTheme();
  const { trackOn, trackOff, thumb, width, height, thumbSize } = components.switch;
  const inset = (height - thumbSize) / 2;

  return (
    <SwitchPrimitive.Root
      checked={value}
      onCheckedChange={onValueChange}
      aria-label={label}
      style={{
        width,
        height,
        borderRadius: radius.pill,
        padding: inset,
        backgroundColor: value ? trackOn : trackOff,
        // La pastille glisse vers la fin : à droite en LTR, à gauche en RTL.
        alignItems: value ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
      }}>
      <SwitchPrimitive.Thumb asChild>
        <View
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: radius.pill,
            backgroundColor: thumb,
          }}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
