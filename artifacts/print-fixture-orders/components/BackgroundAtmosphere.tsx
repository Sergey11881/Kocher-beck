import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function BackgroundAtmosphere({ children }: { children: ReactNode }) {
  const colors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={[styles.orbTop, { backgroundColor: colors.primary }]} />
      <View pointerEvents="none" style={[styles.orbSide, { backgroundColor: colors.glassHighlight }]} />
      <View pointerEvents="none" style={[styles.orbBottom, { backgroundColor: colors.primary }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  orbTop: { position: 'absolute', width: 230, height: 230, borderRadius: 115, top: -150, right: -70, opacity: 0.08 },
  orbSide: { position: 'absolute', width: 190, height: 190, borderRadius: 95, top: 260, left: -145, opacity: 0.16 },
  orbBottom: { position: 'absolute', width: 260, height: 260, borderRadius: 130, bottom: -190, right: -90, opacity: 0.05 },
});
