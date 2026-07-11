import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileScanner, FileScanResult } from './file-scanner.interface';
import { NoopFileScanner } from './noop-file-scanner';
import { ClamAvFileScanner } from './clamav-file-scanner';

/**
 * Фасад антивирусной проверки. Выбирает реализацию по конфигурации:
 *   ANTIVIRUS_ENABLED=true → ClamAV (CLAMAV_HOST/CLAMAV_PORT),
 *   иначе                  → no-op (файлы помечаются `skipped`).
 *
 * `enabled` доступен наружу, чтобы доменный код решал, как трактовать `error`:
 * при включённом антивирусе сбой проверки = отказ (fail-closed), при выключенном
 * проверки нет вовсе.
 */
@Injectable()
export class FileScanService {
  private readonly logger = new Logger(FileScanService.name);
  private readonly scanner: FileScanner;
  readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.enabled =
      String(config.get('ANTIVIRUS_ENABLED')).toLowerCase() === 'true';

    if (this.enabled) {
      const host = config.get<string>('CLAMAV_HOST') ?? 'clamav';
      const port = Number(config.get('CLAMAV_PORT')) || 3310;
      this.scanner = new ClamAvFileScanner(host, port);
      this.logger.log(`Antivirus enabled (ClamAV ${host}:${port})`);
    } else {
      this.scanner = new NoopFileScanner();
      this.logger.log('Antivirus disabled — chat file scanning skipped');
    }
  }

  scan(buffer: Buffer): Promise<FileScanResult> {
    return this.scanner.scan(buffer);
  }
}
