import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';

export function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const colors = useColors();
  const isDraft = order.status === 'draft';
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(
    new Date(order.updatedAt),
  );

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
        <View style={[styles.typeDot, { backgroundColor: isDraft ? colors.primary : colors.accent }]} />
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
        <View style={styles.arrow}>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: colors.cardForeground }]}>
        {order.title || 'Заявка без названия'}
      </Text>
      <Text numberOfLines={1} style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {order.productType || 'Тип оснастки не указан'}
        {order.company ? ` · ${order.company}` : ''}
      </Text>
      <View style={styles.cardBottom}>
        <View style={[styles.status, { backgroundColor: isDraft ? colors.secondary : colors.accent }]}>
          <Text style={[styles.statusText, { color: isDraft ? colors.secondaryForeground : colors.accentForeground }]}>
            {isDraft ? 'Черновик' : 'Отправлена'}
          </Text>
        </View>
        <Text style={[styles.quantity, { color: colors.mutedForeground }]}>
          {order.quantity ? `${order.quantity.toLocaleString('ru-RU')} шт.` : 'Количество не указано'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'capitalize',
  },
  arrow: {
    marginLeft: 'auto',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  quantity: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginLeft: 'auto',
  },
});