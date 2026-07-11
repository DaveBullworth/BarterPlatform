/**
 * Порт антивирусной проверки файлов (вложений чата). Доменный код знает только
 * этот интерфейс; конкретная реализация (no-op / ClamAV / иная) выбирается
 * FileScanService по конфигурации.
 */
export type FileScanStatus = 'clean' | 'infected' | 'skipped' | 'error';

export interface FileScanResult {
  status: FileScanStatus;
  /** Сигнатура угрозы, если файл заражён. */
  signature?: string;
}

export interface FileScanner {
  scan(buffer: Buffer): Promise<FileScanResult>;
}
