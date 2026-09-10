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
  typography,
} from '../../constants/design';

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>KOCHER+BECK</Text>
            <Text style={styles.title}>Smart Order</Text>
          </View>

          <View style={styles.status}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Онлайн</Text>
          </View>
        </View>

        <Text style={styles.greeting}>Точный заказ с первого раза.</Text>

        <Pressable
          onPress={() => router.push('/new-order')}
          style={({ pressed }) => [
            styles.newOrder,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.newOrderLeft}>
            <View style={styles.plus}>
              <Text style={styles.plusText}>+</Text>
            </View>

            <View>
              <Text style={styles.newOrderTitle}>Новая заявка</Text>
              <Text style={styles.newOrderSubtitle}>
                Создать заказ на инструмент
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Быстрый доступ</Text>

        <View style={styles.grid}>
          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/new-order')}
          >
            <Text style={styles.quickIcon}>⚙</Text>
            <Text style={styles.quickTitle}>Инструмент</Text>
            <Text style={styles.quickText}>Создать заявку</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/orders')}
          >
            <Text style={styles.quickIcon}>▤</Text>
            <Text style={styles.quickTitle}>Заявки</Text>
            <Text style={styles.quickText}>История заказов</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.quickIcon}>●</Text>
            <Text style={styles.quickTitle}>Профиль</Text>
            <Text style={styles.quickText}>Настройки</Text>
          </Pressable>

          <GlassCard style={styles.quickCard}>
            <Text style={styles.quickIcon}>?</Text>
            <Text style={styles.quickTitle}>Помощь</Text>
            <Text style={styles.quickText}>Связь с менеджером</Text>
          </GlassCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Последние заявки</Text>
          <Pressable onPress={() => router.push('/orders')}>
            <Text style={styles.link}>Все</Text>
          </Pressable>
        </View>

        <GlassCard style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>+</Text>
          </View>

          <Text style={styles.emptyTitle}>Здесь появятся ваши заявки</Text>

          <Text style={styles.emptyText}>
            Создайте первую заявку — она сохранится здесь для быстрого доступа.
          </Text>
        </GlassCard>

        <View style={styles.infoCard}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>i</Text>
          </View>

          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>Умный заказ</Text>
            <Text style={styles.infoText}>
              Приложение поможет проверить параметры инструмента перед отправкой.
            </Text>
          </View>
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
    paddingBottom: 36,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
    marginTop: 2,
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
    marginBottom: 22,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(53,199,89,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(53,199,89,0.16)',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 7,
  },

  statusText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },

  newOrder: {
    minHeight: 108,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  newOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  plus: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginRight: 14,
  },

  plusText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '300',
  },

  newOrderTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },

  newOrderSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '200',
  },

  sectionTitle: {
    color: colors.text,
    ...typography.section,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
    marginBottom: 30,
  },

  card: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  quickCard: {
    width: '48%',
    minHeight: 128,
    padding: 16,
  },

  quickIcon: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },

  quickTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  quickText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },

  emptyCard: {
    padding: 22,
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyIconText: {
    color: colors.accent,
    fontSize: 25,
    fontWeight: '300',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(90,169,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(90,169,255,0.12)',
  },

  infoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(90,169,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoBadgeText: {
    color: colors.info,
    fontWeight: '800',
  },

  infoBody: {
    flex: 1,
  },

  infoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
