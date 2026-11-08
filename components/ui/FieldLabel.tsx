import { type TextProps } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { BaseText } from './BaseText';

type FieldLabelProps = Pick<TextProps, 'nativeID'> & {
  children: string;
};

/** Libellé placé au-dessus d'un champ ou d'un groupe de choix (« D'où pars-tu ? »). */
export function FieldLabel({ children, nativeID }: FieldLabelProps) {
  const { components } = useTheme();
  return (
    <BaseText nativeID={nativeID} style={components.input.label}>
      {children}
    </BaseText>
  );
}
