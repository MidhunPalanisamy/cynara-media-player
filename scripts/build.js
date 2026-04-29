const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const builderBin = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
);
const configArgs = ['--config', 'electron-builder.config.js'];

function runBuilder(args) {
  if (!fs.existsSync(builderBin)) {
    console.error(`Error: electron-builder binary not found at ${builderBin}`);
    process.exit(1);
  }

  const result = spawnSync(builderBin, [...configArgs, ...args], {
    cwd: projectRoot,
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY || 'false'
    },
    stdio: 'inherit',
    shell: true
  });

  if (result.error) {
    console.error('Failed to start electron-builder:', result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`electron-builder exited with status ${result.status}`);
    process.exit(result.status || 1);
  }
}

if (process.platform === 'darwin') {
  runBuilder(['--mac', 'dmg', '--x64']);
  runBuilder(['--mac', 'dmg', '--arm64']);
} else if (process.platform === 'win32') {
  runBuilder(['--win', 'nsis', '--x64']);
} else {
  console.error(`Unsupported release build platform: ${process.platform}`);
  process.exit(1);
}
