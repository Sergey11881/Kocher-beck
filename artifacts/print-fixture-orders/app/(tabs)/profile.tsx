import { Feather } from '@expo/vector-icons';
import { useGetOrders } from '@workspace/api-client-react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrafts } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ordersQuery = useGetOrders();
  const { drafts } = useDrafts();
  const orders = ordersQuery.data ?? [];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>НАСТРОЙКИ</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Профиль</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Данные для связи можно будет добавить перед отправкой заявки.</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.foreground }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Feather name="user" size={24} color={colors.primaryForeground} />
        </View>
        <View>
          <Text style={[styles.profileTitle, { color: colors.background }]}>Заказчик</Text>
          <Text style={[styles.profileBody, { color: colors.secondary }]}>Личные данные не заполнены</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ваша активность</Text>
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>{orders.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>отправлено</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>{drafts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>черновиков</Text>
        </View>
      </View>

      <View style={[styles.note, { backgroundColor: colors.secondary }]}>
        <Feather name="shield" size={18} color={colors.secondaryForeground} />
        <Text style={[styles.noteText, { color: colors.secondaryForeground }]}>Черновики хранятся только на этом устройстве. Отправленные заявки доступны типографии на сервере.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginTop: 7, maxWidth: 310 },
  profileCard: { marginTop: 28, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  profileBody: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 31, marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 17, borderWidth: 1, padding: 16 },
  statNumber: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  note: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, padding: 15, marginTop: 24, gap: 11 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_500Medium' },
});