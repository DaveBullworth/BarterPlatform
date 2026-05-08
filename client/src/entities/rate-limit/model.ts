export type RateLimitState = {
  rateLimited: boolean;
  retryIn: number | null;
};
