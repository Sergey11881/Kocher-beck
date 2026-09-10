export function getOrderStatusLabel(status?: string) {
  const value = (status ?? '').toLowerCase();
  if (/отправ|достав/.test(value)) return 'Отправлен';
  if (/готов|заверш|отгруз/.test(value)) return 'Готов';
  if (/производ|работ/.test(value)) return 'В производстве';
  return 'Получен';
}
