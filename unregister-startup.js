#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

console.log('\n  ▲ IMS — Otomatik başlatmayı kaldır\n');

try {
  execSync('schtasks /delete /tn "IMS-AutoStart" /f', { stdio: 'pipe' });
  console.log('  ✓ Otomatik başlatma kaldırıldı.');
  console.log('    IMS artık bilgisayar açılışında başlamayacak.\n');
} catch {
  console.log('  ⚠  Görev bulunamadı veya silinemedi.');
  console.log('     Zaten kaldırılmış olabilir.\n');
}
