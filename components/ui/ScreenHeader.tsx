import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { BackButton } from './BackButton';
import { IconButton } from './IconButton';

type ScreenHeaderProps = {
  /** Retour (étape d'un parcours) ou croix (écran ouvert par-dessus, qu'on ferme). */
  action: 'back' | 'close';
  onAction: () => void;
  /** Texte centré : « Étape 1 sur 2 », « Nouvel événement ». */
  title: string;
};

/** Haut d'écran : bouton retour ou fermer, et titre centré. */
export function ScreenHeader({ action, onAction, title }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const { sizes } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {action === 'back' ? (
        <BackButton onPress={onAction} />
      ) : (
        <IconButton icon={X} label={t('common.close')} onPress={onAction} />
      )}
      <AppText variant="label" color="textMuted" style={{ flex: 1, textAlign: 'center' }}>
        {title}
      </AppText>
      {/* Contrepoids du bouton pour centrer le titre. */}
      <View style={{ width: sizes.touchMin }} />
    </View>
  );
}
