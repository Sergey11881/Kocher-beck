import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/OrderCard';
import { useOrders } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading } = useOrders();
  const recentOrders = orders.slice(0, 2);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>ТИПОГРАФСКАЯ ОСНАСТКА</Text>
          <Text style={[styles.greeting, { color: colors.foreground }]}>Новая заявка</Text>
        </View>
        <View style={[styles.logo, { backgroundColor: colors.foreground }]}>
          <Feather name="layers" size={19} color={colors.background} />
        </View>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.foreground }]}>
        <View style={[styles.heroCircle, { borderColor: colors.primary }]} />
        <View style={[styles.heroCircleSmall, { backgroundColor: colors.primary }]} />
        <View style={styles.heroContent}>
          <Text style={[styles.heroKicker, { color: colors.primary }]}>Шаг за шагом</Text>
          <Text style={styles.heroTitle}>Соберите заказ без лишних звонков</Text>
          <Text style={[styles.heroBody, { color: colors.secondary }]}>
            Укажите параметры оснастки — мы подготовим точное предложение.
          </Text>
          <Pressable
            testID="new-order-button"
            onPress={() => router.push('/new-order')}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Заполнить заявку</Text>
            <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Последние заявки</Text>
        {orders.length > 0 ? (
          <Pressable testID="see-all-orders" onPress={() => router.push('/orders')}>
            <Text style={[styles.link, { color: colors.primary }]}>Все заявки</Text>
          </Pressable>
        ) : null}
      </View>

      {recentOrders.length > 0 ? (
        recentOrders.map((order) => (
          <OrderCard key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />
        ))
      ) : (
        <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="clipboard" size={21} color={colors.secondaryForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.cardForeground }]}>Здесь появятся ваши заявки</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            Создайте первую заявку, чтобы передать типографии все параметры в одном месте.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  greeting: { fontSize: 26, lineHeight: 32, fontFamily: 'Inter_700Bold' },
  logo: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hero: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', minHeight: 284 },
  heroContent: { padding: 24, zIndex: 1, maxWidth: 310 },
  heroKicker: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1.1, marginBottom: 14 },
  heroTitle: { color: '#fffdf9', fontSize: 25, lineHeight: 31, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  heroBody: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular', marginBottom: 22, maxWidth: 255 },
  heroCircle: { position: 'absolute', width: 260, height: 260, borderWidth: 1, borderRadius: 130, right: -100, top: -100, opacity: 0.35 },
  heroCircleSmall: { position: 'absolute', width: 94, height: 94, borderRadius: 47, right: 22, bottom: -28, opacity: 0.95 },
  primaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 12 },
  primaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 30, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  link: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  empty: { marginHorizontal: 20, padding: 18, borderRadius: 18, borderWidth: 1 },
  emptyIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  emptyBody: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
});