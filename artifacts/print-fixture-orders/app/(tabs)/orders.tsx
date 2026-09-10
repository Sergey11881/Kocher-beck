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
} from '../../constants/design';

export default function OrdersScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>KOCHER+BECK</Text>
        <Text style={styles.title}>Заявки</Text>

        <View style={styles.empty}>
          <Text style={styles.icon}>▤</Text>
          <Text style={styles.emptyTitle}>Заявок пока нет</Text>
          <Text style={styles.emptyText}>
            Все созданные и отправленные заказы будут отображаться здесь.
          </Text>

          <Pressable
            onPress={() => router.push('/new-order')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Новая заявка</Text>
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
    paddingTop: 58,
    paddingBottom: 40,
    flexGrow: 1,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginTop: 4,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  icon: {
    color: colors.accent,
    fontSize: 38,
    marginBottom: 16,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
