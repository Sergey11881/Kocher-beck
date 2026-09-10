import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { getGetOrdersQueryKey, getGetProductsQueryKey, useCreateOrder, useGetProducts, type FieldDefinition, type ProductDefinition } from '@workspace/api-client-react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttachmentSection } from '@/components/AttachmentSection';
import { GlassSection } from '@/components/GlassSection';
import { useDrafts, type DraftAttachment } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';
import { getEquipmentImage } from '@/config/equipment';
import { calculateRepeat, isPositiveNumber } from '@/utils/repeatCalculation';
import { track } from '@/utils/analytics';

type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };
type Step = 0 | 1 | 2 | 3 | 4;
const steps = ['Оснастка', 'Параметры', 'Вложения', 'Контакты', 'Проверка'];
const preferredNames = ['Формные / печатные цилиндры', 'Магнитный цилиндр', 'KMS', 'GapMaster', 'Плоская магнитная база'];

function productMatches(product: ProductDefinition, name: string) {
  return product.name.toLowerCase().includes(name.toLowerCase()) || product.key.toLowerCase() === name.toLowerCase();
}

function displayValue(value: string | undefined) {
  return value?.trim() || '—';
}

function getCatalogErrorMetadata(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== 'object') {
    return { errorClass: typeof error };
  }
  const details = error as { name?: unknown; message?: unknown; status?: unknown; method?: unknown; url?: unknown };
  return {
    errorClass: typeof details.name === 'string' ? details.name : 'UnknownError',
    endpoint: typeof details.url === 'string' ? details.url : '/api/products',
    httpStatus: typeof details.status === 'number' ? details.status : 0,
    method: typeof details.method === 'string' ? details.method : 'GET',
    message: typeof details.message === 'string' ? details.message.slice(0, 240) : 'Request failed',
  };
}

