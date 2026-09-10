import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colors,
  radius,
  spacing,
} from '../../constants/design';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>KOCHER+BECK</Text>
        <Text style={styles.title}>Профиль</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>K+B</Text>
          </View>

          <View>
            <Text style={styles.cardTitle}>Клиент Kocher+Beck</Text>
            <Text style={styles.cardText}>
              Профиль будет подключён на следующем этапе.
            </Text>
          </View>
        </View>

        <Text style={styles.section}>Настройки</Text>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>Уведомления</Text>
          <Text style={styles.settingText}>Будут доступны позже</Text>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>Менеджер</Text>
          <Text style={styles.settingText}>Связь с менеджером Kocher+Beck</Text>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingTitle}>Безопасность</Text>
          <Text style={styles.settingText}>
            Авторизация временно отключена на этапе разработки.
          </Text>
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
    marginBottom: 24,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },

  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  cardText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },

  section: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 12,
  },

  setting: {
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },

  settingTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  settingText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
