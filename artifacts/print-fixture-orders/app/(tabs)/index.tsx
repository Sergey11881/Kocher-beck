import { Feather } from '@expo/vector-icons';
import { useGetOrders, getGetOrdersQueryKey } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { useDrafts } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';

function statusLabel(status?: string) {
  if (!status) return 'Новая';
  if (/готов|заверш/i.test(status)) return 'Готово';
  if (/производ/i.test(status)) return 'Производство';
  if (/согласован|работ/i.test(status)) return 'В работе';
  return status;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { drafts } = useDrafts();
  const ordersQuery = useGetOrders({
    query: {
      queryKey: getGetOrdersQueryKey(),
      retry: false,
    },
  });
  const orders = (ordersQuery.data ?? []).slice(0, 3);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>KOCHER+BECK</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>Smart Order</Text>
            </View>
            <View style={[styles.online, { borderColor: colors.border, backgroundColor: colors.surfaceGlass }]}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.mutedForeground }]}>Онлайн</Text>
            </View>
          </View>

          <Text style={[styles.slogan, { color: colors.mutedForeground }]}>Точный заказ с первого раза.</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/new-order')}
            style={({ pressed }) => [
              styles.hero,
              { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 },
            ]}
          >
            <View style={styles.heroIcon}><Feather name="plus" size={25} color={colors.primaryForeground} /></View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Заполнить заявку</Text>
              <Text style={styles.heroSubtitle}>Пошагово соберём технические данные</Text>
            </View>
            <Feather name="arrow-up-right" size={22} color={colors.primaryForeground} />
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Быстрый доступ</Text>
          </View>
          <View style={styles.actions}>
            <QuickAction icon="file-text" title="Заявки" caption="История заказов" onPress={() => router.push('/orders')} colors={colors} />
            <QuickAction icon="edit-3" title="Черновики" caption={`${drafts.length} сохранено`} onPress={() => router.push('/drafts')} colors={colors} />
          </View>

          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Последние заявки</Text>
            <Pressable onPress={() => router.push('/orders')} hitSlop={10}>
              <Text style={[styles.link, { color: colors.primary }]}>Все</Text>
            </Pressable>
          </View>

          {ordersQuery.isLoading ? (
            <GlassCard style={styles.stateCard}><ActivityIndicator color={colors.primary} /></GlassCard>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}`)}>
                <GlassCard style={styles.orderCard}>
                  <View style={styles.orderTop}>
                    <Text style={[styles.orderNumber, { color: colors.foreground }]}>{order.order_number}</Text>
                    <Text style={[styles.orderStatus, { color: colors.primary }]}>{statusLabel(order.status)}</Text>
                  </View>
                  <Text style={[styles.orderName, { color: colors.mutedForeground }]} numberOfLines={1}>{order.product_name}</Text>
                  <View style={styles.orderMeta}>
                    <Feather name="calendar" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))
          ) : (
            <GlassCard style={styles.emptyCard}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
                <Feather name="inbox" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Заявок пока нет</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Первая заявка появится здесь после отправки.
              </Text>
            </GlassCard>
          )}

          {ordersQuery.isError ? (
            <Text style={[styles.note, { color: colors.mutedForeground }]}>
              История заказов станет доступна после подключения авторизации.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  caption,
  onPress,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  caption: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}>
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.actionCaption, { color: colors.mutedForeground }]}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 3 },
  slogan: { fontSize: 15, marginTop: 12, marginBottom: 22 },
  online: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  onlineText: { fontSize: 11, fontWeight: '700' },
  hero: { minHeight: 112, borderRadius: 25, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
  heroIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  heroSubtitle: { color: 'rgba(255,255,255,0.76)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, minHeight: 112, borderRadius: 20, borderWidth: 1, padding: 16 },
  actionTitle: { fontSize: 15, fontWeight: '700', marginTop: 14 },
  actionCaption: { fontSize: 11, marginTop: 5 },
  link: { fontSize: 13, fontWeight: '800' },
  stateCard: { minHeight: 92, alignItems: 'center', justifyContent: 'center' },
  orderCard: { padding: 16, marginBottom: 10 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  orderNumber: { flex: 1, fontSize: 15, fontWeight: '800' },
  orderStatus: { fontSize: 11, fontWeight: '800' },
  orderName: { fontSize: 13, marginTop: 7 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  metaText: { fontSize: 11 },
  emptyCard: { alignItems: 'center', paddingVertical: 25 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 12, textAlign: 'center', marginTop: 6 },
  note: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
});
