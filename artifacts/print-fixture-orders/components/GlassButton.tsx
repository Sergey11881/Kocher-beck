import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';

type Variant = 'primary' | 'secondary' | 'ghost';

export function GlassButton({
  label,
  onPress,
  icon,
  variant = 'secondary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Feather>['name'];
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, {
        backgroundColor: isPrimary ? colors.primary : isGhost ? 'transparent' : colors.secondary,
        borderColor: isPrimary ? colors.primary : colors.border,
        opacity: disabled ? 0.45 : 1,
      }, style]}
    >
      <Text style={[styles.label, { color: isPrimary ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
      {icon ? <Feather name={icon} size={colors.iconSize.sm} color={isPrimary ? colors.primaryForeground : colors.primary} /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
