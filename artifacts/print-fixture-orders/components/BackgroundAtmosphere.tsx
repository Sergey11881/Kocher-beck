import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function BackgroundAtmosphere({ children }: { children: ReactNode }) {
  const colors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={[styles.orbTop, { backgroundColor: colors.primary }]} />
      <View pointerEvents="none" style={[styles.orbSide, { backgroundColor: colors.glassHighlight }]} />
      <View pointerEvents="none" style={[styles.orbCenter, { backgroundColor: colors.primary }]} />
      <View pointerEvents="none" style={[styles.orbBottom, { backgroundColor: colors.primary }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  orbTop: { position: 'absolute', width: 310, height: 310, borderRadius: 155, top: -205, right: -90, opacity: 0.1 },
  orbSide: { position: 'absolute', width: 250, height: 250, borderRadius: 125, top: 230, left: -185, opacity: 0.13 },
  orbCenter: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: '42%', right: -150, opacity: 0.045 },
  orbBottom: { position: 'absolute', width: 340, height: 340, borderRadius: 170, bottom: -245, right: -110, opacity: 0.075 },
});
