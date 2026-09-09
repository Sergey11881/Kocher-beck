import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  FieldDefinition,
  getApiErrorMessage,
  Order,
  ProductDefinition,
  getGetProductsQueryKey,
  getGetOrdersQueryKey,
  getGetOrderQueryKey,
  useCreateOrder,
  useGetOrder,
  useGetProducts,
} from '@workspace/api-client-react';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useDrafts } from '@/context/OrdersContext';
import { useColors } from '@/hooks/useColors';
import { BackgroundAtmosphere } from '@/components/BackgroundAtmosphere';
import { GlassSection } from '@/components/GlassSection';

type PickedFile = { uri: string; name: string; mimeType?: string };
type Step = 0 | 1 | 2;

const steps = ['Оснастка', 'Параметры', 'Контакты'];
const toothModules: Record<string, number> = { 'C.P.': 3.175, 'D.P.': 2.49364 };

function calculateRepeat(productKey: string, values: Record<string, string>) {
  if (!['magnetic', 'printing', 'counterpressure'].includes(productKey)) return '';
  const teeth = Number.parseFloat((values.teeth ?? '').replace(',', '.'));
  const module = toothModules[values.tooth_module ?? ''];
  if (!Number.isFinite(teeth) || teeth <= 0 || !module) return '';
  return `${(teeth * module).toFixed(5).replace(/\.?0+$/, '')} мм`;
}

function formatSummaryValue(value: string | undefined) {
  return value?.trim() || 'Не указано';
}

