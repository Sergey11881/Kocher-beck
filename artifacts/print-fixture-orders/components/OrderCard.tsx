import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OrderSummary } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { GlassSurface } from '@/components/GlassSurface';

const stages = ['Получен', 'Ожидает согласования', 'В производстве', 'Доставка', 'Готов к отгрузке'];

export function OrderCard({ order, onPress, onRepeat }: { order: OrderSummary; onPress: () => void; onRepeat?: () => void }) {
  const colors = useColors();
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(order.created_at));
  const currentStage = Math.max(0, stages.indexOf(order.status ?? 'Получен'));

  return (
    <GlassSurface style={styles.card}>
      <Pressable testID={`order-card-${order.id}`} onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
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
        <Text style={[styles.statusText, { color: colors.accentForeground }]}>{order.status}</Text>
      </View>
      <View style={styles.stages} accessibilityLabel="Этапы заказа">
        {stages.map((stage, index) => (
          <View key={stage} style={styles.stageItem}>
            <View style={[styles.stageTrack, { backgroundColor: index <= currentStage ? colors.primary : colors.border }]} />
            <Text numberOfLines={1} style={[styles.stageLabel, { color: index === currentStage ? colors.foreground : colors.mutedForeground }]}>{stage}</Text>
          </View>
        ))}
      </View>
      {onRepeat ? (
        <Pressable testID={`repeat-order-${order.id}`} onPress={onRepeat} style={({ pressed }) => [styles.repeatButton, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
          <Feather name="refresh-cw" size={14} color={colors.primary} />
          <Text style={[styles.repeatText, { color: colors.primary }]}>Повторить заказ</Text>
        </Pressable>
      ) : null}
    </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  date: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'capitalize', flex: 1 },
  title: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  status: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  stages: { flexDirection: 'row', gap: 4, marginTop: 14 },
  stageItem: { flex: 1, minWidth: 0 },
  stageTrack: { height: 4, borderRadius: 2 },
  stageLabel: { fontSize: 8, lineHeight: 11, fontFamily: 'Inter_500Medium', marginTop: 5 },
  repeatButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  repeatText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});