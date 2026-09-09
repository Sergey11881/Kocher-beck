import { Feather } from '@expo/vector-icons';
import { useGetOrders } from '@workspace/api-client-react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrafts } from '@/context/OrdersContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { BackgroundAtmosphere } from '@/components/BackgroundAtmosphere';
import { BrandHeader } from '@/components/BrandHeader';
import { GlassSection } from '@/components/GlassSection';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ordersQuery = useGetOrders();
  const { drafts } = useDrafts();
  const { logout } = useAuth();
  const orders = ordersQuery.data ?? [];
  const managers = [
    { name: 'Павлов Сергей', role: 'Менеджер-технолог', phone: '+7 968 447 12 94' },
    { name: 'Денисюк Екатерина', role: 'Старший менеджер продаж', phone: '+7 965 368 15 91' },
    { name: 'Савинецкий Алексей', role: 'Руководитель отдела', phone: '+7 964 628 56 41' },
  ];

  return (
    <BackgroundAtmosphere>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader title="Настройки" />
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>НАСТРОЙКИ</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Профиль</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Данные для связи можно будет добавить перед отправкой заявки.</Text>

        <GlassSection depth="deep" style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={24} color={colors.primaryForeground} />
          </View>
          <View>
            <Text style={[styles.profileTitle, { color: colors.foreground }]}>Заказчик</Text>
            <Text style={[styles.profileBody, { color: colors.mutedForeground }]}>Личные данные не заполнены</Text>
          </View>
        </GlassSection>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ваша активность</Text>
        <View style={styles.stats}>
          <GlassSection style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{orders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>отправлено</Text>
          </GlassSection>
          <GlassSection style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{drafts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>черновиков</Text>
          </GlassSection>
        </View>

        <GlassSection style={styles.note}>
          <Feather name="shield" size={18} color={colors.secondaryForeground} />
          <Text style={[styles.noteText, { color: colors.secondaryForeground }]}>Черновики хранятся только на этом устройстве. Отправленные заявки доступны типографии на сервере.</Text>
        </GlassSection>
        <Pressable onPress={() => void logout()} style={[styles.logoutButton, { borderColor: colors.border }]}>
          <Text style={[styles.logoutText, { color: colors.primary }]}>Выйти из аккаунта оператора</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Связь с менеджером</Text>
        <Text style={[styles.contactHint, { color: colors.mutedForeground }]}>Нажмите на специалиста, чтобы позвонить и уточнить параметры заказа.</Text>
        <View style={styles.managers}>
          {managers.map((manager) => (
            <GlassSection key={manager.phone} style={styles.managerCard}>
              <Pressable
                testID={`manager-${manager.phone.replace(/\s/g, '-')}`}
                onPress={() => void Linking.openURL(`tel:${manager.phone.replace(/\s/g, '')}`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
              >
                <View style={[styles.managerIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="phone" size={16} color={colors.primary} />
                </View>
                <View style={styles.managerCopy}>
                  <Text style={[styles.managerName, { color: colors.cardForeground }]}>{manager.name}</Text>
                  <Text style={[styles.managerRole, { color: colors.mutedForeground }]}>{manager.role}</Text>
                  <Text style={[styles.managerPhone, { color: colors.primary }]}>{manager.phone}</Text>
                </View>
                <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              </Pressable>
            </GlassSection>
          ))}
        </View>
      </View>
    </ScrollView>
    </BackgroundAtmosphere>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 8 },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginTop: 7, maxWidth: 310 },
  profileCard: { marginHorizontal: 20, marginTop: 28, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  profileBody: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 31, marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 17, padding: 16 },
  statNumber: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  note: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, padding: 15, marginTop: 24, gap: 11 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_500Medium' },
  logoutButton: { minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  logoutText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  contactHint: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', marginTop: -7, marginBottom: 14 },
  managers: { gap: 10 },
  managerCard: { borderRadius: 17, padding: 0 },
  managerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  managerCopy: { flex: 1 },
  managerName: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  managerRole: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 5 },
  managerPhone: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});