export {
  TAXONOMY_TARGET_TYPES,
  PREFERENCE_WEIGHTS,
  UserPreferenceSchema,
  UserPreferencesListSchema,
  preferenceKey,
  type TaxonomyTargetType,
  type PreferenceWeight,
  type UserPreference,
  type UserPreferencesList,
} from './model';

export {
  userPreferencesApi,
  userPreferencesKeys,
  useUserPreferences,
  useReplaceUserPreferences,
  useResetUserPreferences,
  useSelectAllUserPreferences,
} from './api';
