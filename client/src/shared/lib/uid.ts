/**
 * Безопасный генератор id. `crypto.randomUUID()` доступен только в secure
 * context (https/localhost) — на телефоне по http LAN-IP его нет. Поэтому
 * фолбэчимся на `crypto.getRandomValues` (он работает и в insecure context),
 * а в самом крайнем случае — на не-криптостойкий вариант.
 *
 * Используется для локальных ключей (например, новых изображений формы),
 * криптостойкость тут не критична.
 */
export const uid = (): string => {
  const c = globalThis.crypto;

  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};
