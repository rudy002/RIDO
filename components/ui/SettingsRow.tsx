import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { Switch } from './Switch';

type SettingsRowProps = { label: string } & (
  | {
      /** Libellé et valeur courante à droite (« Langue · Français »). */
      variant: 'value';
      value?: string;
      onPress: () => void;
    }
  | {
      /** Petit libellé au-dessus de la valeur, chevron vers l'écran d'édition. */
      variant: 'detail';
      value: string;
      onPress: () => void;
    }
  | {
      variant: 'switch';
      value: boolean;
      onValueChange: (value: boolean) => void;
    }
);

const PRESSED_OPACITY = 0.85;

/** Ligne d'un groupe de réglages ; toute la ligne est touchable. */
export function SettingsRow(props: SettingsRowProps) {
  const { spacing, sizes } = useTheme();
  const { label } = props;

  const onPress =
    props.variant === 'switch' ? () => props.onValueChange(!props.value) : props.onPress;

  return (
    <Pressable
      // Interrupteur : c'est lui qui porte le rôle et l'état pour le lecteur d'écran.
      accessible={props.variant !== 'switch'}
      accessibilityRole={props.variant === 'switch' ? undefined : 'button'}
      accessibilityLabel={
        props.variant === 'switch' ? undefined : props.value ? `${label}, ${props.value}` : label
      }
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: sizes.buttonPrimary,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      {props.variant === 'detail' ? (
        <>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="textMuted">
              {label}
            </AppText>
            <AppText variant="bodyStrong">{props.value}</AppText>
          </View>
          <Icon as={ChevronRight} flipInRTL />
        </>
      ) : (
        <>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            {label}
          </AppText>
          {props.variant === 'switch' ? (
            <Switch value={props.value} onValueChange={props.onValueChange} label={label} />
          ) : props.value ? (
            <AppText color="textMuted">{props.value}</AppText>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
