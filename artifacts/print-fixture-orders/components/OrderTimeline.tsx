import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getOrderStatusLabel } from '@/utils/orderStatus';

type TimelineProps = {
  status?: string;
};

const stages = [
  { key: 'received', label: 'Получен', icon: 'inbox' as const },
  { key: 'production', label: 'В производстве', icon: 'tool' as const },
  { key: 'ready', label: 'Готов', icon: 'check-circle' as const },
  { key: 'shipped', label: 'Отправлен', icon: 'truck' as const },
];

function stageIndex(status?: string) {
  const value = getOrderStatusLabel(status).toLowerCase();
  if (/отправ|достав/.test(value)) return 3;
  if (/готов|заверш|отгруз/.test(value)) return 2;
  if (/производ|работ|соглас/.test(value)) return 1;
  return 0;
}

export function OrderTimeline({ status }: TimelineProps) {
  const colors = useColors();
  const currentIndex = stageIndex(status);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Статус заказа</Text>
      {stages.map((stage, index) => {
        const reached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={stage.key} style={styles.item}>
            <View style={styles.markerColumn}>
              <View style={[styles.marker, { backgroundColor: reached ? colors.primary : colors.surfaceElevated, borderColor: reached ? colors.primary : colors.border }]}>
                <Feather name={stage.icon} size={14} color={reached ? colors.primaryForeground : colors.mutedForeground} />
              </View>
              {index < stages.length - 1 ? <View style={[styles.connector, { backgroundColor: index < currentIndex ? colors.primary : colors.border }]} /> : null}
            </View>
            <View style={styles.copy}>
              <Text style={[styles.label, { color: isCurrent ? colors.foreground : reached ? colors.mutedForeground : colors.mutedForeground }]}>{stage.label}</Text>
              <Text style={[styles.state, { color: isCurrent ? colors.primary : colors.mutedForeground }]}>
                {isCurrent ? 'Текущий этап' : reached ? 'Этап пройден' : 'Ожидает'}
              </Text>
            </View>
          </View>
        );
      })}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        История отдельных изменений статуса пока не хранится в API.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 14 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  item: { flexDirection: 'row', minHeight: 50 },
  markerColumn: { width: 32, alignItems: 'center' },
  marker: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  connector: { width: 2, flex: 1, marginVertical: 3 },
  copy: { flex: 1, paddingLeft: 10, paddingTop: 2 },
  label: { fontSize: 13, fontWeight: '800' },
  state: { fontSize: 11, marginTop: 3 },
  note: { fontSize: 11, lineHeight: 16, marginTop: 6 },
});
