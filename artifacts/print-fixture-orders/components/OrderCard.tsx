import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OrderSummary } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

export function OrderCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const colors = useColors();
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(order.created_at));

  return (
    <Pressable
      testID={`order-card-${order.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.typeDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: colors.cardForeground }]}>
        {order.order_number}
      </Text>
      <Text numberOfLines={2} style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {order.product_name}
        {order.client ? ` · ${order.client}` : ''}
      </Text>
      <View style={[styles.status, { backgroundColor: colors.accent }]}>
        <Text style={[styles.statusText, { color: colors.accentForeground }]}>Заявка принята</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  date: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'capitalize', flex: 1 },
  title: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  status: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});