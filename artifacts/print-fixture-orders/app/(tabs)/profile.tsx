import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/design';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useDrafts } from '../../context/OrdersContext';
import { ManagerContact } from '@/components/ManagerContact';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { drafts } = useDrafts();
  const { settings, isLoading, error, setNotificationsEnabled } = useAppSettings();

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
      >
        <View style={styles.content}>
          <Text style={styles.eyebrow}>KOCHER+BECK</Text>
          <Text style={styles.title}>Профиль</Text>

          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>K+B</Text></View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>Клиент Kocher+Beck</Text>
              <Text style={styles.cardText}>Авторизация пока отключена. Локальные черновики сохранены на устройстве.</Text>
            </View>
          </View>

          <Text style={styles.section}>Менеджер</Text>
          <ManagerContact />

          <Text style={styles.section}>Настройки</Text>
          <View style={styles.setting}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Уведомления</Text>
              <Text style={styles.settingText}>Push-уведомления backend пока не подключены. Настройка сохранена локально.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
            {isLoading ? <ActivityIndicator color={colors.accent} /> : (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => void setNotificationsEnabled(value).catch(() => undefined)}
                trackColor={{ false: colors.surfaceElevated, true: colors.accentSoft }}
                thumbColor={settings.notificationsEnabled ? colors.accent : colors.textMuted}
              />
            )}
          </View>
          <Pressable onPress={() => router.push('/drafts')} style={styles.setting}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Черновики</Text>
              <Text style={styles.settingText}>{drafts.length ? `${drafts.length} сохранено на устройстве` : 'Сохранённых черновиков нет'}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => router.push('/templates')} style={styles.setting}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Шаблоны</Text><Text style={styles.settingText}>Типовые заявки для быстрого старта</Text></View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => router.push('/equipment')} style={styles.setting}>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>Типы оснастки</Text><Text style={styles.settingText}>Фото и краткие пояснения</Text></View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={styles.setting}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Язык интерфейса</Text>
              <Text style={styles.settingText}>Русский · изменение языка будет добавлено позже</Text>
            </View>
          </View>

          <Text style={styles.section}>О приложении</Text>
          <View style={styles.setting}>
            <Text style={styles.settingTitle}>Kocher+Beck Smart Order</Text>
            <Text style={styles.settingText}>Точный заказ с первого раза. Версия 1.0.0</Text>
          </View>
          <View style={styles.setting}>
            <Text style={styles.settingTitle}>Помощь</Text>
            <Text style={styles.settingText}>Если вопрос требует менеджера, используйте раздел связи выше.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 4, marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: radius.lg, backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  cardText: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  section: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  settingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  settingCopy: { flex: 1 },
  settingTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  settingText: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  smallButton: { minHeight: 38, paddingHorizontal: 10, borderRadius: 11, justifyContent: 'center', backgroundColor: colors.accentSoft },
  smallButtonText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  error: { color: colors.accent, fontSize: 11, marginTop: 6 },
});
