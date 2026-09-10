import { Feather } from '@expo/vector-icons';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { managerContact, hasManagerContact } from '@/config/manager';
import { useColors } from '@/hooks/useColors';
import { GlassSection } from '@/components/GlassSection';
import { track } from '@/utils/analytics';

export function ManagerContact() {
  const colors = useColors();

  const open = async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Способ связи недоступен', `Откройте ${label} вручную или свяжитесь с менеджером другим способом.`);
        return;
      }
      track('manager_contact_clicked', { method: label });
      await Linking.openURL(url);
    } catch (error: unknown) {
      console.error('Failed to open manager contact:', error);
      Alert.alert('Не удалось открыть способ связи', 'Попробуйте другой способ связи.');
    }
  };

  return (
    <GlassSection style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Feather name="message-circle" size={18} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>{hasManagerContact ? managerContact.name || 'Менеджер Kocher+Beck' : 'Связь с менеджером'}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {hasManagerContact ? 'Поможем уточнить технические детали заказа.' : 'Контакты будут доступны после настройки конфигурации.'}
          </Text>
        </View>
      </View>
      {managerContact.phone ? (
        <Pressable accessibilityRole="button" onPress={() => void open(`tel:${managerContact.phone}`, 'телефон')} style={[styles.action, { borderColor: colors.border }]}>
          <Feather name="phone" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Позвонить</Text>
        </Pressable>
      ) : null}
      {managerContact.email ? (
        <Pressable accessibilityRole="button" onPress={() => void open(`mailto:${managerContact.email}`, 'e-mail')} style={[styles.action, { borderColor: colors.border }]}>
          <Feather name="mail" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Написать на e-mail</Text>
        </Pressable>
      ) : null}
      {managerContact.maxUrl ? (
        <Pressable accessibilityRole="button" onPress={() => void open(managerContact.maxUrl, 'мессенджер')} style={[styles.action, { borderColor: colors.border }]}>
          <Feather name="send" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Открыть мессенджер</Text>
        </Pressable>
      ) : null}
      {!hasManagerContact ? <Text style={[styles.fallback, { color: colors.mutedForeground }]}>Попросите администратора добавить телефон, e-mail или ссылку на мессенджер.</Text> : null}
    </GlassSection>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  description: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  action: { minHeight: 42, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginTop: 10 },
  actionText: { fontSize: 12, fontWeight: '800' },
  fallback: { fontSize: 12, lineHeight: 18, marginTop: 12 },
});
