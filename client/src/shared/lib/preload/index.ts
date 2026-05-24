/**
 * Registry для preload-функций страниц.
 * Регистрирует фабрики dynamic-import'ов в одном месте (app/router),
 * а триггерит их любой слой по строковому ключу — без знания о страницах.
 */
type Preloader = () => Promise<unknown>;

const preloaders = new Map<string, Preloader>();

export const registerPreloader = (key: string, fn: Preloader): void => {
  preloaders.set(key, fn);
};

/**
 * Запускает скачивание чанка по ранее зарегистрированному ключу.
 * Безопасно вызывать повторно — bundler кэширует импорты.
 */
export const preload = (key: string): void => {
  const fn = preloaders.get(key);
  if (fn) void fn();
};
