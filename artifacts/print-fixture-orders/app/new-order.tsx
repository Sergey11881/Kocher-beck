import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { OrderDraft, useOrders } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';

const initialDraft: OrderDraft = {
  title: '',
  company: '',
  contactName: '',
  contactPhone: '',
  productType: '',
  quantity: '',
  material: '',
  dimensions: '',
  printMethod: '',
  colors: '',
  deadline: '',
  notes: '',
};

const steps = ['Заказ', 'Параметры', 'Контакты'];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        testID={`input-${label}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input },
          multiline && styles.textarea,
        ]}
      />
    </View>
  );
}

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

export default function NewOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveOrder } = useOrders();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OrderDraft>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);

  const update = (key: keyof OrderDraft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const isLastStep = step === steps.length - 1;
  const progress = useMemo(() => `${((step + 1) / steps.length) * 100}%` as `${number}%`, [step]);

  const validateStep = () => {
    if (step === 0 && !draft.productType.trim()) return 'Укажите тип оснастки.';
    if (step === 0 && !draft.quantity.trim()) return 'Укажите тираж.';
    if (step === 1 && !draft.dimensions.trim()) return 'Укажите размеры или формат.';
    if (step === 2 && !draft.contactName.trim()) return 'Укажите контактное лицо.';
    if (step === 2 && !draft.contactPhone.trim()) return 'Укажите телефон для связи.';
    return undefined;
  };

  const save = async (status: 'draft' | 'submitted') => {
    setIsSaving(true);
    try {
      const order = await saveOrder(draft, status);
      haptic();
      router.replace(`/order/${order.id}`);
    } catch {
      Alert.alert('Не удалось сохранить', 'Проверьте свободное место на устройстве и попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = () => {
    const error = validateStep();
    if (error) {
      Alert.alert('Нужно уточнить', error);
      return;
    }
    haptic();
    if (isLastStep) {
      void save('submitted');
    } else {
      setStep((current) => current + 1);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable testID="close-order" onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>Новая заявка</Text>
        <Pressable
          testID="save-draft"
          onPress={() => void save('draft')}
          disabled={isSaving}
          style={({ pressed }) => ({ opacity: pressed || isSaving ? 0.5 : 1, padding: 7 })}
        >
          <Text style={[styles.saveText, { color: colors.primary }]}>Сохранить</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        bottomOffset={84}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}
      >
        <View style={styles.progressArea}>
          <View style={styles.stepRow}>
            {steps.map((item, index) => (
              <View key={item} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: index <= step ? colors.primary : colors.secondary }]}>
                  <Text style={[styles.stepNumberText, { color: index <= step ? colors.primaryForeground : colors.mutedForeground }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, { color: index === step ? colors.foreground : colors.mutedForeground }]}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: progress }]} />
          </View>
        </View>

        <View style={styles.form}>
          {step === 0 ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>Расскажите о заказе</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Начните с общих данных — их достаточно, чтобы открыть черновик.
              </Text>
              <Field label="Название заказа" value={draft.title} onChangeText={update('title')} placeholder="Например, упаковка для каталога" colors={colors} />
              <Field label="Компания" value={draft.company} onChangeText={update('company')} placeholder="Название вашей компании" colors={colors} />
              <Field label="Тип оснастки *" value={draft.productType} onChangeText={update('productType')} placeholder="Штамп, вырубка, тиснение..." colors={colors} />
              <Field label="Тираж *" value={draft.quantity} onChangeText={update('quantity')} placeholder="Например, 5 000" keyboardType="numeric" colors={colors} />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>Технические параметры</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Чем точнее данные, тем быстрее типография сможет подготовить расчёт.
              </Text>
              <Field label="Материал" value={draft.material} onChangeText={update('material')} placeholder="Картон, бумага, плёнка..." colors={colors} />
              <Field label="Размеры или формат *" value={draft.dimensions} onChangeText={update('dimensions')} placeholder="Например, 210 × 297 мм" colors={colors} />
              <Field label="Способ печати" value={draft.printMethod} onChangeText={update('printMethod')} placeholder="Офсет, цифра, флексо..." colors={colors} />
              <Field label="Цветность" value={draft.colors} onChangeText={update('colors')} placeholder="4+0, 4+4, Pantone..." colors={colors} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>Как с вами связаться</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Эти данные увидит менеджер типографии, чтобы уточнить детали заказа.
              </Text>
              <Field label="Контактное лицо *" value={draft.contactName} onChangeText={update('contactName')} placeholder="Имя и фамилия" colors={colors} />
              <Field label="Телефон *" value={draft.contactPhone} onChangeText={update('contactPhone')} placeholder="+7 900 000-00-00" keyboardType="phone-pad" colors={colors} />
              <Field label="Желаемый срок" value={draft.deadline} onChangeText={update('deadline')} placeholder="Например, до 20 сентября" colors={colors} />
              <Field label="Комментарий" value={draft.notes} onChangeText={update('notes')} placeholder="Особые пожелания или ссылки на макеты" multiline colors={colors} />
            </>
          ) : null}
        </View>
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step > 0 ? (
          <Pressable testID="previous-step" onPress={() => setStep((current) => current - 1)} style={styles.backButton}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>Назад</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          testID="next-step"
          onPress={goNext}
          disabled={isSaving}
          style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.65 : 1 }]}
        >
          <Text style={[styles.nextText, { color: colors.primaryForeground }]}>{isLastStep ? 'Отправить заявку' : 'Продолжить'}</Text>
          <Feather name={isLastStep ? 'send' : 'arrow-right'} size={17} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { minHeight: 58, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  saveText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  progressArea: { paddingHorizontal: 20, paddingTop: 22 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  stepLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  form: { paddingHorizontal: 20, paddingTop: 31 },
  heading: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  description: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginBottom: 26, maxWidth: 330 },
  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 104, paddingTop: 14 },
  bottomBar: { minHeight: 72, paddingHorizontal: 20, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  backText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  nextButton: { minHeight: 48, paddingHorizontal: 17, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});