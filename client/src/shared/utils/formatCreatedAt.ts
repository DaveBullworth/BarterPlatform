export const formatCreatedAt = (value: string, locale = 'ru-RU') => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString(locale);
};
