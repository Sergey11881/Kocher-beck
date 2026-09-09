import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function GlassSurface({
  children,
  style,
  intensity = 38,
  strong = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
}) {
  const colors = useColors();
  const surfaceStyle = [
    styles.surface,
    {
      backgroundColor: strong ? colors.glassStrong : colors.glass,
      borderColor: colors.glassBorder,
      shadowColor: colors.shadow,
    },
    style,
  ];

  if (Platform.OS === 'web') {
    return <View style={surfaceStyle}>{children}</View>;
  }

  return (
    <View style={surfaceStyle}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 8,
  },
  content: { flex: 1 },
});
