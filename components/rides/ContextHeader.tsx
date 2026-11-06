import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/design/use-theme';

type ContextHeaderProps = {
  /** « Mariage de Léa et Samuel · 14 juin » (coupé avec « … » si trop long). */
  label: string;
  onEdit: () => void;
};

/** Haut des écrans de trajet : pastille du contexte et bouton « Modifier ». */
export function ContextHeader({ label, onEdit }: ContextHeaderProps) {
  const { t } = useTranslation();
  const { spacing, radius } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing.md }}>
      <Badge
        tone="accent"
        label={label}
        singleLine
        style={{ flexShrink: 1, alignSelf: 'stretch', justifyContent: 'center' }}
      />
      <Button
        variant="outline"
        label={t('rides.edit')}
        accessibilityHint={t('rides.editHint')}
        onPress={onEdit}
        style={{ borderRadius: radius.pill }}
      />
    </View>
  );
}
