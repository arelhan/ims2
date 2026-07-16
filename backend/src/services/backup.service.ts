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

const MAX_PRE_RESTORE_BACKUPS = 5

export function downloadBackup(): Buffer {
  if (!fs.existsSync(DB_PATH)) {
    // Do not leak the absolute path to the client.
    console.error('[backup] database file missing at', DB_PATH)
    throw { status: 500, message: 'Backup is temporarily unavailable' }
  }
  return fs.readFileSync(DB_PATH)
}

// Keep only the most recent N pre-restore snapshots to avoid unbounded growth.
function pruneOldPreRestoreBackups() {
  const dir = path.dirname(DB_PATH)
  const base = path.basename(DB_PATH).replace(/\.db$/, '')
  const prefix = `${base}-pre-restore-`
  try {
    const snapshots = fs
      .readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.db'))
      .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)

    for (const stale of snapshots.slice(MAX_PRE_RESTORE_BACKUPS)) {
      try { fs.unlinkSync(path.join(dir, stale.f)) } catch { /* best effort */ }
    }
  } catch { /* directory unreadable — skip pruning */ }
}

export function restoreBackup(fileBuffer: Buffer): void {
  // SQLite files start with the 16-byte header string "SQLite format 3\0".
  const magic = fileBuffer.slice(0, 15).toString('ascii')
  if (magic !== 'SQLite format 3') {
    throw { status: 400, message: 'Invalid backup file. Please upload a .db file exported from this app.' }
  }

  // Snapshot the current DB before overwriting so a bad restore is recoverable.
  if (fs.existsSync(DB_PATH)) {
    const safePath = DB_PATH.replace(/\.db$/, `-pre-restore-${Date.now()}.db`)
    fs.copyFileSync(DB_PATH, safePath)
  }

  fs.writeFileSync(DB_PATH, fileBuffer)
  pruneOldPreRestoreBackups()
}
