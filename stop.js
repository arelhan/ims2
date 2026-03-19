#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT      = __dirname;
const PID_DIR   = path.join(ROOT, '.ims-run');
const PIDS_FILE = path.join(PID_DIR, 'pids.json');

console.log('\n  ▲ IMS — Servisleri durdur\n');

if (!fs.existsSync(PIDS_FILE)) {
  console.log('  ⚠  Arka planda çalışan bir IMS bulunamadı.');
  console.log('     (Terminal modunda çalışıyorsa Ctrl+C kullanın.)\n');
  process.exit(0);
}

const pids = JSON.parse(fs.readFileSync(PIDS_FILE, 'utf8'));
const isWin = os.platform() === 'win32';

console.log('  Servisler durduruluyor...');

for (const [name, pid] of Object.entries(pids)) {
  try {
    if (isWin) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'pipe' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    console.log(`  ✓ ${name} durduruldu`);
  } catch {
    console.log(`  - ${name} zaten durmuş`);
  }
}

// IMS portlarında kalan süreçleri temizle (sadece Windows)
if (isWin) {
  for (const port of [3001, 3002, 4000]) {
    try {
      const out = execSync(`netstat -ano | findstr ":${port} "`, { stdio: 'pipe' }).toString();
      for (const line of out.split('\n')) {
        const pid = line.trim().split(/\s+/).pop();
        if (/^\d+$/.test(pid) && pid !== '0') {
          try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch {}
        }
      }
    } catch {}
  }
}

try { fs.rmSync(PID_DIR, { recursive: true, force: true }); } catch {}

console.log('\n  ✓ Tüm servisler durduruldu.\n');
