import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type PickerSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Fenêtre plein écran de choix (pays, heure…) : titre, bouton fermer, contenu. */
export function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  const { t } = useTranslation();
  const { colors, spacing, isRTL } = useTheme();
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
          // Une fenêtre Modal est hors de l'arbre principal : elle reprend le sens de lecture.
          direction: isRTL ? 'rtl' : 'ltr',
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
          <IconButton icon={X} label={t('common.close')} onPress={onClose} />
        </View>
        {children}
      </View>
    </Modal>
  );
}
