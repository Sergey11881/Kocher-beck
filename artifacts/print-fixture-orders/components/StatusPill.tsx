import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function StatusPill({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: colors.accent, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.label, { color: colors.accentForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
