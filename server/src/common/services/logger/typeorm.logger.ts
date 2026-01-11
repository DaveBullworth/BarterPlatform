import { Logger } from 'typeorm';
import { dbLogger } from './logger.scopes';

export class TypeOrmLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    dbLogger.info(
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
    dbLogger.error(
      `SQL ERROR: ${error} -- query: ${query} -- params: ${JSON.stringify(parameters ?? [])}`,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    dbLogger.warn(
      `SLOW QUERY (${time}ms): ${query} -- params: ${JSON.stringify(parameters ?? [])}`,
    );
  }

  logSchemaBuild(message: string) {
    dbLogger.info(`SCHEMA BUILD: ${message}`);
  }

  logMigration(message: string) {
    dbLogger.info(`MIGRATION: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    if (level === 'warn') dbLogger.warn(message);
    else dbLogger.info(message);
  }
}
