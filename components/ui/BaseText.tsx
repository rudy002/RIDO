import { Text, type TextProps } from 'react-native';

import { useTextDirection } from './use-text-direction';

/** `Text` qui suit le sens de lecture de la langue (pour les composants qui fixent leur propre style). */
export function BaseText({ style, children, ...props }: TextProps) {
  const direction = useTextDirection();
  return (
    <Text {...props} style={[direction.style, style]}>
      {direction.mark(children)}
    </Text>
  );
}
