import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  colors,
  radius,
  spacing,
} from '../constants/design';

export default function DraftsScreen() {
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
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>Создать заявку</Text>
          </Pressable>
        </View>
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
});
