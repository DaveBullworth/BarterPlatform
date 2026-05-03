export const LOADING_REASON = {
  RATE_LIMIT: 'RATE_LIMIT',
  BOOTSTRAP: 'BOOTSTRAP',
} as const;

export type LoadingReason =
  | (typeof LOADING_REASON)[keyof typeof LOADING_REASON]
  | null;
