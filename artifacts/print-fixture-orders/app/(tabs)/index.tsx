import { Feather } from '@expo/vector-icons';
import { getApiErrorMessage, getGetOrdersQueryKey, OrderSummary, useGetOrders } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/GlassSurface';
import { BackgroundAtmosphere } from '@/components/BackgroundAtmosphere';
import { OrderCard } from '@/components/OrderCard';
import { useAuth } from '@/context/AuthContext';
import { useDrafts } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';
import { GlassButton } from '@/components/GlassButton';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { drafts } = useDrafts();
  const ordersQuery = useGetOrders({ query: { queryKey: getGetOrdersQueryKey(), staleTime: 30_000 } });
  const orders = ordersQuery.data ?? [];
  const recentOrders = orders.slice(0, 2);
  const productionCount = orders.filter((order) => /производ/i.test(order.status ?? '')).length;
  const readyCount = orders.filter((order) => /готов|заверш/i.test(order.status ?? '')).length;
  const activeCount = orders.filter((order) => !/готов|заверш/i.test(order.status ?? '')).length;
  const latestOrder = orders[0];

  return (
    <BackgroundAtmosphere>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 112 }}
        refreshControl={<RefreshControl refreshing={ordersQuery.isFetching} onRefresh={() => void ordersQuery.refetch()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Image source={require('@/assets/images/company-logo-icon.png')} style={styles.brandMark} resizeMode="contain" />
            <Text style={[styles.eyebrow, { color: colors.foreground }]}>KOCHER+BECK</Text>
          </View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>Добрый день</Text>
          <Text style={[styles.headerHint, { color: colors.mutedForeground }]}>Центр управления заказами</Text>
        </View>
        <Pressable
          accessibilityLabel="Выйти из аккаунта"
          onPress={() => void logout()}
          style={({ pressed }) => [styles.profileButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
        >
          <Feather name="log-out" size={17} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <GlassSurface strong depth="deep" intensity={44} style={styles.hero}>
        <View style={[styles.heroGlow, { backgroundColor: colors.primary }]} />
        <View style={styles.heroContent}>
          <View style={styles.heroTopline}>
            <Text style={[styles.heroKicker, { color: colors.accentForeground }]}>SMART ORDER / 01</Text>
            <Feather name="command" size={18} color={colors.accentForeground} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Точный заказ с первого раза.</Text>
          <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
            Передайте параметры оснастки команде Kocher+Beck в одной понятной заявке.
          </Text>
          <GlassButton label="Новый заказ" icon="arrow-up-right" variant="primary" onPress={() => router.push('/new-order')} style={styles.primaryButton} />
        </View>
        <View style={[styles.heroOrb, { borderColor: colors.glassHighlight }]} />
        <View style={[styles.heroOrbSmall, { backgroundColor: colors.primary }]} />
      </GlassSurface>

      <View style={styles.metrics}>
        <Metric label="Активные" value={activeCount} icon="activity" />
        <Metric label="В производстве" value={productionCount} icon="tool" />
        <Metric label="Готовые" value={readyCount} icon="check-circle" />
      </View>

      {drafts.length > 0 ? (
        <Pressable onPress={() => router.push('/new-order')} style={({ pressed }) => [{ opacity: pressed ? 0.76 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
          <GlassSurface style={styles.draftBanner}>
          <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
            <Feather name="edit-3" size={17} color={colors.accentForeground} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Продолжить заказ</Text>
            <Text style={[styles.quickHint, { color: colors.mutedForeground }]}>{drafts[0].productType || 'Незавершённый черновик'}</Text>
          </View>
          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </GlassSurface>
        </Pressable>
      ) : null}

      <View style={styles.quickGrid}>
        <QuickAction icon="clock" title="История" hint="Все заявки" onPress={() => router.push('/orders')} />
        <QuickAction icon="refresh-cw" title="Повторить" hint="Из последних" onPress={() => recentOrders[0] ? router.push(`/new-order?repeat=${recentOrders[0].id}`) : router.push('/orders')} />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionKicker, { color: colors.mutedForeground }]}>АКТИВНОСТЬ</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Заказы</Text>
        </View>
      </View>

      {ordersQuery.isLoading ? (
        <GlassSurface style={styles.loadingCard}>
          <View style={[styles.loadingLine, { backgroundColor: colors.glassHighlight }]} />
          <View style={[styles.loadingLineShort, { backgroundColor: colors.glassHighlight }]} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Загружаем ваши заказы…</Text>
        </GlassSurface>
      ) : ordersQuery.isError ? (
        <GlassSurface style={styles.empty}>
          <Feather name="wifi-off" size={22} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Не удалось загрузить заявки</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{getApiErrorMessage(ordersQuery.error, 'Проверьте соединение с сервером типографии.')}</Text>
          <Pressable onPress={() => void ordersQuery.refetch()} style={[styles.retry, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.retryText, { color: colors.secondaryForeground }]}>Повторить</Text>
          </Pressable>
        </GlassSurface>
      ) : recentOrders.length > 0 ? (
        <>
          {latestOrder ? <LatestOrder order={latestOrder} onPress={() => router.push(`/order/${latestOrder.id}`)} onRepeat={() => router.push(`/new-order?repeat=${latestOrder.id}`)} /> : null}
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: colors.foreground }]}>Последние заказы</Text>
            <Pressable testID="see-all-orders" onPress={() => router.push('/orders')}>
              <Text style={[styles.link, { color: colors.primary }]}>Все заказы</Text>
            </Pressable>
          </View>
          {recentOrders.slice(1).map((order) => <OrderCard key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />)}
        </>
      ) : (
        <GlassSurface style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
            <Feather name="layers" size={21} color={colors.accentForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Пространство для первой заявки</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Создайте заказ, чтобы передать типографии все параметры в одном месте.</Text>
          <GlassButton label="Создать первый заказ" icon="arrow-right" variant="primary" onPress={() => router.push('/new-order')} style={styles.emptyAction} />
        </GlassSurface>
      )}
      </ScrollView>
    </BackgroundAtmosphere>
  );
}

function LatestOrder({ order, onPress, onRepeat }: { order: OrderSummary; onPress: () => void; onRepeat: () => void }) {
  const colors = useColors();
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(order.created_at));
  return (
    <GlassSurface depth="deep" style={styles.latestCard}>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}>
        <View style={styles.latestTop}>
          <Text style={[styles.sectionKicker, { color: colors.primary }]}>ПОСЛЕДНИЙ ЗАКАЗ</Text>
          <Feather name="arrow-up-right" size={17} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.latestNumber, { color: colors.foreground }]}>{order.order_number}</Text>
        <Text style={[styles.latestProduct, { color: colors.secondaryForeground }]} numberOfLines={1}>{order.product_name}</Text>
        <Text style={[styles.latestMeta, { color: colors.mutedForeground }]}>{date}{order.client ? ` · ${order.client}` : ''}</Text>
        <View style={styles.latestBottom}>
          <Text style={[styles.latestStatus, { color: colors.accentForeground }]}>{order.status || 'Новый'}</Text>
          <Pressable onPress={onRepeat} style={({ pressed }) => [styles.repeatLink, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
            <Feather name="refresh-cw" size={13} color={colors.primary} />
            <Text style={[styles.repeatText, { color: colors.primary }]}>Повторить</Text>
          </Pressable>
        </View>
      </Pressable>
    </GlassSurface>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ComponentProps<typeof Feather>['name'] }) {
  const colors = useColors();
  return (
    <GlassSurface style={styles.metric}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{Math.max(0, value)}</Text>
      <Text numberOfLines={1} style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </GlassSurface>
  );
}

