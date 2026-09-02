import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function CreatorCredit({ floating = false }: { floating?: boolean }) {
  const colors = useColors();

  return (
    <View style={[styles.container, floating && { backgroundColor: colors.background }, floating && styles.floating]}>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>Created by Sergey Pavlov</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 76, marginTop: 0, paddingVertical: 4, zIndex: 10 },
  text: { fontSize: 10, letterSpacing: 0.35, fontFamily: 'Inter_400Regular', opacity: 0.58 },
});