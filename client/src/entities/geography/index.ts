// Типы
export type { Region, City, District, GeoNode, GeoSelectOption } from './model';

// Утилиты
export { toSelectOption } from './lib';

// Хуки для данных
export { useRegions, useCities, useDistricts } from './api';

// Хуки для UI
export { useRegionOptions, useCityOptions, useDistrictOptions } from './api';

// Query keys (нужны для инвалидации в features)
export { geoKeys } from './api';
