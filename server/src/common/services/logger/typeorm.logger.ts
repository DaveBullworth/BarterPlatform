import { Logger } from 'typeorm';
import logger from './logger'; // твой Winston логгер

export class TypeOrmLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    logger.info(
      `SQL QUERY: ${query} -- params: ${JSON.stringify(parameters ?? [])}`,
    );
  }

  /*
    На будущее когда будет логироваться только CUD операции

    logQuery(query: string, parameters?: any[]) {
      if (/INSERT|UPDATE|DELETE/i.test(query)) {
        logger.info(`CUD SQL: ${query} -- params: ${JSON.stringify(parameters ?? [])}`);
      }
    }

  */

  logQueryError(error: string | Error, query: string, parameters?: any[]) {
    logger.error(
      `SQL ERROR: ${error} -- query: ${query} -- params: ${JSON.stringify(parameters ?? [])}`,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    logger.warn(
      `SLOW QUERY (${time}ms): ${query} -- params: ${JSON.stringify(parameters ?? [])}`,
    );
  }

  logSchemaBuild(message: string) {
    logger.info(`SCHEMA BUILD: ${message}`);
  }

  logMigration(message: string) {
    logger.info(`MIGRATION: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    if (level === 'warn') logger.warn(message);
    else logger.info(message);
  }
}
