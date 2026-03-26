#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT      = path.join(__dirname, '..');          // proje kökü
const PID_DIR   = path.join(ROOT, '.ims-run');
const PIDS_FILE = path.join(PID_DIR, 'pids.json');

console.log('\n  ▲ IMS — Servisleri durdur\n');

const isWin = os.platform() === 'win32';

if (fs.existsSync(PIDS_FILE)) {
  const pids = JSON.parse(fs.readFileSync(PIDS_FILE, 'utf8'));
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
} else {
  console.log('  ⚠  PID dosyası bulunamadı, portlar temizleniyor...');
}

// IMS portlarındaki süreçleri temizle (tüm platformlar)
for (const port of [3001, 3002, 4000]) {
  try {
    if (isWin) {
      const out = execSync(`netstat -ano | findstr ":${port} "`, { stdio: 'pipe' }).toString();
      for (const line of out.split('\n')) {
        const pid = line.trim().split(/\s+/).pop();
        if (/^\d+$/.test(pid) && pid !== '0') {
          try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch {}
        }
      }
    } else {
      execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: 'pipe' });
      console.log(`  ✓ Port ${port} temizlendi`);
    }
  } catch {}
}

try { fs.rmSync(PID_DIR, { recursive: true, force: true }); } catch {}

console.log('\n  ✓ Tüm servisler durduruldu.\n');
