export const toothModules = {
  'C.P.': 3.175,
  'D.P.': 2.49364,
} as const;

export type ToothModule = keyof typeof toothModules;

export function calculateRepeat(teethValue: string, mode: string): string {
  const teeth = Number.parseFloat(teethValue.replace(',', '.'));
  const module = toothModules[mode as ToothModule];
  if (!Number.isFinite(teeth) || teeth <= 0 || !module) return '';
  return `${(teeth * module).toFixed(5).replace(/\.?0+$/, '')} мм`;
}

export function isPositiveNumber(value: string): boolean {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0;
}