export function OrderForm() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ draft?: string; template?: string; calculator?: string }>();
  const draftId = Array.isArray(params.draft) ? params.draft[0] : params.draft;
  const templateId = Array.isArray(params.template) ? params.template[0] : params.template;
  const calculatorParam = Array.isArray(params.calculator) ? params.calculator[0] : params.calculator;
  const { isLoading: draftsLoading, templatesLoading, saveDraft, getDraft, getTemplate } = useDrafts();
  const productsQuery = useGetProducts({ query: { queryKey: getGetProductsQueryKey(), staleTime: 300_000, retry: false } });
  const createOrder = useCreateOrder();
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
  const products = Array.isArray(productsQuery.data) ? productsQuery.data : [];
  const selectedProduct = products.find((product) => product.key === selectedKey);
  const sourceDraft = draftId ? getDraft(draftId) : undefined;
  const sourceTemplate = templateId ? getTemplate(templateId) : undefined;
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

  useEffect(() => {
    if (!productsQuery.error) return;
    track('catalog_load_failed', getCatalogErrorMetadata(productsQuery.error));
  }, [productsQuery.error]);

  useEffect(() => {
    if (draftsLoading || templatesLoading || !products.length || selectedKey) return;
    const source = sourceDraft ?? sourceTemplate;
    if (source) {
      const restored = products.find((product) => product.key === source.data.__product_key || product.name === source.productType);
      if (restored) setSelectedKey(restored.key);
      setValues(Object.fromEntries(Object.entries(source.data).filter(([key]) => key !== '__product_key')));
      setClient(source.client);
      setContact(source.contact);
      setComment(source.comment);
      setAttachments(source.attachments ?? []);
      const restoredFiles: Record<string, PickedFile> = {};
      (source.attachments ?? []).forEach((attachment) => {
        if (attachment.fieldKey) restoredFiles[attachment.fieldKey] = attachment;
      });
      setFiles(restoredFiles);
      if (sourceDraft?.step !== undefined && sourceDraft.step >= 0 && sourceDraft.step <= 4) setStep(sourceDraft.step as Step);
      if (sourceDraft) track('draft_restored', { step: sourceDraft.step ?? 0 });
      return;
    }
    if (calculatorData) {
      setSelectedKey(calculatorData.productKey);
      setValues(calculatorData.values);
      return;
    }
    const first = preferredNames.map((name) => products.find((product) => productMatches(product, name))).find(Boolean);
    if (first) setSelectedKey(first.key);
  }, [calculatorData, draftsLoading, products, selectedKey, sourceDraft, sourceTemplate, templatesLoading]);

  useEffect(() => {
    if (!selectedProduct || !selectedKey) return;
    const hasContent = Object.keys(values).length > 0 || Object.keys(files).length > 0 || attachments.length > 0 || client.trim() || contact.trim() || comment.trim() || step > 0;
    if (!draftRef.current && !hasContent) return;
    const timer = setTimeout(() => {
      void saveDraft({
        productType: selectedProduct.name,
        client,
        contact,
        comment,
        data: { ...values, __product_key: selectedProduct.key },
        fileNames: Object.values(files).map((file) => file.name),
        attachments,
        step,
      }, draftRef.current).then((saved) => { draftRef.current = saved.id; }).catch((error: unknown) => console.error('Failed to autosave order draft:', error));
    }, 900);
    return () => clearTimeout(timer);
  }, [attachments, client, comment, contact, files, selectedProduct, saveDraft, step, values]);

  const updateValue = (key: string, value: string) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (selectedProduct && ['magnetic', 'printing', 'counterpressure'].includes(selectedProduct.key) && (key === 'teeth' || key === 'tooth_module')) {
        const repeat = calculateRepeat(next.teeth ?? '', next.tooth_module ?? '');
        if (repeat) next.repeat = repeat;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const pickFile = async (field: FieldDefinition) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const file = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size };
      setFiles((current) => ({ ...current, [field.key]: file }));
      setAttachments((current) => [...current.filter((item) => item.fieldKey !== field.key), {
        id: `field-${field.key}`,
        fieldKey: field.key,
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
      }]);
      setErrors((current) => ({ ...current, [field.key]: '' }));
    } catch (error: unknown) {
      console.error('Failed to pick order field file:', error);
      Alert.alert('Не удалось прикрепить файл', 'Попробуйте выбрать файл ещё раз.');
    }
  };

  const validate = (targetStep: Step, all = false) => {
    const nextErrors: Record<string, string> = {};
    if ((all || targetStep === 0) && !selectedProduct) nextErrors.product = 'Выберите тип оснастки.';
    if ((all || targetStep === 1) && selectedProduct) {
      selectedProduct.fields.forEach((field) => {
        if (!field.required) return;
        if (field.type === 'file' ? !files[field.key] : !values[field.key]?.trim()) nextErrors[field.key] = `Заполните «${field.label}».`;
        if (field.type === 'number' && values[field.key] && !isPositiveNumber(values[field.key])) nextErrors[field.key] = 'Введите число больше нуля.';
      });
      if (['magnetic', 'printing', 'counterpressure'].includes(selectedProduct.key) && values.tooth_module && !calculateRepeat(values.teeth ?? '', values.tooth_module)) {
        nextErrors.teeth = 'Проверьте Z и режим CP/DP: раппорт нельзя рассчитать из этих значений.';
      }
    }
    if ((all || targetStep === 3) && !contact.trim()) nextErrors.contact = 'Укажите контактное лицо.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveCurrentDraft = async () => {
    if (!selectedProduct) {
      setStep(0);
      setErrors({ product: 'Выберите тип оснастки.' });
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
    } catch (error: unknown) {
      console.error('Failed to save order draft:', error);
      Alert.alert('Не удалось сохранить', 'Проверьте свободное место и попробуйте ещё раз.');
    }
  };

  const submit = async () => {
    if (!selectedProduct || !validate(4, true)) return;
    try {
      const uploadFiles = [
        ...Object.values(files),
        ...attachments.filter((attachment) => !attachment.fieldKey),
      ];
      const order = await createOrder.mutateAsync({
        data: {
          product_type: selectedProduct.key,
          client,
          contact,
          comment,
          data: JSON.stringify({ ...values, __file_fields: Object.keys(files), __calculation_source: values.tooth_module ? 'server-tooth-module-formula' : undefined }),
          files: uploadFiles.map((file) => ({ uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' })) as unknown as Blob[],
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      track('order_submitted', { productType: selectedProduct.key });
      Alert.alert('Заявка успешно отправлена', 'Менеджер получил заявку и свяжется с вами.', [{ text: 'Открыть детали', onPress: () => router.replace(`/order/${order.id}`) }]);
    } catch (error: unknown) {
      console.error('Failed to submit order:', error);
      Alert.alert('Не удалось отправить заявку', 'Данные сохранены в текущей форме. Проверьте соединение и повторите отправку.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Повторить', onPress: () => void submit() }]);
    }
  };

  const next = () => {
    if (!validate(step)) return;
    if (step === 4) {
      void submit();
      return;
    }
    setStep((current) => (current + 1) as Step);
    track('order_step_completed', { step });
  };

  const progress = `${((step + 1) / steps.length) * 100}%` as `${number}%`;
  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.iconButton}><Feather name="x" size={22} color={colors.foreground} /></Pressable>
        <View style={styles.topCopy}><Text style={[styles.caption, { color: colors.primary }]}>SMART ORDER</Text><Text style={[styles.title, { color: colors.foreground }]}>Новая заявка</Text></View>
        <Pressable accessibilityRole="button" onPress={() => void saveCurrentDraft()} style={styles.saveButton}><Text style={[styles.saveText, { color: colors.primary }]}>Сохранить</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 36 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.progressArea}><View style={styles.stepRow}>{steps.map((label, index) => <View key={label} style={styles.stepItem}><View style={[styles.stepDot, { backgroundColor: index <= step ? colors.primary : colors.surfaceElevated }]}><Text style={[styles.stepNumber, { color: index <= step ? colors.primaryForeground : colors.mutedForeground }]}>{index + 1}</Text></View><Text style={[styles.stepLabel, { color: index === step ? colors.foreground : colors.mutedForeground }]}>{label}</Text></View>)}</View><View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated }]}><View style={[styles.progressFill, { width: progress, backgroundColor: colors.primary }]} /></View><Text style={[styles.progressText, { color: colors.mutedForeground }]}>Шаг {step + 1} из {steps.length}</Text></View>
        <View style={styles.form}>
          {step === 0 ? <><Text style={[styles.heading, { color: colors.foreground }]}>Выберите тип оснастки</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Покажем только поля, чертежи и фото, которые нужны для выбранного изделия.</Text>{productsQuery.isLoading ? <Text style={[styles.helper, { color: colors.mutedForeground }]}>Загрузка каталога…</Text> : null}{productsQuery.isError ? <View><Text style={[styles.errorBox, { color: colors.primary }]}>Не удалось загрузить данные каталога</Text><Pressable accessibilityRole="button" onPress={() => void productsQuery.refetch()}><Text style={[styles.retryText, { color: colors.primary }]}>Повторить</Text></Pressable></View> : null}{products.map((product) => <Pressable key={product.key} accessibilityRole="button" onPress={() => { if (selectedKey !== product.key && Object.keys(values).length) Alert.alert('Сменить тип оснастки?', 'Несовместимые технические поля будут очищены.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Продолжить', style: 'destructive', onPress: () => { setSelectedKey(product.key); setValues({}); setFiles({}); setAttachments([]); setErrors({}); } }]); else { setSelectedKey(product.key); setValues({}); setFiles({}); setAttachments([]); setErrors({}); } }} style={[styles.product, { backgroundColor: product.key === selectedKey ? colors.accentSoft : colors.surfaceGlass, borderColor: product.key === selectedKey ? colors.primary : colors.border }]}><Image source={getEquipmentImage(product.key)} style={styles.productImage} /><View style={styles.productCopy}><Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text><Text style={[styles.productMeta, { color: colors.mutedForeground }]}>{product.fields.length} параметров</Text></View><Feather name={product.key === selectedKey ? 'check-circle' : 'chevron-right'} size={19} color={product.key === selectedKey ? colors.primary : colors.mutedForeground} /></Pressable>)}{errors.product ? <Text style={[styles.fieldError, { color: colors.primary }]}>{errors.product}</Text> : null}</> : null}
          {step === 1 && selectedProduct ? <><Text style={[styles.heading, { color: colors.foreground }]}>{selectedProduct.name}</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Поля со знаком * обязательны. Для CP/DP выберите режим и укажите количество зубьев Z — раппорт рассчитается автоматически.</Text>{selectedProduct.fields.map((field) => <FieldInput key={field.key} field={field} value={values[field.key] ?? ''} file={files[field.key]} error={errors[field.key]} onChange={(value) => updateValue(field.key, value)} onPick={() => void pickFile(field)} colors={colors} />)}{values.tooth_module && values.repeat ? <GlassSection style={styles.result}><Feather name="sliders" size={18} color={colors.primary} /><Text style={[styles.resultTitle, { color: colors.foreground }]}>Рассчитанный раппорт</Text><Text style={[styles.resultValue, { color: colors.primary }]}>{values.repeat}</Text><Text style={[styles.resultHint, { color: colors.mutedForeground }]}>Формула текущего backend: Z × модуль ({values.tooth_module}). Проверьте результат по техническому заданию.</Text></GlassSection> : null}</> : null}
          {step === 2 ? <><Text style={[styles.heading, { color: colors.foreground }]}>Чертежи и фотографии</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Файлы конкретных полей уже отмечены в параметрах. Дополнительные фото можно добавить здесь.</Text><AttachmentSection attachments={attachments.filter((item) => !item.fieldKey)} onChange={(next) => setAttachments((current) => [...current.filter((item) => item.fieldKey), ...next])} /></> : null}
          {step === 3 ? <><Text style={[styles.heading, { color: colors.foreground }]}>Контактные данные</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Менеджер свяжется с вами для подтверждения технических деталей.</Text><Text style={[styles.label, { color: colors.foreground }]}>Компания / заказчик</Text><TextInput value={client} onChangeText={setClient} placeholder="Название компании" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.foreground }]}>Контактное лицо *</Text><TextInput value={contact} onChangeText={(value) => { setContact(value); setErrors((current) => ({ ...current, contact: '' })); }} placeholder="Имя, телефон или e-mail" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: errors.contact ? colors.primary : colors.border }]} />{errors.contact ? <Text style={[styles.fieldError, { color: colors.primary }]}>{errors.contact}</Text> : null}<Text style={[styles.label, { color: colors.foreground }]}>Комментарий</Text><TextInput value={comment} onChangeText={setComment} multiline placeholder="Дополнительные требования" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.textarea, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: colors.border }]} /></> : null}
          {step === 4 && selectedProduct ? <Review product={selectedProduct} values={values} files={files} attachments={attachments} client={client} contact={contact} comment={comment} colors={colors} /> : null}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: colors.background, borderTopColor: colors.border }]}>{step > 0 ? <Pressable accessibilityRole="button" onPress={() => setStep((current) => (current - 1) as Step)} style={styles.backButton}><Feather name="arrow-left" size={17} color={colors.foreground} /></Pressable> : <View />}{step === 4 ? <Pressable accessibilityRole="button" onPress={() => void submit()} disabled={createOrder.isPending} style={[styles.nextButton, { backgroundColor: colors.primary, opacity: createOrder.isPending ? 0.6 : 1 }]}><Text style={styles.nextText}>{createOrder.isPending ? 'Отправляем...' : 'Отправить заказ'}</Text><Feather name="send" size={17} color={colors.primaryForeground} /></Pressable> : <Pressable accessibilityRole="button" onPress={next} style={[styles.nextButton, { backgroundColor: colors.primary }]}><Text style={styles.nextText}>Продолжить</Text><Feather name="arrow-right" size={17} color={colors.primaryForeground} /></Pressable>}</View>
    </KeyboardAvoidingView>
  );
}

