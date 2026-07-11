import { FileScanner, FileScanResult } from './file-scanner.interface';

/**
 * Заглушка сканера: используется, когда антивирус отключён (ANTIVIRUS_ENABLED не
 * задан). Позволяет работать в dev и полностью offline без запущенного демона.
 * Всегда возвращает `skipped` — файл сохраняется как не проверенный.
 */
export class NoopFileScanner implements FileScanner {
  scan(): Promise<FileScanResult> {
    return Promise.resolve({ status: 'skipped' });
  }
}
