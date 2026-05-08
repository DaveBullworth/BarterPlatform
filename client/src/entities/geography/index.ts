// Типы
export type {
  Region,
  City,
  District,
  GeoNode,
  GeoSelectOption,
  GeoValue,
} from './model';

// Утилиты
export { toSelectOption } from './lib';

// Хуки для данных
export {
  useRegions,
  useCities,
  useDistricts,
  useAllCities,
  useAllDistricts,
} from './api';

// Хуки для UI
export {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
  useAllCityOptions,
  useAllDistrictOptions,
} from './api';

// Query keys (нужны для инвалидации в features)
export { geoKeys } from './api';

// UI
export { GeoSelector } from './ui/GeoSelector';
