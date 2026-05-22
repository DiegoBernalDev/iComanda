export type ReportPreset = 'today' | 'week' | 'month' | 'custom';

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const todayIso = () => toIsoDate(new Date());

const startOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return toIsoDate(date);
};

const startOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return toIsoDate(date);
};

export function getRangeForPreset(preset: ReportPreset) {
  if (preset === 'today') return { from: todayIso(), to: todayIso() };
  if (preset === 'week') return { from: startOfWeek(), to: todayIso() };
  if (preset === 'month') return { from: startOfMonth(), to: todayIso() };
  return { from: '', to: '' };
}
