import { readFileSync } from 'node:fs'
import { validateCatalog } from '../../src/lib/catalog-import'
export * from '../../src/lib/catalog-import'

export function readCatalog(file: string) {
  return validateCatalog(JSON.parse(readFileSync(file, 'utf8')))
}
