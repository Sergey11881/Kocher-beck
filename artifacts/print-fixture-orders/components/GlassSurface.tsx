import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
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
    light: { shadowOpacity: 0.14, shadowRadius: 18 },
    standard: { shadowOpacity: 0.2, shadowRadius: 24 },
    deep: { shadowOpacity: 0.26, shadowRadius: 32 },
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

  return (
    <View style={surfaceStyle}>
      <BlurView intensity={intensity + (depth === 'deep' ? 12 : depth === 'light' ? -4 : 5)} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: strong ? colors.glassStrong : colors.glass }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.glassHighlight, 'transparent', colors.glassShadow]}
        locations={[0, 0.48, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.86, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.depthGradient]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', colors.glassHighlight, 'transparent']}
        locations={[0.12, 0.42, 0.78]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.72 }}
        style={[StyleSheet.absoluteFill, styles.specular]}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.sideShade, { backgroundColor: colors.glassShadow }]} />
      <View pointerEvents="none" style={[styles.innerEdge, { borderColor: colors.glassHighlight }]} />
      <View pointerEvents="none" style={[styles.topHighlight, { backgroundColor: colors.glassHighlight }]} />
      <View pointerEvents="none" style={[styles.bottomEdge, { backgroundColor: colors.glassShadow }]} />
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
  content: { flex: 1, zIndex: 2 },
  depthGradient: { opacity: 0.72 },
  specular: { opacity: 0.42, transform: [{ rotate: '-8deg' }, { scale: 1.25 }] },
  sideShade: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '16%', opacity: 0.12 },
  innerEdge: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderWidth: 1, borderRadius: 24, opacity: 0.35, zIndex: 1 },
  topHighlight: { position: 'absolute', top: 1, left: 20, right: 20, height: 2, borderRadius: 2, opacity: 0.72, zIndex: 1 },
  bottomEdge: { position: 'absolute', left: 18, right: 18, bottom: 1, height: 2, borderRadius: 2, opacity: 0.3, zIndex: 1 },
});
