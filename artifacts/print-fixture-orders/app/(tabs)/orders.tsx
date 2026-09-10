import { Feather } from '@expo/vector-icons';
import { getGetOrdersQueryKey, useGetOrders } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { useColors } from '@/hooks/useColors';
import { getOrderStatusLabel } from '@/utils/orderStatus';

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const query = useGetOrders({ query: { queryKey: getGetOrdersQueryKey(), retry: false } });
  const [search, setSearch] = useState('');
  const orders = [...(query.data ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((order) => `${order.order_number} ${order.product_name} ${order.status}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
      >
        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>KOCHER+BECK</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Заявки</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>История заказов и текущие статусы</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по номеру или типу"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.search, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}
          />
          {query.isLoading ? (
            <GlassCard style={styles.state}><ActivityIndicator color={colors.primary} /></GlassCard>
          ) : query.isError ? (
            <GlassCard style={styles.empty}>
              <Feather name="wifi-off" size={28} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Не удалось загрузить заявки</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Проверьте соединение и повторите попытку.</Text>
              <Pressable onPress={() => void query.refetch()} style={[styles.button, { backgroundColor: colors.primary }]}>
                <Text style={styles.buttonText}>Повторить</Text>
              </Pressable>
            </GlassCard>
          ) : orders.length ? (
            orders.map((order) => (
              <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}`)}>
                <GlassCard style={styles.card}>
                  <View style={styles.row}><Text style={[styles.number, { color: colors.foreground }]}>{order.order_number}</Text><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View>
                  <Text style={[styles.product, { color: colors.mutedForeground }]}>{order.product_name}</Text>
                  <Text style={[styles.status, { color: colors.primary }]}>{getOrderStatusLabel(order.status)}</Text>
                  <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(order.created_at).toLocaleDateString('ru-RU')}</Text>
                </GlassCard>
              </Pressable>
            ))
          ) : (
            <GlassCard style={styles.empty}>
              <Feather name="inbox" size={28} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Заявок пока нет</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Создайте первую заявку, и она появится в истории.</Text>
              <Pressable onPress={() => router.push('/new-order')} style={[styles.button, { backgroundColor: colors.primary }]}>
                <Text style={styles.buttonText}>Новая заявка</Text>
              </Pressable>
            </GlassCard>
          )}
          {!query.isError && query.data?.length && !orders.length ? <Text style={[styles.note, { color: colors.mutedForeground }]}>По вашему запросу ничего не найдено.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '800', marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 8, marginBottom: 24 },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 13, marginBottom: 16 },
  state: { minHeight: 110, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontSize: 16, fontWeight: '800' },
  product: { fontSize: 13, marginTop: 8 },
  status: { fontSize: 12, fontWeight: '800', marginTop: 13 },
  date: { fontSize: 11, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 13 },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  button: { minHeight: 50, borderRadius: 15, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  note: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
});
