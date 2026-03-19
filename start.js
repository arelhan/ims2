#!/usr/bin/env node
'use strict';

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT    = __dirname;
const PID_DIR = path.join(ROOT, '.ims-run');
const PIDS_FILE = path.join(PID_DIR, 'pids.json');

const SERVICES = [
  { name: 'backend',    dir: 'backend' },
  { name: 'frontend',   dir: 'frontend' },
  { name: 'public-app', dir: 'public-app' },
];

// ── /background argümanıyla çağrılırsa (Task Scheduler) doğrudan başlat ──────
if (process.argv.includes('/background') || process.argv.includes('--background')) {
  startBackground(false);
  process.exit(0);
}

// ── Zaten çalışıyor mu? ───────────────────────────────────────────────────────
if (fs.existsSync(PIDS_FILE)) {
  console.log('\n  ⚠  IMS zaten arka planda çalışıyor.');
  console.log('     Önce stop.bat (veya node stop.js) çalıştırın.\n');
  process.exit(1);
}

// ── Menü ─────────────────────────────────────────────────────────────────────
console.log('\n  ▲ IMS — Inventory Management System\n');
console.log('  Çalışma modunu seçin:\n');
console.log('    [1]  Terminal (görünür)       — Her servis bu pencerede gösterilir,');
console.log('                                    Ctrl+C ile tümü durur.');
console.log('    [2]  Arka planda (gizli)      — Servisler sessizce çalışır,');
console.log('                                    durdurmak için stop.bat kullanın.');
console.log('    [3]  Arka planda + otomatik   — Bilgisayar her açıldığında');
console.log('                                    otomatik başlar (yönetici gerekir).\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('  Seçiminiz (1/2/3): ', (answer) => {
  rl.close();
  const mode = answer.trim();
  if (mode === '2') startBackground(false);
  else if (mode === '3') startBackground(true);
  else startForeground();
});

// ════════════════════════════════════════════════════════════════════════════
function startForeground() {
  console.log('\n  ▸ Terminal modunda başlatılıyor...\n');

  const colors = { backend: '\x1b[36m', frontend: '\x1b[32m', 'public-app': '\x1b[35m' };
  const reset  = '\x1b[0m';
  const children = [];

  for (const svc of SERVICES) {
    const child = spawn('npm', ['run', 'dev'], {
      cwd: path.join(ROOT, svc.dir),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const tag = `${colors[svc.name]}▸ ${svc.name.padEnd(10)}${reset}`;
    child.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => console.log(`  ${tag} ${l}`)));
    child.stderr.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => console.log(`  ${tag} ${l}`)));

    children.push(child);
  }

  showUrls();
  console.log('  Durdurmak için: Ctrl+C\n');

  const stopAll = () => {
    console.log('\n  Durduruluyor...');
    children.forEach(c => { try { c.kill(); } catch {} });
    if (os.platform() === 'win32') {
      killPorts([3001, 3002, 4000]);
    }
    process.exit(0);
  };
  process.on('SIGINT',  stopAll);
  process.on('SIGTERM', stopAll);
}

// ════════════════════════════════════════════════════════════════════════════
function startBackground(registerAutostart) {
  console.log('\n  ▸ Arka planda başlatılıyor...\n');

  fs.mkdirSync(PID_DIR, { recursive: true });

  const pids = {};

  for (const svc of SERVICES) {
    const logPath = path.join(PID_DIR, `${svc.name}.log`);
    const out = fs.openSync(logPath, 'a');

    const child = spawn('npm', ['run', 'dev'], {
      cwd: path.join(ROOT, svc.dir),
      shell: true,
      stdio: ['ignore', out, out],
      detached: true,
    });
    child.unref();

    pids[svc.name] = child.pid;
    console.log(`  ✓ ${svc.name} başlatıldı  (PID: ${child.pid})`);
  }

  fs.writeFileSync(PIDS_FILE, JSON.stringify(pids, null, 2));
  console.log(`\n  Loglar: ${PID_DIR}`);

  if (registerAutostart) {
    registerStartup();
  }

  showUrls();
  console.log('  Durdurmak için: stop.bat\n');
}

// ── Task Scheduler kaydı ──────────────────────────────────────────────────────
function registerStartup() {
  try {
    const nodeBin  = process.execPath;
    const script   = path.join(ROOT, 'start.js');
    const taskCmd  = `"${nodeBin}" "${script}" --background`;
    execSync(
      `schtasks /create /tn "IMS-AutoStart" /tr "${taskCmd}" /sc onlogon /rl highest /f`,
      { stdio: 'pipe' }
    );
    console.log('\n  ✓ Otomatik başlatma kaydedildi.');
    console.log('    Kaldırmak için: node unregister-startup.js');
  } catch {
    console.log('\n  ⚠  Otomatik başlatma kaydedilemedi.');
    console.log('     start.bat ya da start.js\'yi Yönetici olarak çalıştırın.');
  }
}

// ── Yerel IP ──────────────────────────────────────────────────────────────────
function getLocalIP() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        const ip = net.address;
        if (/^(192|10|172)\./.test(ip)) return ip;
      }
    }
  }
  return null;
}

function showUrls() {
  const ip = getLocalIP();
  console.log('');
  if (ip) {
    console.log('  Uygulamayı açmak için:');
    console.log(`    http://${ip}:3001  ← ağdaki tüm cihazlardan`);
    console.log(`    http://localhost:3001        ← bu bilgisayardan`);
  } else {
    console.log('  Uygulamayı açmak için: http://localhost:3001');
  }
  console.log('');
}

// ── Port temizleme (Windows) ───────────────────────────────────────────────────
function killPorts(ports) {
  for (const port of ports) {
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
