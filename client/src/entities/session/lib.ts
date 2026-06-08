export type DeviceKind = 'mobile' | 'tablet' | 'desktop';

export interface ParsedUserAgent {
  kind: DeviceKind;
  os: string;
  browser: string;
  /** Готовая подпись "Chrome · Windows"; пустая строка, если ничего не распознано. */
  label: string;
}

/**
 * Лёгкий разбор User-Agent без зависимостей — достаточно, чтобы показать
 * пользователю «Chrome · Windows» и подобрать иконку устройства. Порядок
 * проверок важен (Edge до Chrome, Chrome до Safari).
 */
export const parseUserAgent = (
  ua: string | null | undefined,
): ParsedUserAgent => {
  const s = ua ?? '';

  let os = '';
  if (/Windows/i.test(s)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(s)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(s)) os = 'macOS';
  else if (/Android/i.test(s)) os = 'Android';
  else if (/Linux/i.test(s)) os = 'Linux';

  let browser = '';
  if (/Edg\//i.test(s)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(s)) browser = 'Opera';
  else if (/YaBrowser/i.test(s)) browser = 'Yandex';
  else if (/Firefox\//i.test(s)) browser = 'Firefox';
  else if (/Chrome\//i.test(s)) browser = 'Chrome';
  else if (/Safari\//i.test(s)) browser = 'Safari';

  let kind: DeviceKind = 'desktop';
  if (/iPad|Tablet/i.test(s)) kind = 'tablet';
  else if (/Mobi|Android|iPhone|iPod/i.test(s)) kind = 'mobile';

  const label = [browser, os].filter(Boolean).join(' · ');

  return { kind, os, browser, label };
};
