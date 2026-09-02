import { Feather } from '@expo/vector-icons';
import { getGetOrderQueryKey, useGetOrder } from '@workspace/api-client-react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CreatorCredit } from '@/components/CreatorCredit';

export default function OrderDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderId = Number(rawId);
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
        <Pressable onPress={() => router.replace('/')}><Text style={[styles.link, { color: colors.primary }]}>На главную</Text></Pressable>
      </View>
    );
  }

  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(order.created_at));
  const dataRows = Object.entries(order.data).filter(([key, value]) => key !== '__file_fields' && value);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable testID="back-from-order" onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>Детали заявки</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.content}>
        <View style={[styles.status, { backgroundColor: colors.accent }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.accentForeground }]} />
          <Text style={[styles.statusText, { color: colors.accentForeground }]}>Заявка принята</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{order.order_number}</Text>
        <Text style={[styles.productName, { color: colors.primary }]}>{order.product_name}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>Создана {date}</Text>

        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DetailRow label="Компания / заказчик" value={order.client} colors={colors} />
          <DetailRow label="Контактное лицо" value={order.contact} colors={colors} />
          {dataRows.map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} colors={colors} />
          ))}
        </View>

        {order.files.length > 0 ? (
          <View style={[styles.files, { backgroundColor: colors.secondary }]}>
            <View style={styles.filesHeader}>
              <Feather name="paperclip" size={17} color={colors.secondaryForeground} />
              <Text style={[styles.filesLabel, { color: colors.secondaryForeground }]}>Прикреплено файлов: {order.files.length}</Text>
            </View>
            <Text style={[styles.filesHint, { color: colors.mutedForeground }]}>Файлы сохранены на сервере типографии вместе с заявкой.</Text>
          </View>
        ) : null}

        {order.comment ? (
          <View style={[styles.notes, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.notesLabel, { color: colors.secondaryForeground }]}>Комментарий</Text>
            <Text style={[styles.notesText, { color: colors.secondaryForeground }]}>{order.comment}</Text>
          </View>
        ) : null}

        <View style={[styles.info, { borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Менеджер свяжется с вами, чтобы подтвердить детали и сроки изготовления.</Text>
        </View>
        <CreatorCredit />
      </View>
    </ScrollView>
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
  link: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  screen: { flex: 1 },
  topBar: { height: 52, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  status: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', marginTop: 17, marginBottom: 6 },
  productName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 25 },
  detailsCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
  row: { minHeight: 51, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, borderBottomWidth: 1 },
  rowLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  rowValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1.2, textAlign: 'right' },
  files: { borderRadius: 17, padding: 16, marginTop: 14 },
  filesHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  filesLabel: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  filesHint: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', marginTop: 8 },
  notes: { borderRadius: 17, padding: 16, marginTop: 14 },
  notesLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  notesText: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  info: { flexDirection: 'row', gap: 10, padding: 15, borderWidth: 1, borderRadius: 16, marginTop: 24 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
});