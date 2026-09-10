import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { getGetProductsQueryKey, useGetProducts, type FieldDefinition, type ProductDefinition } from '@workspace/api-client-react';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSection } from '@/components/GlassSection';
import { AttachmentSection } from '@/components/AttachmentSection';
import { useDrafts, type DraftAttachment } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';
import { getEquipmentImage } from '@/config/equipment';
import { track } from '@/utils/analytics';
import { Image } from 'react-native';

type Step = 0 | 1 | 2;
type PickedFile = { uri: string; name: string; mimeType?: string };

const preferredNames = ['Формные / печатные цилиндры', 'Магнитный цилиндр', 'KMS', 'GapMaster', 'Плоская магнитная база'];

function productMatches(product: ProductDefinition, name: string) {
  return product.name.toLowerCase().includes(name.toLowerCase()) || product.key.toLowerCase() === name.toLowerCase();
}

export default function NewOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ draft?: string; template?: string; calculator?: string }>();
  const draftId = Array.isArray(params.draft) ? params.draft[0] : params.draft;
  const templateId = Array.isArray(params.template) ? params.template[0] : params.template;
  const calculatorParam = Array.isArray(params.calculator) ? params.calculator[0] : params.calculator;
  const { isLoading: draftsLoading, saveDraft, getDraft, getTemplate } = useDrafts();
  const productsQuery = useGetProducts({ query: { queryKey: getGetProductsQueryKey(), staleTime: 300_000 } });
  const [step, setStep] = useState<Step>(0);
  const [selectedKey, setSelectedKey] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, PickedFile>>({});
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const draftRef = useRef(draftId);
  const hydratedRef = useRef(false);

  const products = Array.isArray(productsQuery.data) ? productsQuery.data : [];
  const selectedProduct = products.find((product) => product.key === selectedKey);
  const draft = draftId ? getDraft(draftId) : undefined;
  const template = templateId ? getTemplate(templateId) : undefined;
  const calculatorData = useMemo(() => {
    if (!calculatorParam) return undefined;
    try {
      const parsed = JSON.parse(decodeURIComponent(calculatorParam)) as unknown;
      if (typeof parsed !== 'object' || parsed === null || !('productKey' in parsed) || !('values' in parsed)) return undefined;
      return parsed as { productKey: string; values: Record<string, string> };
    } catch {
      return undefined;
    }
  }, [calculatorParam]);
  const progress = `${((step + 1) / 3) * 100}%` as `${number}%`;

  useEffect(() => {
    if (hydratedRef.current || draftsLoading || !products.length) return;
    hydratedRef.current = true;
    const source = draft ?? template;
    if (source) {
      const savedKey = source.data.__product_key;
      const restored = products.find((product) => product.key === savedKey || product.name === source.productType);
      if (restored) setSelectedKey(restored.key);
      setValues(Object.fromEntries(Object.entries(source.data).filter(([key]) => key !== '__product_key')));
      setClient(source.client);
      setContact(source.contact);
      setComment(source.comment);
      setAttachments(source.attachments ?? []);
      if (draft?.step === 1 || draft?.step === 2) setStep(draft.step);
      if (template && restored) setSelectedKey(restored.key);
      if (draft) track('draft_restored', { step: draft.step ?? 0 });
      return;
    }
    if (calculatorData) {
      setSelectedKey(calculatorData.productKey);
      setValues(calculatorData.values);
      return;
    }
    const first = preferredNames.map((name) => products.find((product) => productMatches(product, name))).find(Boolean);
    if (first) setSelectedKey(first.key);
  }, [calculatorData, draft, products, template]);

  useEffect(() => {
    if (!hydratedRef.current || !selectedProduct) return;
    const hasDraftContent = Object.keys(values).length > 0
      || Boolean(client.trim() || contact.trim() || comment.trim())
      || Object.keys(files).length > 0
      || attachments.length > 0
      || step > 0;
    if (!draftRef.current && !hasDraftContent) return;
    const timer = setTimeout(() => {
      void saveDraft(
        {
          productType: selectedProduct.name,
          client,
          contact,
          comment,
          data: { ...values, __product_key: selectedProduct.key },
          fileNames: Object.values(files).map((file) => file.name),
          attachments,
          step,
        },
        draftRef.current,
      ).then((saved) => {
        draftRef.current = saved.id;
      }).catch((error: unknown) => {
        console.error('Failed to autosave draft:', error);
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [attachments, client, comment, contact, files, selectedProduct, saveDraft, values]);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    if (step === 0 && !selectedProduct) nextErrors.product = 'Выберите тип оснастки.';
    if (step === 1 && selectedProduct) {
      selectedProduct.fields.forEach((field) => {
        if (!field.required) return;
        if (field.type === 'file' ? !files[field.key] : !values[field.key]?.trim()) {
          nextErrors[field.key] = 'Заполните это поле.';
        }
      });
    }
    if (step === 2 && !contact.trim()) nextErrors.contact = 'Укажите контактное лицо.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const pickFile = async (field: FieldDefinition) => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFiles((current) => ({ ...current, [field.key]: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType } }));
      setErrors((current) => ({ ...current, [field.key]: '' }));
    }
  };

  const saveAndClose = async () => {
    if (!selectedProduct) {
      setErrors({ product: 'Выберите тип оснастки.' });
      setStep(0);
      return;
    }
    try {
      const saved = await saveDraft({
        productType: selectedProduct.name,
        client,
        contact,
        comment,
        data: { ...values, __product_key: selectedProduct.key },
        fileNames: Object.values(files).map((file) => file.name),
        attachments,
        step,
      }, draftRef.current);
      draftRef.current = saved.id;
      Alert.alert('Черновик сохранён', 'Заявка доступна в разделе «Черновики».');
      router.replace('/drafts');
    } catch (error) {
      console.error('Failed to save draft:', error);
      Alert.alert('Не удалось сохранить', 'Проверьте свободное место и попробуйте ещё раз.');
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < 2) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep((current) => (current + 1) as Step);
    }
    else void saveAndClose();
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}><Feather name="x" size={22} color={colors.foreground} /></Pressable>
        <View style={styles.topCopy}><Text style={[styles.caption, { color: colors.primary }]}>SMART ORDER</Text><Text style={[styles.title, { color: colors.foreground }]}>Новая заявка</Text></View>
        <Pressable onPress={() => void saveAndClose()} style={styles.saveButton}><Text style={[styles.saveText, { color: colors.primary }]}>Сохранить</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 36 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.progressArea}>
          <View style={styles.stepRow}>
            {['Оснастка', 'Параметры', 'Контакты'].map((label, index) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: index <= step ? colors.primary : colors.surfaceElevated }]}><Text style={[styles.stepNumber, { color: index <= step ? colors.primaryForeground : colors.mutedForeground }]}>{index + 1}</Text></View>
                <Text style={[styles.stepLabel, { color: index === step ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated }]}><View style={[styles.progressFill, { width: progress, backgroundColor: colors.primary }]} /></View>
          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>Шаг {step + 1} из 3</Text>
        </View>
        <View style={styles.form}>
          {step === 0 ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>Что нужно изготовить?</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Выберите тип оснастки — дальше покажем только нужные технические поля.</Text>
              {productsQuery.isLoading ? <Text style={[styles.helper, { color: colors.mutedForeground }]}>Загружаем каталог...</Text> : null}
              {productsQuery.isError ? <Text style={[styles.errorBox, { color: colors.primary }]}>Не удалось загрузить каталог. Проверьте соединение.</Text> : null}
              <Pressable onPress={() => router.push('/calculator')} style={[styles.utilityButton, { borderColor: colors.border, backgroundColor: colors.surfaceGlass }]}>
                <Feather name="sliders" size={16} color={colors.primary} /><Text style={[styles.utilityText, { color: colors.foreground }]}>Открыть калькулятор цилиндра</Text>
              </Pressable>
              {products.map((product) => (
                <Pressable key={product.key} onPress={() => { track('tooling_selected', { productType: product.key }); setSelectedKey(product.key); setValues({}); setFiles({}); setErrors({}); }} style={({ pressed }) => [styles.product, { backgroundColor: product.key === selectedKey ? colors.accentSoft : colors.surfaceGlass, borderColor: product.key === selectedKey ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 }]}>
                  <Image source={getEquipmentImage(product.key)} style={styles.productImage} />
                  <View style={[styles.productIcon, { backgroundColor: product.key === selectedKey ? colors.primary : colors.surfaceElevated }]}><Feather name={product.key === selectedKey ? 'check' : 'box'} size={18} color={product.key === selectedKey ? colors.primaryForeground : colors.mutedForeground} /></View>
                  <View style={styles.productCopy}><Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text><Text style={[styles.productMeta, { color: colors.mutedForeground }]}>{product.fields.length} параметров</Text></View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
              {errors.product ? <Text style={[styles.fieldError, { color: colors.primary }]}>{errors.product}</Text> : null}
            </>
          ) : null}
          {step === 1 && selectedProduct ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>{selectedProduct.name}</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Проверьте размеры, количество зубьев, repeat/pitch, толщину и единицы измерения.</Text>
              {selectedProduct.fields.map((field) => (
                <FieldInput key={field.key} field={field} value={values[field.key] ?? ''} file={files[field.key]} error={errors[field.key]} onChange={(value) => updateValue(field.key, value)} onPick={() => void pickFile(field)} colors={colors} />
              ))}
              {selectedProduct.key === 'magnetic' && !values.repeat ? <GlassSection style={styles.tip}><Feather name="sliders" size={17} color={colors.primary} /><Text style={[styles.tipText, { color: colors.mutedForeground }]}>Не знаете repeat? Откройте калькулятор — он поможет подготовить раскладку этикеток.</Text><Pressable onPress={() => router.push('/calculator')}><Text style={[styles.tipLink, { color: colors.primary }]}>Открыть калькулятор</Text></Pressable></GlassSection> : null}
              <GlassSection style={styles.tip}><Feather name="info" size={17} color={colors.primary} /><Text style={[styles.tipText, { color: colors.mutedForeground }]}>Проверьте, что размеры указаны в правильных единицах, а repeat соответствует заданию.</Text></GlassSection>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>Контакты и проверка</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Оставьте контакт, чтобы менеджер мог уточнить детали заказа.</Text>
              <Text style={[styles.label, { color: colors.foreground }]}>Компания / заказчик</Text>
              <TextInput value={client} onChangeText={setClient} placeholder="Название компании" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: colors.border }]} />
              <Text style={[styles.label, { color: colors.foreground }]}>Контактное лицо *</Text>
              <TextInput value={contact} onChangeText={(value) => { setContact(value); setErrors((current) => ({ ...current, contact: '' })); }} placeholder="Имя и телефон или e-mail" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: errors.contact ? colors.primary : colors.border }]} />
              {errors.contact ? <Text style={[styles.fieldError, { color: colors.primary }]}>{errors.contact}</Text> : null}
              <Text style={[styles.label, { color: colors.foreground }]}>Комментарий</Text>
              <TextInput value={comment} onChangeText={setComment} multiline placeholder="Дополнительные требования" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.textarea, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: colors.border }]} />
              <GlassSection style={styles.summary}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>Проверьте перед сохранением</Text><Text style={[styles.summaryText, { color: colors.mutedForeground }]}>{selectedProduct?.name}</Text><Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Заполнено полей: {Object.keys(values).length}</Text></GlassSection>
              <AttachmentSection attachments={attachments} onChange={setAttachments} />
            </>
          ) : null}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step > 0 ? <Pressable onPress={() => setStep((current) => (current - 1) as Step)} style={[styles.backButton, { borderColor: colors.border }]}><Feather name="arrow-left" size={17} color={colors.foreground} /></Pressable> : null}
        <Pressable onPress={next} style={[styles.nextButton, { backgroundColor: colors.primary }]}><Text style={styles.nextText}>{step === 2 ? 'Сохранить черновик' : 'Продолжить'}</Text><Feather name={step === 2 ? 'check' : 'arrow-right'} size={17} color={colors.primaryForeground} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldInput({ field, value, file, error, onChange, onPick, colors }: { field: FieldDefinition; value: string; file?: PickedFile; error?: string; onChange: (value: string) => void; onPick: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{field.label}{field.required ? ' *' : ''}</Text>
      {field.type === 'file' ? (
        <Pressable onPress={onPick} style={[styles.input, styles.fileInput, { backgroundColor: colors.surfaceGlass, borderColor: error ? colors.primary : colors.border }]}><Feather name={file ? 'check-circle' : 'paperclip'} size={18} color={colors.primary} /><Text numberOfLines={1} style={[styles.fileText, { color: file ? colors.foreground : colors.mutedForeground }]}>{file?.name ?? 'Прикрепить файл'}</Text></Pressable>
      ) : field.type === 'select' ? (
        <View style={styles.options}>{(field.options ?? []).map((option) => <Pressable key={option} onPress={() => onChange(option)} style={[styles.option, { backgroundColor: value === option ? colors.primary : colors.surfaceGlass, borderColor: value === option ? colors.primary : colors.border }]}><Text style={{ color: value === option ? colors.primaryForeground : colors.foreground, fontWeight: '700' }}>{option}</Text></Pressable>)}</View>
      ) : (
        <TextInput value={value} onChangeText={onChange} editable={!field.readOnly} keyboardType={field.type === 'number' ? 'numeric' : 'default'} multiline={field.type === 'textarea'} placeholder={field.label} placeholderTextColor={colors.mutedForeground} style={[styles.input, field.type === 'textarea' && styles.textarea, { color: colors.foreground, backgroundColor: field.readOnly ? colors.surfaceElevated : colors.surfaceGlass, borderColor: error ? colors.primary : colors.border }]} />
      )}
      {error ? <Text style={[styles.fieldError, { color: colors.primary }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, marginLeft: 8 },
  caption: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  saveButton: { padding: 8 },
  saveText: { fontSize: 13, fontWeight: '800' },
  progressArea: { paddingHorizontal: 20, paddingTop: 18 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontSize: 12, fontWeight: '800' },
  stepLabel: { fontSize: 10, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 10, marginTop: 6 },
  form: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 },
  heading: { fontSize: 23, lineHeight: 29, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 20 },
  helper: { fontSize: 13, marginBottom: 12 },
  errorBox: { fontSize: 13, marginBottom: 12 },
  utilityButton: { minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  utilityText: { fontSize: 12, fontWeight: '800' },
  product: { minHeight: 72, borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  productImage: { width: 42, height: 42, borderRadius: 13, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
  productIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  productCopy: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '800' },
  productMeta: { fontSize: 11, marginTop: 4 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14 },
  textarea: { minHeight: 100, paddingTop: 14, textAlignVertical: 'top' },
  fileInput: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  fileText: { flex: 1, fontSize: 13 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 44, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, justifyContent: 'center' },
  fieldError: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  tip: { flexDirection: 'row', gap: 10, padding: 14, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  tipLink: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  summary: { padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  summaryText: { fontSize: 12, marginTop: 4 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', gap: 10, borderTopWidth: 1 },
  backButton: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextButton: { flex: 1, minHeight: 52, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
