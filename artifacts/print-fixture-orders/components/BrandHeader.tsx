import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function BrandHeader({
  title,
  action,
  onAction,
  actionLabel,
}: {
  title?: string;
  action?: keyof typeof Feather.glyphMap;
  onAction?: () => void;
  actionLabel?: string;
}) {
  const colors = useColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.brand}>
        <Image source={require('@/assets/images/company-logo-icon.png')} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={[styles.wordmark, { color: colors.foreground }]}>KOCHER+BECK</Text>
          {title ? <Text style={[styles.context, { color: colors.mutedForeground }]}>{title}</Text> : null}
        </View>
      </View>
      {action && onAction ? (
        <Pressable accessibilityLabel={actionLabel} onPress={onAction} style={({ pressed }) => [styles.action, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
          <Feather name={action} size={18} color={colors.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 58, paddingHorizontal: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 28, borderRadius: 8 },
  wordmark: { fontSize: 12, letterSpacing: 1.4, fontFamily: 'Inter_700Bold' },
  context: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
  action: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
