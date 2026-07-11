import * as net from 'node:net';

import { Logger } from '@nestjs/common';

import { FileScanner, FileScanResult } from './file-scanner.interface';

/**
 * Реализация на базе clamd (ClamAV daemon) по протоколу INSTREAM поверх TCP —
 * без внешних npm-зависимостей (важно для offline-сборки), на голом `node:net`.
 *
 * Протокол: команда `zINSTREAM\0`, далее куски в формате
 * `<4-байта BE длина><данные>`, завершаемые куском нулевой длины.
 * ВАЖНО: ответ на `z`-команды терминируется NUL-байтом (`stream: OK\0`),
 * поэтому парсим по разделителю `\0`, не полагаясь на trim()/конец соединения.
 */
export class ClamAvFileScanner implements FileScanner {
  private readonly logger = new Logger(ClamAvFileScanner.name);

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly timeoutMs = 30_000,
  ) {}

  scan(buffer: Buffer): Promise<FileScanResult> {
    return new Promise<FileScanResult>((resolve) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      const chunks: Buffer[] = [];
      let settled = false;

      const finish = (result: FileScanResult): void => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };

      const parseReply = (): void => {
        const response = Buffer.concat(chunks)
          .toString('utf8')
          .replace(/\0/g, '')
          .trim();

        if (/FOUND$/.test(response)) {
          const signature = response
            .replace(/^stream:\s*/i, '')
            .replace(/\s*FOUND$/i, '');
          this.logger.warn(`ClamAV: threat found — ${signature}`);
          finish({ status: 'infected', signature });
        } else if (/\bOK$/.test(response)) {
          finish({ status: 'clean' });
        } else {
          this.logger.warn(
            `ClamAV: unexpected reply "${response || '<empty>'}"`,
          );
          finish({ status: 'error' });
        }
      };

      socket.setTimeout(this.timeoutMs);
      socket.on('timeout', () => {
        this.logger.warn(
          `ClamAV: scan timed out after ${this.timeoutMs} ms (${this.host}:${this.port})`,
        );
        finish({ status: 'error' });
      });
      socket.on('error', (err) => {
        this.logger.warn(
          `ClamAV: connection error to ${this.host}:${this.port} — ${err.message}`,
        );
        finish({ status: 'error' });
      });
      socket.on('data', (data) => {
        chunks.push(data);
        // NUL-байт = конец ответа z-команды; не ждём закрытия соединения.
        if (data.includes(0)) parseReply();
      });
      socket.on('end', parseReply);

      socket.on('connect', () => {
        socket.write('zINSTREAM\0');
        const size = Buffer.alloc(4);
        size.writeUInt32BE(buffer.length, 0);
        socket.write(size);
        socket.write(buffer);
        socket.write(Buffer.from([0, 0, 0, 0])); // кусок нулевой длины = конец
      });
    });
  }
}
