import { Transform, TransformFnParams } from 'class-transformer';

export function TransformJsonObject<T extends object>() {
  return Transform(({ value }: TransformFnParams): T | undefined => {
    if (!value || typeof value !== 'string') return undefined;

    try {
      const parsed = JSON.parse(value) as unknown;

      // Проверяем, что это объект
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return undefined;
      }

      return parsed as T;
    } catch (err) {
      console.error('JSON parse failed:', err);
      return undefined;
    }
  });
}
