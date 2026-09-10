import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { DraftAttachment } from '@/context/OrdersContext';
import { track } from '@/utils/analytics';

type Props = {
  attachments: DraftAttachment[];
  onChange: (attachments: DraftAttachment[]) => void;
};

function makeAttachment(name: string, uri: string, mimeType?: string, size?: number): DraftAttachment {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, uri, mimeType, size };
}

export function AttachmentSection({ attachments, onChange }: Props) {
  const colors = useColors();

  const addDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: true });
      if (result.canceled) return;
      const nextAttachments = [
        ...attachments,
        ...(Array.isArray(result.assets) ? result.assets : []).map((asset) => makeAttachment(asset.name, asset.uri, asset.mimeType, asset.size)),
      ];
      onChange(nextAttachments);
      track('attachment_added', { count: nextAttachments.length });
    } catch (error: unknown) {
      console.error('Failed to pick attachment:', error);
      Alert.alert('Не удалось прикрепить файл', 'Проверьте доступ к файлам и попробуйте ещё раз.');
    }
  };

  const addPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Доступ к фото запрещён', 'Разрешите доступ к медиатеке в настройках iPhone, чтобы выбрать фотографию.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true });
      if (result.canceled) return;
      const nextAttachments = [
        ...attachments,
        ...(Array.isArray(result.assets) ? result.assets : []).map((asset) => makeAttachment(asset.fileName ?? 'Фото оснастки', asset.uri, asset.mimeType, asset.fileSize)),
      ];
      onChange(nextAttachments);
      track('attachment_added', { count: nextAttachments.length });
    } catch (error: unknown) {
      console.error('Failed to pick photo:', error);
      Alert.alert('Не удалось выбрать фото', 'Попробуйте ещё раз.');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Вложения</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Можно приложить фото старой оснастки, чертёж или технический документ.
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={() => void addPhoto()} style={[styles.action, { borderColor: colors.border }]}>
          <Feather name="image" size={17} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Фото</Text>
        </Pressable>
        <Pressable onPress={() => void addDocument()} style={[styles.action, { borderColor: colors.border }]}>
          <Feather name="paperclip" size={17} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Файл</Text>
        </Pressable>
      </View>
      {attachments.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>Вложений пока нет</Text>
      ) : attachments.map((attachment) => (
        <View key={attachment.id} style={styles.fileRow}>
          <Feather name="file" size={17} color={colors.primary} />
          <Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>{attachment.name}</Text>
          <Pressable onPress={() => { onChange(attachments.filter((item) => item.id !== attachment.id)); track('attachment_removed'); }} hitSlop={8}>
            <Feather name="x-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
  title: { fontSize: 15, fontWeight: '800' },
  description: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  action: { minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionText: { fontSize: 12, fontWeight: '800' },
  empty: { fontSize: 11, marginTop: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  fileName: { flex: 1, fontSize: 12 },
});