function QuickAction({ icon, title, hint, onPress }: { icon: ComponentProps<typeof Feather>['name']; title: string; hint: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon} size={17} color={colors.accentForeground} />
      </View>
      <View style={styles.quickCopy}>
        <Text style={[styles.quickTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.quickHint, { color: colors.mutedForeground }]}>{hint}</Text>
      </View>
      <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 },
  brandMark: { width: 26, height: 26, borderRadius: 8 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold' },
  greeting: { fontSize: 29, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  headerHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 5 },
  profileButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { marginHorizontal: 20, minHeight: 302 },
  heroContent: { padding: 23, zIndex: 2 },
  heroTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  heroKicker: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold' },
  heroTitle: { fontSize: 28, lineHeight: 33, maxWidth: 280, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  heroBody: { fontSize: 13, lineHeight: 20, maxWidth: 280, fontFamily: 'Inter_400Regular', marginBottom: 25 },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -80, top: -65, opacity: 0.14 },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderWidth: 1, borderRadius: 95, right: -72, bottom: -98, opacity: 0.55 },
  heroOrbSmall: { position: 'absolute', width: 72, height: 72, borderRadius: 36, right: 25, bottom: 25, opacity: 0.85 },
  primaryButton: { minHeight: 50, paddingHorizontal: 17, borderRadius: 16, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 15 },
  primaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  quickGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 12 },
  metrics: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 12 },
  metric: { flex: 1, minHeight: 82, padding: 12, borderRadius: 18 },
  metricValue: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 8 },
  metricLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', marginTop: 2 },
  draftBanner: { marginHorizontal: 20, marginTop: 12, padding: 13, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickAction: { flex: 1, minHeight: 74, padding: 12, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  quickIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1 },
  quickTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  quickHint: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 33, marginBottom: 14 },
  sectionKicker: { fontSize: 9, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  link: { fontSize: 12, fontFamily: 'Inter_700Bold', paddingBottom: 2 },
  empty: { marginHorizontal: 20, padding: 20, minHeight: 165, justifyContent: 'center' },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  emptyBody: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', maxWidth: 300 },
  retry: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 15, alignSelf: 'flex-start' },
  retryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  loadingCard: { marginHorizontal: 20, minHeight: 165, padding: 20, justifyContent: 'center' },
  loadingLine: { height: 14, width: '68%', borderRadius: 7, marginBottom: 12 },
  loadingLineShort: { height: 10, width: '42%', borderRadius: 5, marginBottom: 18 },
  loadingText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  latestCard: { marginHorizontal: 20, padding: 18, borderRadius: 22 },
  latestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  latestNumber: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 14 },
  latestProduct: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 5 },
  latestMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 7 },
  latestBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  latestStatus: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  repeatLink: { minHeight: 34, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  repeatText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  recentHeader: { marginHorizontal: 20, marginTop: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyAction: { marginTop: 18, alignSelf: 'flex-start' },
});
