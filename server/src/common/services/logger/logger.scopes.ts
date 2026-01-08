import logger from './logger';

export const httpLogger = logger.child({ scope: 'http' });
export const dbLogger = logger.child({ scope: 'db' });
export const redisLogger = logger.child({ scope: 'redis' });
export const authLogger = logger.child({ scope: 'auth' });
