import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
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
  const isDark = useColorScheme() === 'dark';
  const surfaceStyle = [
    styles.surface,
    {
      backgroundColor: 'transparent',
      borderColor: colors.glassBorder,
      shadowColor: colors.shadow,
    },
    style,
  ];

  if (Platform.OS === 'web') {
    return (
      <View style={[surfaceStyle, { backgroundColor: strong ? colors.glassStrong : colors.glass }]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.webHighlight, { backgroundColor: colors.glassHighlight }]} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={surfaceStyle}>
      <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glassOverlay, { backgroundColor: colors.glassHighlight }]} />
      <View pointerEvents="none" style={[styles.topHighlight, { backgroundColor: colors.glassBorder }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  content: { flex: 1 },
  glassOverlay: { opacity: 0.38 },
  webHighlight: { opacity: 0.32 },
  topHighlight: { position: 'absolute', top: 0, left: 18, right: 18, height: 1, opacity: 0.7 },
});
