import { Feather } from '@expo/vector-icons';
import { getApiErrorMessage, getGetOrderQueryKey, useGetOrder } from '@workspace/api-client-react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BackgroundAtmosphere } from '@/components/BackgroundAtmosphere';
import { BrandHeader } from '@/components/BrandHeader';
import { GlassSection } from '@/components/GlassSection';
import { OrderTimeline } from '@/components/OrderTimeline';
import { useDrafts } from '@/context/OrdersContext';
import { getOrderStatusLabel } from '@/utils/orderStatus';
import { ManagerContact } from '@/components/ManagerContact';
import { track } from '@/utils/analytics';

export default function OrderDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderId = Number(rawId);
  const { saveDraft, saveTemplate } = useDrafts();
  const orderQuery = useGetOrder(orderId, { query: { queryKey: getGetOrderQueryKey(orderId), enabled: Number.isFinite(orderId) } });
  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Feather name="file-minus" size={30} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.foreground }]}>Заявка не найдена</Text>
        {orderQuery.isError ? <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{getApiErrorMessage(orderQuery.error, 'Не удалось загрузить заявку.')}</Text> : null}
        <Pressable onPress={() => router.replace('/')}><Text style={[styles.link, { color: colors.primary }]}>На главную</Text></Pressable>
      </View>
    );
  }

  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(order.created_at));
  const orderData = typeof order.data === 'object' && order.data !== null && !Array.isArray(order.data) ? order.data : {};
  const orderFiles = Array.isArray(order.files) ? order.files.filter((file): file is string => typeof file === 'string') : [];
  const dataRows = Object.entries(orderData).filter(([key, value]) => key !== '__file_fields' && value !== null && value !== undefined && value !== '');
  const displayStatus = getOrderStatusLabel(order.status);
  const repeatOrder = async () => {
    const repeatData = Object.fromEntries(
      Object.entries(orderData)
        .filter(([key, value]) => key !== '__file_fields' && key !== '__product_key' && value !== null && value !== undefined)
        .map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : String(value)]),
    );
    const draft = await saveDraft({
      productType: order.product_name,
      client: order.client,
      contact: order.contact,
      comment: order.comment,
      data: { ...repeatData, __product_key: order.product_type },
      fileNames: orderFiles.map((file) => file.split('/').pop() ?? file),
      step: 1,
    });
    router.replace(`/new-order?draft=${draft.id}`);
  };

  const saveAsTemplate = async () => {
    await saveTemplate({
      name: `${order.product_name} · шаблон`,
      productType: order.product_name,
      client: order.client,
      contact: order.contact,
      comment: order.comment,
      data: Object.fromEntries(Object.entries(orderData).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : String(value ?? '')])),
      fileNames: orderFiles.map((file) => file.split('/').pop() ?? file),
    });
    track('template_created', { productType: order.product_type });
  };

  return (
    <BackgroundAtmosphere>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader title="Детали заявки" action="arrow-left" actionLabel="Назад" onAction={() => router.back()} />

      <View style={styles.content}>
        <View style={[styles.status, { backgroundColor: colors.accent }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.accentForeground }]} />
          <Text style={[styles.statusText, { color: colors.accentForeground }]}>{displayStatus}</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{order.order_number}</Text>
        <Text style={[styles.productName, { color: colors.primary }]}>{order.product_name}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>Создана {date}</Text>

        <OrderTimeline status={order.status} />
        <Pressable testID="repeat-order-detail" onPress={() => void repeatOrder()} style={({ pressed }) => [styles.repeatButton, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="refresh-cw" size={15} color={colors.primary} />
          <Text style={[styles.repeatText, { color: colors.primary }]}>Повторить заказ</Text>
        </Pressable>
        <Pressable onPress={() => void saveAsTemplate()} style={({ pressed }) => [styles.templateButton, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="bookmark" size={15} color={colors.primary} />
          <Text style={[styles.repeatText, { color: colors.primary }]}>Сохранить как шаблон</Text>
        </Pressable>

        <GlassSection style={styles.detailsCard}>
          <DetailRow label="Компания / заказчик" value={order.client} colors={colors} />
          <DetailRow label="Контактное лицо" value={order.contact} colors={colors} />
          <DetailRow label="Тип оснастки" value={order.product_name} colors={colors} />
          {dataRows.map(([label, value]) => (
            <DetailRow key={label} label={label} value={Array.isArray(value) ? value.join(', ') : String(value)} colors={colors} />
          ))}
        </GlassSection>
        <ManagerContact />

        {orderFiles.length > 0 ? (
          <GlassSection style={styles.files}>
            <View style={styles.filesHeader}>
              <Feather name="paperclip" size={17} color={colors.secondaryForeground} />
              <Text style={[styles.filesLabel, { color: colors.secondaryForeground }]}>Прикреплено файлов: {orderFiles.length}</Text>
            </View>
            {orderFiles.map((file, fileIndex) => (
              <Text key={`${file}-${fileIndex}`} numberOfLines={1} style={[styles.fileName, { color: colors.secondaryForeground }]}>{file.split('/').pop() ?? file}</Text>
            ))}
            <Text style={[styles.filesHint, { color: colors.mutedForeground }]}>Файлы сохранены на сервере типографии вместе с заявкой.</Text>
          </GlassSection>
        ) : null}

        {order.comment ? (
          <GlassSection style={styles.notes}>
            <Text style={[styles.notesLabel, { color: colors.secondaryForeground }]}>Комментарий</Text>
            <Text style={[styles.notesText, { color: colors.secondaryForeground }]}>{order.comment}</Text>
          </GlassSection>
        ) : null}

        <View style={[styles.info, { borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Менеджер свяжется с вами, чтобы подтвердить детали и сроки изготовления.</Text>
        </View>
      </View>
    </ScrollView>
    </BackgroundAtmosphere>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.cardForeground }]}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  notFound: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginVertical: 8 },
  errorText: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 300, marginBottom: 8 },
  link: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  screen: { flex: 1 },
  topBar: { height: 44, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  content: { paddingHorizontal: 20, paddingTop: 14 },
  status: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', marginTop: 17, marginBottom: 6 },
  productName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 25 },
  repeatButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18 },
  templateButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18 },
  repeatText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  detailsCard: { borderRadius: 18, paddingHorizontal: 16 },
  row: { minHeight: 51, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, borderBottomWidth: 1 },
  rowLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  rowValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1.2, textAlign: 'right' },
  files: { borderRadius: 17, padding: 16, marginTop: 14 },
  filesHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  filesLabel: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  filesHint: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', marginTop: 8 },
  fileName: { fontSize: 12, marginTop: 10 },
  notes: { borderRadius: 17, padding: 16, marginTop: 14 },
  notesLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  notesText: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  info: { flexDirection: 'row', gap: 10, padding: 15, borderWidth: 1, borderRadius: 16, marginTop: 24 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
});