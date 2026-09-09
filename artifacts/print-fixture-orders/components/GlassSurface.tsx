import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function GlassSurface({
  children,
  style,
  intensity = 38,
  strong = false,
  depth = strong ? 'deep' : 'standard',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
  depth?: 'light' | 'standard' | 'deep';
}) {
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';
  const depthStyles = {
    light: { overlay: 0.24, shadowOpacity: 0.08, shadowRadius: 14 },
    standard: { overlay: 0.34, shadowOpacity: 0.12, shadowRadius: 18 },
    deep: { overlay: 0.42, shadowOpacity: 0.16, shadowRadius: 24 },
  }[depth];
  const surfaceStyle = [
    styles.surface,
    {
      backgroundColor: 'transparent',
      borderColor: colors.glassBorder,
      shadowColor: colors.shadow,
      shadowOpacity: depthStyles.shadowOpacity,
      shadowRadius: depthStyles.shadowRadius,
    },
    style,
  ];

  if (Platform.OS === 'web') {
    return (
      <View style={[surfaceStyle, { backgroundColor: strong ? colors.glassStrong : colors.glass }]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.webHighlight, { backgroundColor: colors.glassHighlight, opacity: depthStyles.overlay }]} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bottomShade, { backgroundColor: colors.glassShadow }]} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={surfaceStyle}>
      <BlurView intensity={intensity + (depth === 'deep' ? 6 : depth === 'light' ? -6 : 0)} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glassOverlay, { backgroundColor: colors.glassHighlight, opacity: depthStyles.overlay }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bottomShade, { backgroundColor: colors.glassShadow }]} />
      <View pointerEvents="none" style={[styles.innerEdge, { borderColor: colors.glassHighlight }]} />
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
    shadowRadius: 18,
    elevation: 3,
  },
  content: { flex: 1 },
  glassOverlay: {},
  webHighlight: {},
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', opacity: 0.2 },
  innerEdge: { position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, borderWidth: 1, borderRadius: 25, opacity: 0.2 },
  topHighlight: { position: 'absolute', top: 1, left: 18, right: 18, height: 1, opacity: 0.8 },
});
