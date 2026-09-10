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

function toMillimeters(value: string, unit: 'mm' | 'in') {
  const parsed = numberValue(value);
  return parsed === undefined ? undefined : unit === 'in' ? parsed * 25.4 : parsed;
}

export default function CalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [labelWidth, setLabelWidth] = useState('');
  const [labelHeight, setLabelHeight] = useState('');
  const [cylinderWidth, setCylinderWidth] = useState('');
  const [horizontalGap, setHorizontalGap] = useState('2');
  const [verticalGap, setVerticalGap] = useState('2');
  const [repeat, setRepeat] = useState('');
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState<CalculatorDirection>('across');
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const unitLabel = unit === 'mm' ? 'мм' : 'дюймы';
  const result = calculateCylinderLayout({
    cylinderWidth: toMillimeters(cylinderWidth, unit) ?? 0,
    labelWidth: toMillimeters(labelWidth, unit) ?? 0,
    labelHeight: toMillimeters(labelHeight, unit) ?? 0,
    gap: Math.max(toMillimeters(horizontalGap, unit) ?? -1, toMillimeters(verticalGap, unit) ?? -1),
    horizontalGap: toMillimeters(horizontalGap, unit),
    verticalGap: toMillimeters(verticalGap, unit),
    repeat: toMillimeters(repeat, unit),
    quantity: numberValue(quantity),
    direction,
  });

  const useInOrder = () => {
    if (!result) return;
    track('calculator_completed', { totalPerRepeat: result.totalPerRepeat });
    const calculatorData = encodeURIComponent(JSON.stringify({
      productKey: 'magnetic',
      values: {
        repeat: String(toMillimeters(repeat, unit) ?? result.usedRepeat),
        label_width: labelWidth,
        label_height: labelHeight,
        horizontal_gap: String(toMillimeters(horizontalGap, unit) ?? ''),
        vertical_gap: String(toMillimeters(verticalGap, unit) ?? ''),
        gap: String(toMillimeters(horizontalGap, unit) ?? ''),
        cylinder_width: String(toMillimeters(cylinderWidth, unit) ?? ''),
        labels_across: String(result.labelsAcross),
        labels_around: String(result.labelsAround),
        total_labels: String(result.totalPerRepeat),
        efficiency: result.efficiency.toFixed(2),
      },
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
          <View style={styles.unitRow}><Text style={[styles.label, { color: colors.foreground }]}>Единицы измерения</Text>{(['mm', 'in'] as const).map((item) => <Pressable key={item} onPress={() => setUnit(item)} style={[styles.unitButton, { borderColor: unit === item ? colors.primary : colors.border, backgroundColor: unit === item ? colors.accentSoft : colors.surfaceGlass }]}><Text style={[styles.directionText, { color: colors.foreground }]}>{item === 'mm' ? 'Миллиметры' : 'Дюймы'}</Text></Pressable>)}</View>
          <Input label={`Ширина этикетки, ${unitLabel}`} value={labelWidth} onChangeText={setLabelWidth} colors={colors} />
          <Input label={`Высота этикетки, ${unitLabel}`} value={labelHeight} onChangeText={setLabelHeight} colors={colors} />
          <Input label={`Рабочая ширина цилиндра, ${unitLabel}`} value={cylinderWidth} onChangeText={setCylinderWidth} colors={colors} />
          <Input label={`Горизонтальный gap, ${unitLabel}`} value={horizontalGap} onChangeText={setHorizontalGap} colors={colors} />
          <Input label={`Вертикальный gap, ${unitLabel}`} value={verticalGap} onChangeText={setVerticalGap} colors={colors} />
          <Input label={`Repeat / окружность, ${unitLabel}`} value={repeat} onChangeText={setRepeat} colors={colors} />
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
            <LayoutPreview columns={result.labelsAcross} rows={result.labelsAround} labelWidth={toMillimeters(labelWidth, unit) ?? 1} labelHeight={toMillimeters(labelHeight, unit) ?? 1} gap={result.freeWidth >= 0 ? Math.max(toMillimeters(horizontalGap, unit) ?? 0, toMillimeters(verticalGap, unit) ?? 0) : 0} colors={colors} />
            <Metric label="Этикеток по ширине" value={String(result.labelsAcross)} colors={colors} />
            <Metric label="Этикеток по окружности" value={String(result.labelsAround)} colors={colors} />
            <Metric label="Всего на repeat" value={String(result.totalPerRepeat)} colors={colors} />
            {result.requiredRepeats ? <Metric label="Необходимое число repeat" value={String(result.requiredRepeats)} colors={colors} /> : null}
            <Metric label="Свободное поле" value={`${result.freeWidth.toFixed(2)} мм / ${result.freeRepeat.toFixed(2)} мм`} colors={colors} />
            <Metric label="Эффективность" value={`${result.efficiency.toFixed(1)}%`} colors={colors} />
            <Text style={[styles.recommendationTitle, { color: colors.foreground }]}>Рекомендуемый цилиндр</Text>
            <Text style={[styles.note, { color: colors.mutedForeground }]}>{result.recommendation}</Text>
            {result.alternatives.map((alternative) => <Metric key={alternative.title} label={alternative.title} value={`${alternative.repeat.toFixed(2)} мм · ${alternative.efficiency.toFixed(1)}%`} colors={colors} />)}
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

function LayoutPreview({ columns, rows, labelWidth, labelHeight, gap, colors }: { columns: number; rows: number; labelWidth: number; labelHeight: number; gap: number; colors: ReturnType<typeof useColors> }) {
  const visibleColumns = Math.min(columns, 12);
  const visibleRows = Math.min(rows, 8);
  const tiles = Array.from({ length: visibleColumns * visibleRows }, (_, index) => index);
  const aspect = Math.max(0.35, Math.min(3, labelWidth / labelHeight));
  return <View style={[styles.layoutBox, { borderColor: colors.primary }]}>
    <View style={styles.previewGrid}>{tiles.map((tile) => <View key={tile} style={[styles.labelTile, { backgroundColor: colors.primary, aspectRatio: aspect, margin: Math.min(8, Math.max(1, gap * 0.7)) }]} />)}</View>
    {(columns > visibleColumns || rows > visibleRows) ? <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>Показано {visibleColumns * visibleRows} из {columns * rows} этикеток</Text> : null}
  </View>;
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
  unitRow: { marginBottom: 14 },
  unitButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  direction: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  directionText: { fontSize: 12, fontWeight: '700' },
  result: { borderRadius: 18, padding: 16, marginTop: 14 },
  resultTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  layout: { alignItems: 'center', marginBottom: 12 },
  layoutBox: { width: '100%', minHeight: 150, borderWidth: 1, borderRadius: 10, padding: 10 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', flex: 1 },
  labelTile: { minWidth: 10, maxWidth: 42, minHeight: 10, maxHeight: 42, borderRadius: 3 },
  previewHint: { fontSize: 10, textAlign: 'center', marginTop: 6 },
  metric: { minHeight: 38, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metricLabel: { fontSize: 12, flex: 1 },
  metricValue: { fontSize: 13, fontWeight: '800' },
  note: { fontSize: 11, lineHeight: 17, marginTop: 12 },
  recommendationTitle: { fontSize: 14, fontWeight: '800', marginTop: 16 },
  primaryButton: { minHeight: 48, borderRadius: 14, marginTop: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 13, fontWeight: '800' },
  empty: { borderRadius: 18, padding: 24, marginTop: 14, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
});
