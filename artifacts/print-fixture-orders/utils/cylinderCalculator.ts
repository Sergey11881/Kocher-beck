export type CalculatorDirection = 'across' | 'around';

export interface CylinderCalculatorInput {
  cylinderWidth: number;
  labelWidth: number;
  labelHeight: number;
  gap: number;
  horizontalGap?: number;
  verticalGap?: number;
  repeat?: number;
  quantity?: number;
  direction: CalculatorDirection;
}

export interface CylinderCalculation {
  labelsAcross: number;
  labelsAround: number;
  totalPerRepeat: number;
  usedWidth: number;
  usedRepeat: number;
  freeWidth: number;
  freeRepeat: number;
  efficiency: number;
  requiredRepeats?: number;
  recommendation: string;
  hasEnoughInput: boolean;
  note: string;
  alternatives: Array<{ title: string; repeat: number; efficiency: number; free: number }>;
}

function positive(value?: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function calculateCylinderLayout(input: CylinderCalculatorInput): CylinderCalculation | null {
  if (!positive(input.cylinderWidth) || !positive(input.labelWidth) || !positive(input.labelHeight) || input.gap < 0) return null;
  const acrossSize = input.direction === 'across' ? input.labelWidth : input.labelHeight;
  const aroundSize = input.direction === 'across' ? input.labelHeight : input.labelWidth;
  const acrossGap = input.horizontalGap ?? input.gap;
  const aroundGap = input.verticalGap ?? input.gap;
  const pitchAcross = acrossSize + acrossGap;
  const pitchAround = aroundSize + aroundGap;
  const repeat = positive(input.repeat) ? input.repeat : pitchAround;
  const labelsAcross = Math.max(1, Math.floor(input.cylinderWidth / pitchAcross));
  const labelsAround = Math.max(1, Math.floor(repeat / pitchAround));
  const usedWidth = labelsAcross * pitchAcross - acrossGap;
  const usedRepeat = labelsAround * pitchAround - aroundGap;
  const freeWidth = Math.max(0, input.cylinderWidth - usedWidth);
  const freeRepeat = Math.max(0, repeat - usedRepeat);
  const totalPerRepeat = labelsAcross * labelsAround;
  const area = input.cylinderWidth * repeat;
  const usedArea = usedWidth * usedRepeat;
  const base = {
    labelsAcross,
    labelsAround,
    totalPerRepeat,
    usedWidth,
    usedRepeat,
    freeWidth,
    freeRepeat,
    efficiency: Math.min(100, Math.max(0, (usedArea / area) * 100)),
    requiredRepeats: positive(input.quantity) ? Math.ceil(input.quantity / totalPerRepeat) : undefined,
    recommendation: `Расчётная рекомендация: цилиндр с рабочей шириной ${input.cylinderWidth.toFixed(2)} мм и repeat ${repeat.toFixed(2)} мм.`,
    hasEnoughInput: positive(input.repeat),
    note: input.repeat
      ? 'Расчёт ориентировочный. Точный цилиндр подтверждается менеджером по машине, Z и чертежу.'
      : 'Введите repeat цилиндра, чтобы получить точную раскладку.',
  };
  const alternatives = [
    { title: 'Максимальная эффективность', repeat, efficiency: base.efficiency, free: base.freeWidth + base.freeRepeat },
    { title: 'Минимальный остаток', repeat: usedRepeat, efficiency: base.efficiency, free: base.freeWidth },
    { title: 'Ближайший repeat', repeat: pitchAround * labelsAround, efficiency: base.efficiency, free: base.freeRepeat },
  ];
  return { ...base, alternatives };
}
