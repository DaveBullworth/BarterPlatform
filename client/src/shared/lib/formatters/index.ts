// Была shared/utils/formatCreatedAt.ts
export const formatDate = (value: string, locale = 'ru-RU'): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale);
};

// Форматирование даты для отображения в таблицах (dd.mm.yyyy)
export const formatDateShort = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return [
    date.getDate().toString().padStart(2, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getFullYear(),
  ].join('.');
};
