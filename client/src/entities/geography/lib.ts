import type { GeoNode, GeoSelectOption } from './model';

// Утилита конвертации — чистая функция, легко тестировать
export const toSelectOption = (node: GeoNode): GeoSelectOption => ({
  value: String(node.id),
  label: node.name,
});
