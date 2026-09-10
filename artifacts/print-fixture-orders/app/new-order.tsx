import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useDrafts } from '@/context/OrdersContext';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../constants/design';

const TOOLING = [
  {
    id: 'cylinder',
    title: 'Магнитный цилиндр',
    description: 'Для высечки этикетки',
  },
  {
    id: 'form',
    title: 'Формный цилиндр',
    description: 'Для флексографской печати',
  },
  {
    id: 'kms',
    title: 'KMS',
    description: 'Магнитная система',
  },
  {
    id: 'gapmaster',
    title: 'GapMaster',
    description: 'Система для высечки',
  },
  {
    id: 'flat',
    title: 'Плоское основание',
    description: 'Flat magnetic base',
  },
];

export default function NewOrderScreen() {
  const [selected, setSelected] = useState('cylinder');
  const [machine, setMachine] = useState('');
  const [quantity, setQuantity] = useState('1');
  const { saveDraft } = useDrafts();

  const selectedTool = useMemo(
    () => TOOLING.find((item) => item.id === selected),
    [selected]
  );

  async function saveCurrentDraft() {
    const selectedTool = TOOLING.find((item) => item.id === selected);
    if (!selectedTool) return;

    try {
      await saveDraft({
        productType: selectedTool.title,
        client: '',
        contact: '',
        comment: '',
        data: { machine, quantity },
        fileNames: [],
      });
      router.replace('/drafts');
    } catch {
      Alert.alert('Не удалось сохранить', 'Проверьте свободное место и попробуйте ещё раз.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.topTitle}>
          <Text style={styles.caption}>SMART ORDER</Text>
          <Text style={styles.title}>Новая заявка</Text>
        </View>

        <Pressable onPress={() => void saveCurrentDraft()} style={styles.saveButton}>
          <Text style={styles.save}>Сохранить</Text>
        </Pressable>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressTrack}>
          <View style={styles.progressActive} />
        </View>
        <Text style={styles.progressText}>Шаг 1 из 4</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Что необходимо изготовить?</Text>

        <Text style={styles.description}>
          Выберите тип инструмента. На следующих шагах приложение подберёт
          необходимые параметры.
        </Text>

        <View style={styles.list}>
          {TOOLING.map((item) => {
            const isSelected = selected === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={styles.radio}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  <Text style={styles.optionDescription}>
                    {item.description}
                  </Text>
                </View>

                <Text style={styles.optionArrow}>›</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.heading}>Основные параметры</Text>

        <Text style={styles.label}>Машина / оборудование</Text>

        <TextInput
          value={machine}
          onChangeText={setMachine}
          placeholder="Например: Bobst, Mark Andy..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Количество</Text>

        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder="1"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.hint}>
          <View style={styles.hintIcon}>
            <Text style={styles.hintIconText}>i</Text>
          </View>

          <Text style={styles.hintText}>
            Сейчас выбран: {selectedTool?.title}. Все введённые данные можно
            будет изменить перед отправкой.
          </Text>
        </View>

        <Pressable
          onPress={() => void saveCurrentDraft()}
          style={({ pressed }) => [
            styles.draftButton,
            pressed && styles.optionPressed,
          ]}
        >
          <Text style={styles.draftButtonText}>Сохранить и продолжить позже</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.optionPressed,
          ]}
        >
          <Text style={styles.continueText}>Продолжить</Text>
          <Text style={styles.continueArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  top: {
    paddingTop: 54,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  backText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '200',
    lineHeight: 34,
  },

  topTitle: {
    flex: 1,
    marginLeft: 12,
  },

  caption: {
    color: colors.accent,
    ...typography.caption,
  },

  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },

  saveButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  save: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },

  progress: {
    paddingHorizontal: spacing.lg,
    marginTop: 20,
    marginBottom: 4,
  },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },

  progressActive: {
    width: '25%',
    height: 4,
    backgroundColor: colors.accent,
  },

  progressText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 6,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 40,
  },

  heading: {
    color: colors.text,
    ...typography.section,
    marginTop: 8,
  },

  description: {
    color: colors.textSecondary,
    ...typography.body,
    marginTop: 8,
    marginBottom: 18,
  },

  list: {
    gap: 10,
    marginBottom: 28,
  },

  option: {
    minHeight: 76,
    borderRadius: radius.lg,
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(227,6,19,0.45)',
  },

  optionPressed: {
    opacity: 0.72,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },

  optionBody: {
    flex: 1,
  },

  optionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  optionDescription: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  optionArrow: {
    color: colors.textMuted,
    fontSize: 25,
    fontWeight: '200',
    marginLeft: 8,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 7,
  },

  input: {
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 15,
    color: colors.text,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },

  hint: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(90,169,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(90,169,255,0.12)',
  },

  hintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90,169,255,0.14)',
    marginRight: 10,
  },

  hintIconText: {
    color: colors.info,
    fontWeight: '800',
    fontSize: 12,
  },

  hintText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  draftButton: {
    minHeight: 50,
    marginTop: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  draftButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  continueButton: {
    minHeight: 56,
    marginTop: 10,
    borderRadius: 17,
    paddingHorizontal: 18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  continueText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  continueArrow: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '200',
  },
});
