#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const os = require('os');

console.log('\n  ▲ IMS — Servisleri durdur\n');

const isWin = os.platform() === 'win32';

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
    }
    console.log(`  ✓ Port ${port} temizlendi`);
  } catch {}
}

console.log('\n  ✓ Tüm servisler durduruldu.\n');
