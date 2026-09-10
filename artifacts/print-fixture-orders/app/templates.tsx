import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrafts } from '@/context/OrdersContext';
import { GlassSection } from '@/components/GlassSection';
import { useColors } from '@/hooks/useColors';
import { track } from '@/utils/analytics';

export default function TemplatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { drafts, templates, templatesLoading, saveTemplate, deleteTemplate } = useDrafts();
  const [name, setName] = useState('');

  const createFromDraft = async (draftId: string) => {
    const draft = drafts.find((item) => item.id === draftId);
    if (!draft) return;
    const template = await saveTemplate({
      name: name.trim() || `${draft.productType} · шаблон`,
      productType: draft.productType,
      client: draft.client,
      contact: draft.contact,
      comment: draft.comment,
      data: { ...draft.data },
      fileNames: [...draft.fileNames],
      attachments: draft.attachments?.map((attachment) => ({ ...attachment })),
    });
    setName('');
    track('template_created', { productType: template.productType });
    Alert.alert('Шаблон сохранён', 'Исходный черновик не изменён.');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={20} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Назад</Text></Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>SMART ORDER</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Шаблоны</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>Сохраняйте типовые заявки и используйте их как основу. Новый заказ создаётся отдельно и не меняет шаблон.</Text>
        <GlassSection style={styles.createCard}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Создать из черновика</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Название шаблона (необязательно)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceGlass }]} />
          {drafts.length === 0 ? <Text style={[styles.muted, { color: colors.mutedForeground }]}>Сначала сохраните черновик заявки.</Text> : drafts.map((draft) => (
            <Pressable key={draft.id} onPress={() => void createFromDraft(draft.id)} style={[styles.draftButton, { borderColor: colors.border }]}>
              <Feather name="bookmark" size={16} color={colors.primary} /><Text numberOfLines={1} style={[styles.draftText, { color: colors.foreground }]}>Сохранить «{draft.productType}» как шаблон</Text>
            </Pressable>
          ))}
        </GlassSection>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 22 }]}>Сохранённые шаблоны</Text>
        {templatesLoading ? <Text style={[styles.muted, { color: colors.mutedForeground }]}>Загружаем шаблоны...</Text> : templates.length === 0 ? (
          <GlassSection style={styles.empty}><Feather name="bookmark" size={22} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Шаблонов пока нет</Text><Text style={[styles.muted, { color: colors.mutedForeground }]}>Создайте первый шаблон из черновика, чтобы быстрее повторять типовые заявки.</Text></GlassSection>
        ) : templates.map((template) => (
          <GlassSection key={template.id} style={styles.template}>
            <View style={styles.templateCopy}><Text style={[styles.templateTitle, { color: colors.foreground }]}>{template.name}</Text><Text style={[styles.muted, { color: colors.mutedForeground }]}>{template.productType} · обновлён {new Date(template.updatedAt).toLocaleDateString('ru-RU')}</Text></View>
            <Pressable accessibilityRole="button" onPress={() => { track('template_used', { productType: template.productType }); router.push(`/new-order?template=${template.id}`); }} style={[styles.useButton, { backgroundColor: colors.primary }]}><Text style={[styles.useText, { color: colors.primaryForeground }]}>Использовать</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => Alert.alert('Удалить шаблон?', 'Новый заказ из него уже созданные данные не затронет.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => void deleteTemplate(template.id) }])} style={styles.delete}><Text style={[styles.deleteText, { color: colors.mutedForeground }]}>Удалить</Text></Pressable>
          </GlassSection>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  back: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: '700' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  createCard: { borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 13, marginBottom: 10 },
  draftButton: { minHeight: 44, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, marginTop: 8 },
  draftText: { flex: 1, fontSize: 12, fontWeight: '700' },
  muted: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  empty: { borderRadius: 18, padding: 22, marginTop: 10, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  template: { borderRadius: 18, padding: 14, marginTop: 10 },
  templateCopy: { marginBottom: 10 },
  templateTitle: { fontSize: 15, fontWeight: '800' },
  useButton: { minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  useText: { fontSize: 12, fontWeight: '800' },
  delete: { alignSelf: 'flex-start', paddingTop: 10 },
  deleteText: { fontSize: 11, fontWeight: '700' },
});
