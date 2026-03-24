#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────
const ok   = (msg) => console.log(`  ✓ ${msg}`);
const info = (msg) => console.log(`  → ${msg}`);
const fail = (msg) => { console.error(`\n  ✗ ${msg}\n`); process.exit(1); };

function run(cmd, cwd) {
  execSync(cmd, { stdio: 'inherit', cwd: cwd || ROOT });
}

// ── 1. Node.js version check ────────────────────────────────────────────────
function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 18) {
    fail(`Node.js ${process.version} çok eski. Node.js 18+ gerekli.\n     https://nodejs.org adresinden güncelleyin.`);
  }
  ok(`Node.js ${process.version}`);
}

// ── 2. Create env files ─────────────────────────────────────────────────────
function setupEnvFiles() {
  const envMappings = [
    { src: 'backend/.env.example',            dest: 'backend/.env' },
    { src: 'frontend/.env.local.example',     dest: 'frontend/.env.local' },
    { src: 'public-app/.env.local.example',   dest: 'public-app/.env.local' },
  ];

  for (const { src, dest } of envMappings) {
    const srcPath  = path.join(ROOT, src);
    const destPath = path.join(ROOT, dest);

    if (fs.existsSync(destPath)) {
      ok(`${dest} zaten mevcut — atlanıyor`);
      continue;
    }

    if (!fs.existsSync(srcPath)) {
      info(`${src} bulunamadı — atlanıyor`);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);

    // Generate random JWT_SECRET for backend/.env
    if (dest === 'backend/.env') {
      const secret = crypto.randomBytes(36).toString('base64');
      let content = fs.readFileSync(destPath, 'utf8');
      content = content.replace(
        'JWT_SECRET="change-this-to-a-secure-random-string"',
        `JWT_SECRET="${secret}"`
      );
      fs.writeFileSync(destPath, content, 'utf8');
    }

    ok(`${dest} oluşturuldu`);
  }
}

// ── 3. Install dependencies ─────────────────────────────────────────────────
function installDependencies() {
  const dirs = ['.', 'backend', 'frontend', 'public-app'];

  for (const dir of dirs) {
    const label = dir === '.' ? 'root' : dir;
    const cwd = path.join(ROOT, dir);

    info(`[${label}] npm install...`);
    run('npm install --prefer-offline', cwd);
    ok(`${label} bağımlılıkları yüklendi`);
  }
}

// ── 4. Database migration ───────────────────────────────────────────────────
function runMigrations() {
  info('Veritabanı migration çalıştırılıyor...');
  run('npx prisma migrate deploy', path.join(ROOT, 'backend'));
  ok('Migration tamamlandı');
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('\n  ▲ IMS — Inventory Management System Setup\n');

checkNodeVersion();
console.log('');

console.log('  Ortam dosyaları hazırlanıyor...');
setupEnvFiles();
console.log('');

console.log('  Bağımlılıklar yükleniyor...');
installDependencies();
console.log('');

runMigrations();

console.log('');
console.log('  ✓ Kurulum tamamlandı!');
console.log('');
console.log('  Uygulamayı başlatmak için:');
console.log('    npm run dev');
console.log('');
console.log('  Durdurmak için: Ctrl+C');
console.log('');
console.log('  Admin Panel:  http://localhost:3001');
console.log('  Public App:   http://localhost:3002');
console.log('  API:          http://localhost:4000');
console.log('');
