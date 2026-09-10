import { Feather } from '@expo/vector-icons';
import { getGetOrdersQueryKey, useGetOrders } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { useColors } from '@/hooks/useColors';

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const query = useGetOrders({ query: { queryKey: getGetOrdersQueryKey(), retry: false } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>KOCHER+BECK</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Заявки</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>История заказов и текущие статусы</Text>
          {query.isLoading ? (
            <GlassCard style={styles.state}><ActivityIndicator color={colors.primary} /></GlassCard>
          ) : query.data?.length ? (
            query.data.map((order) => (
              <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}`)}>
                <GlassCard style={styles.card}>
                  <View style={styles.row}><Text style={[styles.number, { color: colors.foreground }]}>{order.order_number}</Text><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View>
                  <Text style={[styles.product, { color: colors.mutedForeground }]}>{order.product_name}</Text>
                  <Text style={[styles.status, { color: colors.primary }]}>{order.status}</Text>
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
          {query.isError ? <Text style={[styles.note, { color: colors.mutedForeground }]}>История будет доступна после подключения авторизации.</Text> : null}
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
  state: { minHeight: 110, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontSize: 16, fontWeight: '800' },
  product: { fontSize: 13, marginTop: 8 },
  status: { fontSize: 12, fontWeight: '800', marginTop: 13 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 13 },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  button: { minHeight: 50, borderRadius: 15, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  note: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
});
