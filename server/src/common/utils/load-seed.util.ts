import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadSeed<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(process.cwd(), filename), 'utf8')) as T[];
}
