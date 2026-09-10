import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSection } from '@/components/GlassSection';
import { useColors } from '@/hooks/useColors';
import { calculateCylinderLayout, type CalculatorDirection } from '@/utils/cylinderCalculator';
import { track } from '@/utils/analytics';

function numberValue(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function CalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [labelWidth, setLabelWidth] = useState('');
  const [labelHeight, setLabelHeight] = useState('');
  const [cylinderWidth, setCylinderWidth] = useState('');
  const [gap, setGap] = useState('2');
  const [repeat, setRepeat] = useState('');
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState<CalculatorDirection>('across');
  const result = calculateCylinderLayout({
    cylinderWidth: numberValue(cylinderWidth) ?? 0,
    labelWidth: numberValue(labelWidth) ?? 0,
    labelHeight: numberValue(labelHeight) ?? 0,
    gap: numberValue(gap) ?? -1,
    repeat: numberValue(repeat),
    quantity: numberValue(quantity),
    direction,
  });

  const useInOrder = () => {
    if (!result) return;
    track('calculator_completed', { totalPerRepeat: result.totalPerRepeat });
    const calculatorData = encodeURIComponent(JSON.stringify({
      productKey: 'magnetic',
      values: { repeat: String(numberValue(repeat) ?? result.usedRepeat), label_width: labelWidth, label_height: labelHeight, gap, cylinder_width: cylinderWidth },
    }));
    router.push(`/new-order?calculator=${calculatorData}`);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={20} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Назад</Text></Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>CYLINDER CALCULATOR</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Калькулятор раскладки</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>Введите размеры в миллиметрах. Расчёт ориентировочный и помогает подготовить заявку, а не заменяет проверку менеджера.</Text>
        <GlassSection style={styles.form}>
          <Input label="Ширина этикетки, мм" value={labelWidth} onChangeText={setLabelWidth} colors={colors} />
          <Input label="Высота этикетки, мм" value={labelHeight} onChangeText={setLabelHeight} colors={colors} />
          <Input label="Рабочая ширина цилиндра, мм" value={cylinderWidth} onChangeText={setCylinderWidth} colors={colors} />
          <Input label="Gap между этикетками, мм" value={gap} onChangeText={setGap} colors={colors} />
          <Input label="Repeat / окружность, мм" value={repeat} onChangeText={setRepeat} colors={colors} />
          <Input label="Количество этикеток (необязательно)" value={quantity} onChangeText={setQuantity} colors={colors} />
          <Text style={[styles.label, { color: colors.foreground }]}>Направление раскладки</Text>
          <View style={styles.directionRow}>
            {(['across', 'around'] as const).map((item) => (
              <Pressable key={item} onPress={() => setDirection(item)} style={[styles.direction, { borderColor: direction === item ? colors.primary : colors.border, backgroundColor: direction === item ? colors.accentSoft : colors.surfaceGlass }]}>
                <Text style={[styles.directionText, { color: colors.foreground }]}>{item === 'across' ? 'По ширине' : 'По окружности'}</Text>
              </Pressable>
            ))}
          </View>
        </GlassSection>
        {result ? (
          <GlassSection style={styles.result}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Результат раскладки</Text>
            <View style={styles.layout}><View style={[styles.layoutBox, { borderColor: colors.primary }]}><View style={[styles.labelTile, { backgroundColor: colors.primary }]} /><View style={[styles.labelTile, { backgroundColor: colors.primary }]} /><View style={[styles.labelTile, { backgroundColor: colors.primary }]} /></View></View>
            <Metric label="Этикеток по ширине" value={String(result.labelsAcross)} colors={colors} />
            <Metric label="Этикеток по окружности" value={String(result.labelsAround)} colors={colors} />
            <Metric label="Всего на repeat" value={String(result.totalPerRepeat)} colors={colors} />
            {result.requiredRepeats ? <Metric label="Необходимое число repeat" value={String(result.requiredRepeats)} colors={colors} /> : null}
            <Metric label="Свободное поле" value={`${result.freeWidth.toFixed(2)} мм / ${result.freeRepeat.toFixed(2)} мм`} colors={colors} />
            <Metric label="Эффективность" value={`${result.efficiency.toFixed(1)}%`} colors={colors} />
            <Text style={[styles.note, { color: colors.mutedForeground }]}>{result.note} {result.recommendation}</Text>
            <Pressable accessibilityRole="button" onPress={useInOrder} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Использовать в заявке</Text><Feather name="arrow-right" size={17} color={colors.primaryForeground} /></Pressable>
          </GlassSection>
        ) : (
          <GlassSection style={styles.empty}><Feather name="sliders" size={22} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Введите размеры</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Нужны ширина, высота и gap. Repeat уточняет расчёт окружности.</Text></GlassSection>
        )}
      </View>
    </ScrollView>
  );
}

function Input({ label, value, onChangeText, colors }: { label: string; value: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.inputWrap}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput keyboardType="decimal-pad" value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceGlass, borderColor: colors.border }]} /></View>;
}

function Metric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.metric, { borderBottomColor: colors.border }]}><Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  back: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: '700' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  form: { borderRadius: 18, padding: 16 },
  inputWrap: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 },
  directionRow: { flexDirection: 'row', gap: 8 },
  direction: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  directionText: { fontSize: 12, fontWeight: '700' },
  result: { borderRadius: 18, padding: 16, marginTop: 14 },
  resultTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  layout: { alignItems: 'center', marginBottom: 12 },
  layoutBox: { width: '82%', height: 70, borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  labelTile: { width: 35, height: 42, borderRadius: 3 },
  metric: { minHeight: 38, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metricLabel: { fontSize: 12, flex: 1 },
  metricValue: { fontSize: 13, fontWeight: '800' },
  note: { fontSize: 11, lineHeight: 17, marginTop: 12 },
  primaryButton: { minHeight: 48, borderRadius: 14, marginTop: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 13, fontWeight: '800' },
  empty: { borderRadius: 18, padding: 24, marginTop: 14, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
});
