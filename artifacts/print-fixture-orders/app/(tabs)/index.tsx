import { Feather } from '@expo/vector-icons';
import { getApiErrorMessage, getGetOrdersQueryKey, useGetOrders } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/GlassSurface';
import { BackgroundAtmosphere } from '@/components/BackgroundAtmosphere';
import { OrderCard } from '@/components/OrderCard';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const ordersQuery = useGetOrders({ query: { queryKey: getGetOrdersQueryKey(), staleTime: 30_000 } });
  const orders = ordersQuery.data ?? [];
  const recentOrders = orders.slice(0, 2);

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
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Text style={styles.brandMarkText}>K</Text>
            </View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>KOCHER+BECK</Text>
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

      <GlassSurface strong style={styles.hero}>
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
          <Pressable
            testID="new-order-button"
            onPress={() => router.push('/new-order')}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Новый заказ</Text>
            <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
        <View style={[styles.heroOrb, { borderColor: colors.glassHighlight }]} />
        <View style={[styles.heroOrbSmall, { backgroundColor: colors.primary }]} />
      </GlassSurface>

      <View style={styles.quickGrid}>
        <QuickAction icon="clock" title="История" hint="Все заявки" onPress={() => router.push('/orders')} />
        <QuickAction icon="refresh-cw" title="Повторить" hint="Из последних" onPress={() => recentOrders[0] ? router.push(`/new-order?repeat=${recentOrders[0].id}`) : router.push('/orders')} />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionKicker, { color: colors.mutedForeground }]}>АКТИВНОСТЬ</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Последние заявки</Text>
        </View>
        {orders.length > 0 ? (
          <Pressable testID="see-all-orders" onPress={() => router.push('/orders')}>
            <Text style={[styles.link, { color: colors.primary }]}>Все</Text>
          </Pressable>
        ) : null}
      </View>

      {ordersQuery.isError ? (
        <GlassSurface style={styles.empty}>
          <Feather name="wifi-off" size={22} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Не удалось загрузить заявки</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{getApiErrorMessage(ordersQuery.error, 'Проверьте соединение с сервером типографии.')}</Text>
          <Pressable onPress={() => void ordersQuery.refetch()} style={[styles.retry, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.retryText, { color: colors.secondaryForeground }]}>Повторить</Text>
          </Pressable>
        </GlassSurface>
      ) : recentOrders.length > 0 ? (
        recentOrders.map((order) => <OrderCard key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />)
      ) : (
        <GlassSurface style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
            <Feather name="layers" size={21} color={colors.accentForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Пространство для первой заявки</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Создайте заказ, чтобы передать типографии все параметры в одном месте.</Text>
        </GlassSurface>
      )}
      </ScrollView>
    </BackgroundAtmosphere>
  );
}

function QuickAction({ icon, title, hint, onPress }: { icon: ComponentProps<typeof Feather>['name']; title: string; hint: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.68 : 1 }]}>
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
  brandMark: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
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
});
