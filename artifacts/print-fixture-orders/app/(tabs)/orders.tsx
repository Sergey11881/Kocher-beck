import { Feather } from '@expo/vector-icons';
import { getApiErrorMessage, useGetOrders } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/OrderCard';
import { useColors } from '@/hooks/useColors';

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ordersQuery = useGetOrders();
  const orders = ordersQuery.data ?? [];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={ordersQuery.isFetching} onRefresh={() => void ordersQuery.refetch()} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>ИСТОРИЯ</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Мои заявки</Text>
        </View>
        <Pressable
          testID="orders-add-button"
          onPress={() => router.push('/new-order')}
          style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {ordersQuery.isError ? 'Сервер временно недоступен' : orders.length === 0 ? 'Пока нет заявок' : `${orders.length} ${orders.length === 1 ? 'заявка' : 'заявок'}`}
      </Text>

      <View style={styles.list}>
        {ordersQuery.isError ? (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="wifi-off" size={28} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.cardForeground }]}>{getApiErrorMessage(ordersQuery.error, 'Не удалось получить заявки')}</Text>
            <Pressable onPress={() => void ordersQuery.refetch()} style={[styles.emptyButton, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.emptyButtonText, { color: colors.secondaryForeground }]}>Повторить</Text>
            </Pressable>
          </View>
        ) : orders.length > 0 ? (
          orders.map((order) => <OrderCard key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} onRepeat={() => router.push(`/new-order?repeat=${order.id}`)} />)
        ) : (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="inbox" size={28} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.cardForeground }]}>Заявки ещё не создавались</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Начните с заполнения параметров вашего заказа.</Text>
            <Pressable onPress={() => router.push('/new-order')} style={({ pressed }) => [styles.emptyButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[styles.emptyButtonText, { color: colors.secondaryForeground }]}>Создать заявку</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { marginHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  addButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  count: { marginHorizontal: 20, marginTop: 7, fontSize: 13, fontFamily: 'Inter_400Regular' },
  list: { marginHorizontal: 20, marginTop: 22 },
  empty: { padding: 22, borderRadius: 18, borderWidth: 1, alignItems: 'flex-start' },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 18, marginBottom: 6 },
  emptyBody: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginBottom: 18 },
  emptyButton: { paddingHorizontal: 15, minHeight: 42, borderRadius: 13, justifyContent: 'center' },
  emptyButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});