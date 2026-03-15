import fs from 'fs'
import path from 'path'

// Resolve DB path relative to the prisma schema directory (backend/prisma/)
// DATABASE_URL "file:./dev.db" → backend/prisma/dev.db
const DB_PATH = (function () {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  const filePath = url.replace(/^file:/, '')
  if (path.isAbsolute(filePath)) return filePath
  // __dirname = backend/src/services → ../../prisma = backend/prisma
  const schemaDir = path.join(__dirname, '..', '..', 'prisma')
  return path.resolve(schemaDir, filePath)
})()

export function downloadBackup(): Buffer {
  if (!fs.existsSync(DB_PATH)) {
    throw { status: 500, message: `Database file not found at: ${DB_PATH}` }
  }
  return fs.readFileSync(DB_PATH)
}

export function restoreBackup(fileBuffer: Buffer): void {
  const magic = fileBuffer.slice(0, 6).toString('ascii')
  if (magic !== 'SQLite') throw { status: 400, message: 'Invalid SQLite file' }

  const safePath = DB_PATH.replace('.db', `-pre-restore-${Date.now()}.db`)
  fs.copyFileSync(DB_PATH, safePath)
  fs.writeFileSync(DB_PATH, fileBuffer)
}
