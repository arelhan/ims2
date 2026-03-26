#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const os = require('os');

function getNetworkIP() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

const ip = getNetworkIP();
const args = process.argv.slice(2);
const child = spawn(args[0], args.slice(1), {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: process.cwd(),
});

function replace(data) {
  return ip ? data.toString().replace(/0\.0\.0\.0/g, ip) : data;
}

child.stdout.on('data', d => process.stdout.write(replace(d)));
child.stderr.on('data', d => process.stderr.write(replace(d)));
child.on('exit', code => process.exit(code || 0));
