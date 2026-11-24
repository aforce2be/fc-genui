import { appendFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Violation } from '../../app/genui/validate'

const LOG_DIR = resolve(process.cwd(), 'logs')
const LOG_FILE = resolve(LOG_DIR, 'genui-violations.jsonl')

export interface ViolationLogEntry {
  scenario: string
  device: string
  mode: string
  blocked: boolean
  violations: Violation[]
}

/** 검증 위반을 logs/genui-violations.jsonl에 한 줄씩 추가한다. 위반률은 품질 지표로 쓴다. */
export async function logViolations(entry: ViolationLogEntry): Promise<void> {
  if (entry.violations.length === 0) return
  await mkdir(LOG_DIR, { recursive: true })
  const line = JSON.stringify({ at: new Date().toISOString(), ...entry })
  await appendFile(LOG_FILE, `${line}\n`, 'utf8')
}
