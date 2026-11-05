import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

type FieldLabelProps = Pick<TextProps, 'nativeID'> & {
  children: string;
};

/** Libellé placé au-dessus d'un champ ou d'un groupe de choix (« D'où pars-tu ? »). */
export function FieldLabel({ children, nativeID }: FieldLabelProps) {
  const { components } = useTheme();
  return (
    <Text nativeID={nativeID} style={components.input.label}>
      {children}
    </Text>
  );
}