function FieldInput({ field, value, file, error, onChange, onPick, colors }: { field: FieldDefinition; value: string; file?: PickedFile; error?: string; onChange: (value: string) => void; onPick: () => void; colors: ReturnType<typeof useColors> }) {
  if (field.type === 'file') return <View style={styles.fieldWrap}><Text style={[styles.label, { color: colors.foreground }]}>{field.label}{field.required ? ' *' : ''}</Text><Pressable accessibilityRole="button" onPress={onPick} style={[styles.fileInput, { backgroundColor: colors.surfaceGlass, borderColor: error ? colors.primary : colors.border }]}><Feather name={file ? 'check-circle' : 'paperclip'} size={18} color={colors.primary} /><Text numberOfLines={1} style={[styles.fileText, { color: file ? colors.foreground : colors.mutedForeground }]}>{file?.name ?? 'Выбрать файл или фото'}</Text></Pressable>{error ? <Text style={[styles.fieldError, { color: colors.primary }]}>{error}</Text> : null}</View>;
  if (field.type === 'select') return <View style={styles.fieldWrap}><Text style={[styles.label, { color: colors.foreground }]}>{field.label}{field.required ? ' *' : ''}</Text><View style={styles.options}>{(field.options ?? []).map((option) => <Pressable key={option} onPress={() => onChange(option)} style={[styles.option, { backgroundColor: value === option ? colors.primary : colors.surfaceGlass, borderColor: value === option ? colors.primary : colors.border }]}><Text style={{ color: value === option ? colors.primaryForeground : colors.foreground, fontWeight: '700' }}>{option}</Text></Pressable>)}</View>{error ? <Text style={[styles.fieldError, { color: colors.primary }]}>{error}</Text> : null}</View>;
  return <View style={styles.fieldWrap}><Text style={[styles.label, { color: colors.foreground }]}>{field.label}{field.required ? ' *' : ''}</Text><TextInput value={value} onChangeText={onChange} editable={!field.readOnly} keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'} multiline={field.type === 'textarea'} placeholder={field.label} placeholderTextColor={colors.mutedForeground} style={[styles.input, field.type === 'textarea' && styles.textarea, { color: colors.foreground, backgroundColor: field.readOnly ? colors.surfaceElevated : colors.surfaceGlass, borderColor: error ? colors.primary : colors.border }]} />{error ? <Text style={[styles.fieldError, { color: colors.primary }]}>{error}</Text> : null}</View>;
}

