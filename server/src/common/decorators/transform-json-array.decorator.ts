import { Transform, plainToInstance } from 'class-transformer';

export function TransformJsonArray<T>(cls: new () => T) {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return [];

    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      const mapped = parsed.map((item) => plainToInstance(cls, item));
      return mapped;
    } catch {
      return [];
    }
  });
}
