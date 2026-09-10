import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useDrafts } from '@/context/OrdersContext';
import { Alert } from 'react-native';
import {
  colors,
  radius,
  spacing,
} from '../constants/design';

export default function DraftsScreen() {
  const { drafts, isLoading, deleteDraft } = useDrafts();

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SMART ORDER</Text>
            <Text style={styles.title}>Черновики</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Загружаем черновики...</Text>
          </View>
        ) : drafts.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>✎</Text>
            </View>
            <Text style={styles.emptyTitle}>Черновиков пока нет</Text>
            <Text style={styles.emptyText}>
              Незавершённые заявки будут автоматически сохраняться здесь.
            </Text>
            <Pressable
              onPress={() => router.replace('/new-order')}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>Создать заявку</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {drafts.map((draft) => (
              <View key={draft.id} style={styles.draftCard}>
              <Pressable onPress={() => router.push(`/new-order?draft=${draft.id}`)} style={styles.draftOpen}>
                <View style={styles.draftCopy}>
                  <Text style={styles.draftTitle}>{draft.productType}</Text>
                  <Text style={styles.draftText}>
                    Изменён {new Date(draft.updatedAt).toLocaleDateString('ru-RU')} · параметров: {Object.keys(draft.data).length}
                  </Text>
                </View>
                <Text style={styles.openText}>Открыть</Text>
              </Pressable>
              <Pressable onPress={() => Alert.alert('Удалить черновик?', 'Это действие нельзя отменить.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => void deleteDraft(draft.id) }])} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Удалить</Text>
              </Pressable>
            </View>
            ))}
            <Pressable
              onPress={() => router.replace('/new-order')}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>Создать заявку</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: 40,
    flexGrow: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '200',
  },

  headerText: {
    marginLeft: 12,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  icon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  iconText: {
    color: colors.accent,
    fontSize: 28,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  button: {
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.72,
  },
  list: {
    flex: 1,
    paddingTop: 24,
  },
  draftCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  draftTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  draftText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
  },
  draftOpen: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  draftCopy: { flex: 1 },
  openText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  deleteButton: { alignSelf: 'flex-start', paddingTop: 10 },
  deleteText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
});
