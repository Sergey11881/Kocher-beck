import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { ReactNode, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function AnimatedPressable({
  children,
  onPress,
  style,
  disabled = false,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  const animate = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration: reducedMotion ? 0 : 90,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animate(0.985)}
      onPressOut={() => animate(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