function orderMailto(order: Pick<Order, 'order_number' | 'product_name' | 'client' | 'contact' | 'status' | 'comment' | 'data'>) {
  const lines = [
    `Номер заявки: ${order.order_number}`,
    `Изделие: ${order.product_name}`,
    `Заказчик: ${order.client || 'Не указан'}`,
    `Контакт: ${order.contact || 'Не указан'}`,
    `Этап: ${order.status}`,
    '',
    'Параметры:',
    ...Object.entries(order.data ?? {})
      .filter(([key, value]) => key !== '__file_fields' && value !== null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`),
    '',
    `Комментарий: ${order.comment || 'Нет'}`,
  ];
  return `mailto:spavlov@kocher-beck.ru?subject=${encodeURIComponent(`Заявка ${order.order_number}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

function FieldInput({
  field,
  value,
  file,
  onChange,
  onPickFile,
  colors,
}: {
  field: FieldDefinition;
  value: string;
  file?: PickedFile;
  onChange: (value: string) => void;
  onPickFile: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const isFile = field.type === 'file';
  const isMultiline = field.type === 'textarea';

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {field.label}
        {field.required ? ' *' : ''}
      </Text>
      {isFile ? (
        <Pressable
          testID={`field-${field.key}`}
          onPress={onPickFile}
          style={({ pressed }) => [
            styles.fileField,
            { backgroundColor: colors.card, borderColor: file ? colors.primary : colors.input, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <View style={[styles.fileIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={file ? 'check' : 'paperclip'} size={18} color={file ? colors.primary : colors.secondaryForeground} />
          </View>
          <View style={styles.fileCopy}>
            <Text numberOfLines={1} style={[styles.fileTitle, { color: colors.foreground }]}>
              {file ? file.name : 'Прикрепить файл'}
            </Text>
            <Text style={[styles.fileHint, { color: colors.mutedForeground }]}>
              {file ? 'Файл выбран' : 'Фото, PDF, DXF, DWG или STEP'}
            </Text>
          </View>
          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
        </Pressable>
      ) : field.type === 'select' ? (
        <View style={styles.options}>
          {(field.options ?? []).map((option) => (
            <Pressable
              key={option}
              testID={`option-${field.key}-${option}`}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: value === option ? colors.primary : colors.card,
                  borderColor: value === option ? colors.primary : colors.input,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Text style={[styles.optionText, { color: value === option ? colors.primaryForeground : colors.foreground }]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <TextInput
          testID={`field-${field.key}`}
          value={value}
          onChangeText={onChange}
           editable={!field.readOnly}
          placeholder={field.label}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          multiline={isMultiline}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          style={[
            styles.input,
             { color: field.readOnly ? colors.mutedForeground : colors.foreground, backgroundColor: field.readOnly ? colors.secondary : colors.card, borderColor: colors.input },
            isMultiline && styles.textarea,
          ]}
        />
      )}
    </View>
  );
}

function getProductImage(name: string) {
  if (name === 'Магнитный цилиндр') return require('../assets/tooling/MC.jpg');
  if (name === 'Цилиндр противодавления') return require('../assets/tooling/CPD.jpg');
  if (name === 'Цельнометаллический вырубной цилиндр') return require('../assets/tooling/virc.webp');
  if (name === 'Формные / печатные цилиндры') return require('../assets/tooling/f&pc.jpg');
  return null;
}

function ProductCard({
  product,
  selected,
  onPress,
  colors,
}: {
  product: ProductDefinition;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const productImage = getProductImage(product.name);

  return (
    <GlassSection depth={selected ? 'deep' : 'standard'} style={[styles.productCard, selected && { borderColor: colors.primary }]}>
    <Pressable testID={`product-${product.key}`} onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}>
      {productImage ? (
        <View
          style={[
            styles.productImageWrap,
            { backgroundColor: selected ? colors.accent : colors.secondary, borderColor: selected ? colors.primary : colors.border },
          ]}
        >
          <Image source={productImage} style={styles.productImage} resizeMode="contain" />
        </View>
      ) : (
        <View style={[styles.productIcon, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
          <Feather name="box" size={19} color={selected ? colors.primaryForeground : colors.secondaryForeground} />
        </View>
      )}
      <Text style={[styles.productName, { color: selected ? colors.background : colors.cardForeground }]}>{product.name}</Text>
      <Text style={[styles.productMeta, { color: selected ? colors.secondary : colors.mutedForeground }]}>
        {product.fields.length} {product.fields.length === 1 ? 'параметр' : 'параметров'}
      </Text>
      {selected ? <Feather name="check-circle" size={19} color={colors.primary} style={styles.selectedIcon} /> : null}
    </Pressable>
    </GlassSection>
  );
}

export default function NewOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { saveDraft } = useDrafts();
  const params = useLocalSearchParams<{ repeat?: string }>();
  const repeatParam = Array.isArray(params.repeat) ? params.repeat[0] : params.repeat;
  const repeatId = Number(repeatParam);
  const productsQuery = useGetProducts({ query: { queryKey: getGetProductsQueryKey(), staleTime: 300_000 } });
  const repeatOrderQuery = useGetOrder(repeatId, { query: { queryKey: getGetOrderQueryKey(repeatId), enabled: Number.isFinite(repeatId) } });
  const createOrder = useCreateOrder();
  const [step, setStep] = useState<Step>(0);
  const [selectedKey, setSelectedKey] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, PickedFile>>({});
  const [repeatedFileCount, setRepeatedFileCount] = useState(0);
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');

  const products = productsQuery.data ?? [];
  const selectedProduct = products.find((product) => product.key === selectedKey);
  const progress = useMemo(() => `${((step + 1) / steps.length) * 100}%` as `${number}%`, [step]);
  const isSaving = createOrder.isPending;

  useEffect(() => {
    if (!Number.isFinite(repeatId) || !repeatOrderQuery.data || selectedKey) return;
    const repeated = repeatOrderQuery.data;
    const repeatedFileFields = new Set(
      Array.isArray(repeated.data?.__file_fields) ? repeated.data.__file_fields : [],
    );
    setSelectedKey(repeated.product_type);
    setValues(
      Object.fromEntries(
        Object.entries(repeated.data ?? {})
          .filter(([key, value]) => key !== '__file_fields' && !repeatedFileFields.has(key) && value !== null && !Array.isArray(value))
          .map(([key, value]) => [key, String(value)]),
      ),
    );
    setRepeatedFileCount(Math.max(repeated.files?.length ?? 0, repeatedFileFields.size));
    setClient(repeated.client ?? '');
    setContact(repeated.contact ?? '');
    setComment(repeated.comment ?? '');
  }, [repeatId, repeatOrderQuery.data, selectedKey]);

  const selectProduct = (product: ProductDefinition) => {
    setSelectedKey(product.key);
    setValues({});
    setFiles({});
    setRepeatedFileCount(0);
    haptic();
  };

  const updateValue = (key: string, value: string) => setValues((current) => {
    const next = { ...current, [key]: value };
    if (selectedProduct && (key === 'teeth' || key === 'tooth_module')) next.repeat = calculateRepeat(selectedProduct.key, next);
    return next;
  });

  const pickFile = async (fieldKey: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFiles((current) => ({
        ...current,
        [fieldKey]: { uri: asset.uri, name: asset.name ?? 'Прикреплённый файл', mimeType: asset.mimeType },
      }));
      haptic();
    }
  };

  const validateStep = () => {
    if (step === 0 && !selectedProduct) return 'Выберите тип оснастки.';
    if (step === 1 && selectedProduct) {
      const missing = selectedProduct.fields.find((field) => {
        if (!field.required) return false;
        return field.type === 'file' ? !files[field.key] : !values[field.key]?.trim();
      });
      if (missing) return `Заполните поле «${missing.label}».`;
    }
    if (step === 2 && !contact.trim()) return 'Укажите контактное лицо.';
    return undefined;
  };

  const saveAsDraft = async () => {
    if (!selectedProduct) {
      Alert.alert('Выберите оснастку', 'Сначала укажите тип изделия для черновика.');
      return;
    }
    try {
      await saveDraft({
        productType: selectedProduct.name,
        client,
        contact,
        comment,
        data: values,
        fileNames: Object.values(files).map((file) => file.name),
      });
      haptic();
      Alert.alert('Черновик сохранён', 'Вы сможете вернуться к нему позже на этом устройстве.');
      router.back();
    } catch {
      Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.');
    }
  };

  const submit = async () => {
    if (!selectedProduct) return;
    const data = JSON.stringify({ ...values, __file_fields: Object.keys(files) });
    const body = {
      product_type: selectedProduct.key,
      client,
      contact,
      comment,
      data,
      files: Object.values(files).map((file) => ({
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/octet-stream',
      })) as unknown as Blob[],
    };

    try {
       const order = await createOrder.mutateAsync({ data: body });
      await queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
       void Linking.openURL(orderMailto(order));
      haptic();
      router.replace(`/order/${order.id}`);
    } catch (error) {
      Alert.alert('Не удалось отправить заявку', getApiErrorMessage(error, 'Проверьте соединение с сервером и попробуйте ещё раз.'));
    }
  };

  const goNext = () => {
    const error = validateStep();
    if (error) {
      Alert.alert('Нужно уточнить', error);
      return;
    }
    if (step === 2) {
      void submit();
    } else {
      haptic();
      setStep((current) => (current + 1) as Step);
    }
  };

  return (
    <BackgroundAtmosphere>
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable testID="close-order" onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>Новая заявка</Text>
        <Pressable testID="save-draft" onPress={() => void saveAsDraft()} disabled={isSaving} style={({ pressed }) => ({ opacity: pressed || isSaving ? 0.5 : 1, padding: 7 })}>
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
                  <Text style={[styles.stepNumberText, { color: index <= step ? colors.primaryForeground : colors.mutedForeground }]}>{index + 1}</Text>
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
              <Text style={[styles.heading, { color: colors.foreground }]}>Какую оснастку изготовить?</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Выберите тип изделия — дальше покажем только нужные технические поля.</Text>
              {productsQuery.isLoading ? <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Загружаем каталог...</Text> : null}
              {productsQuery.isError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="wifi-off" size={20} color={colors.primary} />
                  <Text style={[styles.errorText, { color: colors.cardForeground }]}>Не удалось загрузить каталог</Text>
                  <Pressable onPress={() => void productsQuery.refetch()}><Text style={[styles.retryText, { color: colors.primary }]}>Повторить</Text></Pressable>
                </View>
              ) : (
                <GlassSection style={styles.formSection}>
                  <Text style={[styles.sectionLabel, { color: colors.primary }]}>ТИП ПРОДУКЦИИ</Text>
                  <View style={styles.productGrid}>
                    {products.map((product) => (
                      <ProductCard key={product.key} product={product} selected={selectedKey === product.key} onPress={() => selectProduct(product)} colors={colors} />
                    ))}
                  </View>
                </GlassSection>
              )}
            </>
          ) : null}

          {step === 1 && selectedProduct ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>{selectedProduct.name}</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Заполните обязательные поля и прикрепите материалы для точного расчёта.</Text>
              {Number.isFinite(repeatId) && repeatedFileCount > 0 ? (
                <View style={[styles.repeatNotice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="paperclip" size={17} color={colors.primary} />
                  <Text style={[styles.repeatNoticeText, { color: colors.secondaryForeground }]}>
                    В исходной заявке было {repeatedFileCount} вложений. Для новой заявки выберите файлы заново: прежние файлы не отправляются повторно автоматически.
                  </Text>
                </View>
              ) : null}
              <GlassSection style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>ПАРАМЕТРЫ И ВЛОЖЕНИЯ</Text>
                {selectedProduct.fields.map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ''}
                    file={files[field.key]}
                    onChange={(value) => updateValue(field.key, value)}
                    onPickFile={() => void pickFile(field.key)}
                    colors={colors}
                  />
                ))}
              </GlassSection>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={[styles.heading, { color: colors.foreground }]}>Контактные данные</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Менеджер типографии свяжется с вами, чтобы подтвердить параметры заказа.</Text>
              <GlassSection style={styles.summary}>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>ПРОВЕРКА ЗАКАЗА</Text>
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{selectedProduct?.name}</Text>
                <Text style={[styles.summaryLine, { color: colors.mutedForeground }]}>Контакт: {formatSummaryValue(contact)}</Text>
                <Text style={[styles.summaryLine, { color: colors.mutedForeground }]}>Параметров заполнено: {Object.values(values).filter(Boolean).length}</Text>
                <Text style={[styles.summaryLine, { color: colors.mutedForeground }]}>Вложений: {Object.keys(files).length}</Text>
              </GlassSection>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.foreground }]}>Компания / заказчик</Text>
                <TextInput value={client} onChangeText={setClient} placeholder="Название компании" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]} />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.foreground }]}>Контактное лицо *</Text>
                <TextInput testID="contact-name" value={contact} onChangeText={setContact} placeholder="ФИО" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]} />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.foreground }]}>Комментарий</Text>
                <TextInput value={comment} onChangeText={setComment} placeholder="Особые требования или комментарии инженера" placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" style={[styles.input, styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]} />
              </View>
            </>
          ) : null}
        </View>
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
        {step > 0 ? (
          <Pressable testID="previous-step" onPress={() => setStep((current) => (current - 1) as Step)} style={styles.backButton}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>Назад</Text>
          </Pressable>
        ) : <View />}
        <Pressable testID="next-step" onPress={goNext} disabled={isSaving} style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.65 : 1 }]}>
          <Text style={[styles.nextText, { color: colors.primaryForeground }]}>{step === 2 ? 'Отправить заявку' : 'Продолжить'}</Text>
          <Feather name={step === 2 ? 'send' : 'arrow-right'} size={17} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </View>
    </BackgroundAtmosphere>
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
  formSection: { padding: 16, borderRadius: 22, marginBottom: 18 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 14 },
  heading: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  description: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginBottom: 26, maxWidth: 340 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  errorBox: { borderWidth: 1, borderRadius: 16, padding: 17, gap: 11 },
  errorText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  repeatNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 18 },
  repeatNoticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  retryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  productGrid: { gap: 12 },
  productCard: {
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  productImageWrap: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  productName: { fontSize: 15, lineHeight: 19, fontFamily: 'Inter_600SemiBold', paddingRight: 30, letterSpacing: -0.15 },
  productMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 5 },
  selectedIcon: { position: 'absolute', right: 14, top: 14 },
  fieldWrap: { marginBottom: 18 },
  summary: { padding: 16, borderRadius: 20, marginBottom: 22 },
  summaryTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  summaryLine: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 108, paddingTop: 14 },
  fileField: { minHeight: 67, borderWidth: 1, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  fileIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1 },
  fileTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  fileHint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  optionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  bottomBar: { minHeight: 72, paddingHorizontal: 20, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  backText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  nextButton: { minHeight: 48, paddingHorizontal: 17, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});