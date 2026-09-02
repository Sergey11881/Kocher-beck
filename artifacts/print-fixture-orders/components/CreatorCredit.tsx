import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function CreatorCredit() {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>Created by Sergey Pavlov</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  text: { fontSize: 10, letterSpacing: 0.35, fontFamily: 'Inter_400Regular', opacity: 0.58 },
});