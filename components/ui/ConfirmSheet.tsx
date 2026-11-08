import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { PickerSheet } from './PickerSheet';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Demande de confirmation avant une action qu'on ne peut pas annuler. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const { spacing } = useTheme();

  return (
    <PickerSheet visible={visible} title={title} onClose={onCancel}>
      <View style={{ flex: 1, padding: spacing.screen, gap: spacing.xl }}>
        <AppText color="textMuted">{message}</AppText>
        <View style={{ gap: spacing.md }}>
          <Button variant="danger" label={confirmLabel} onPress={onConfirm} />
          <Button variant="outlineStrong" label={cancelLabel} onPress={onCancel} />
        </View>
      </View>
    </PickerSheet>
  );
}
