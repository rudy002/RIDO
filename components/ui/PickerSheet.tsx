import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type PickerSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const PRESSED_OPACITY = 0.85;

/** Fenêtre plein écran de choix (pays, heure…) : titre, bouton fermer, contenu. */
export function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  const { t } = useTranslation();
  const { colors, spacing, sizes, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingHorizontal: spacing.screen,
            paddingTop: spacing.lg,
          }}>
          <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
            {title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
            style={({ pressed }) => [
              {
                width: sizes.touchMin,
                height: sizes.touchMin,
                borderRadius: radius.pill,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              },
              pressed && { opacity: PRESSED_OPACITY },
            ]}>
            <Icon as={X} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}
