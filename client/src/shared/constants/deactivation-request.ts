export const DEACTIVATION_REQUEST = {
  SENT: 'sent',
  ALREADY_REQESTED: 'already_requested',
  USER_NOT_FOUND: 'user_not_found',
  ALREADY_DEACTIVATED: 'already_deactivated',
} as const;

export type DeactivationReqest =
  (typeof DEACTIVATION_REQUEST)[keyof typeof DEACTIVATION_REQUEST];
