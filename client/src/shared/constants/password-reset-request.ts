export const PASSWORD_RESET_REQUEST = {
  SENT: 'sent',
  ALREADY_REQESTED: 'already_requested',
} as const;

export type PasswordResetRequest =
  (typeof PASSWORD_RESET_REQUEST)[keyof typeof PASSWORD_RESET_REQUEST];