function Review({ product, values, files, attachments, client, contact, comment, colors }: { product: ProductDefinition; values: Record<string, string>; files: Record<string, PickedFile>; attachments: DraftAttachment[]; client: string; contact: string; comment: string; colors: ReturnType<typeof useColors> }) {
  const rows = product.fields.filter((field) => field.type !== 'file').map((field) => `${field.label}: ${displayValue(values[field.key])}`);
  return <><Text style={[styles.heading, { color: colors.foreground }]}>Проверка заявки</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Проверьте данные перед отправкой. Вернуться и изменить любой шаг можно кнопкой «Назад».</Text><GlassSection style={styles.reviewCard}><ReviewRow label="Тип оснастки" value={product.name} colors={colors} />{rows.map((row) => <Text key={row} style={[styles.reviewRow, { color: colors.mutedForeground }]}>{row}</Text>)}<ReviewRow label="Компания" value={client} colors={colors} /><ReviewRow label="Контакт" value={contact} colors={colors} /><ReviewRow label="Вложения" value={`${Object.keys(files).length + attachments.filter((item) => !item.fieldKey).length}`} colors={colors} />{comment ? <ReviewRow label="Комментарий" value={comment} colors={colors} /> : null}</GlassSection></>;
}

function ReviewRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.reviewLine}><Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.reviewValue, { color: colors.foreground }]}>{displayValue(value)}</Text></View>;
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
  stepNumber: { fontSize: 11, fontWeight: '800' },
  stepLabel: { fontSize: 9, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 10, marginTop: 6 },
  form: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 },
  heading: { fontSize: 23, lineHeight: 29, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 20 },
  helper: { fontSize: 13, marginBottom: 12 },
  errorBox: { fontSize: 13, marginBottom: 4 },
  retryText: { fontSize: 13, fontWeight: '800', marginBottom: 12 },
  product: { minHeight: 72, borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  productImage: { width: 42, height: 42, borderRadius: 13, marginRight: 10 },
  productCopy: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '800' },
  productMeta: { fontSize: 11, marginTop: 4 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14 },
  textarea: { minHeight: 100, paddingTop: 14, textAlignVertical: 'top' },
  fileInput: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileText: { flex: 1, fontSize: 13 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 44, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, justifyContent: 'center' },
  fieldError: { fontSize: 11, marginTop: 6 },
  result: { borderRadius: 16, padding: 14, marginTop: 2 },
  resultTitle: { fontSize: 13, fontWeight: '800', marginTop: 5 },
  resultValue: { fontSize: 25, fontWeight: '800', marginTop: 3 },
  resultHint: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  reviewCard: { borderRadius: 18, padding: 16 },
  reviewLine: { minHeight: 44, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingVertical: 9, gap: 4 },
  reviewLabel: { fontSize: 11 },
  reviewValue: { fontSize: 13, fontWeight: '700' },
  reviewRow: { fontSize: 12, lineHeight: 18, paddingVertical: 5 },
  footer: { minHeight: 72, paddingHorizontal: 20, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  nextButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  nextText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
