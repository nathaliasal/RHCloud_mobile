import Ionicons from '@expo/vector-icons/Ionicons';
import { OpaqueColorValue } from 'react-native';
import { Icons, IconName } from '@/constants/icons';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string | OpaqueColorValue;
}

/**
 * Thin wrapper around Ionicons that consumes the central Icons map.
 * Use this instead of importing Ionicons or emoji directly.
 *
 * @example
 * <AppIcon name="bell" size={24} color="#00E5CC" />
 */
export function AppIcon({ name, size = 24, color = '#EDF4FF' }: AppIconProps) {
  return (
    <Ionicons
      name={Icons[name] as React.ComponentProps<typeof Ionicons>['name']}
      size={size}
      color={color}
    />
  );
}
