import { Feather } from '@expo/vector-icons';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { managerContacts } from '@/config/manager';
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

  return <View>{managerContacts.map((manager) => (
    <GlassSection key={manager.phone} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}><Feather name="user" size={18} color={colors.primary} /></View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>{manager.name}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{manager.role}</Text>
          <Text style={[styles.phone, { color: colors.foreground }]}>{manager.phone}</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Позвонить: ${manager.name}`} onPress={() => void open(`tel:${manager.phone.replace(/[^\d+]/g, '')}`, 'телефон')} style={[styles.action, { borderColor: colors.border }]}>
        <Feather name="phone" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Позвонить</Text>
      </Pressable>
    </GlassSection>
  ))}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  description: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  phone: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  action: { minHeight: 42, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginTop: 10 },
  actionText: { fontSize: 12, fontWeight: '800' },
});
