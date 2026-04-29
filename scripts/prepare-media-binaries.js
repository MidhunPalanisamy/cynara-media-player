const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const cacheRoot = path.join(projectRoot, '.cache', 'bundled-binaries');
const nodeModulesRoot = path.join(cacheRoot, 'node_modules');

const binaryPackages = {
  darwin: [
    {
      packageSpec: '@ffmpeg-installer/darwin-arm64@4.1.5',
      packagePath: ['@ffmpeg-installer', 'darwin-arm64'],
      binaryName: 'ffmpeg'
    },
    {
      packageSpec: '@ffmpeg-installer/darwin-x64@4.1.0',
      packagePath: ['@ffmpeg-installer', 'darwin-x64'],
      binaryName: 'ffmpeg'
    },
    {
      packageSpec: '@ffprobe-installer/darwin-arm64@5.0.1',
      packagePath: ['@ffprobe-installer', 'darwin-arm64'],
      binaryName: 'ffprobe'
    },
    {
      packageSpec: '@ffprobe-installer/darwin-x64@5.1.0',
      packagePath: ['@ffprobe-installer', 'darwin-x64'],
      binaryName: 'ffprobe'
    }
  ],
  win32: [
    {
      packageSpec: '@ffmpeg-installer/win32-x64@4.1.0',
      packagePath: ['@ffmpeg-installer', 'win32-x64'],
      binaryName: 'ffmpeg.exe'
    },
    {
      packageSpec: '@ffprobe-installer/win32-x64@5.1.0',
      packagePath: ['@ffprobe-installer', 'win32-x64'],
      binaryName: 'ffprobe.exe'
    }
  ]
};

function getExpectedBinaryPath(binaryPackage) {
  return path.join(nodeModulesRoot, ...binaryPackage.packagePath, binaryPackage.binaryName);
}

function hasAllBinaries(packages) {
  return packages.every((binaryPackage) => fs.existsSync(getExpectedBinaryPath(binaryPackage)));
}

function resolveNpmInvocation() {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath]
    };
  }

  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: []
  };
}

function installBinaries(packages) {
  fs.mkdirSync(cacheRoot, { recursive: true });

  const npm = resolveNpmInvocation();
  const args = [
    ...npm.args,
    'install',
    '--no-save',
    '--force',
    '--prefix',
    cacheRoot,
    '--fund=false',
    '--audit=false',
    ...packages.map((binaryPackage) => binaryPackage.packageSpec)
  ];

  const result = spawnSync(npm.command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const packages = binaryPackages[process.platform];

  if (!packages) {
    console.log(`Skipping bundled media binary preparation on unsupported build host: ${process.platform}`);
    return;
  }

  if (hasAllBinaries(packages)) {
    console.log(`Bundled media binaries already prepared for ${process.platform}`);
    return;
  }

  console.log(`Preparing bundled media binaries for ${process.platform}...`);
  installBinaries(packages);

  if (!hasAllBinaries(packages)) {
    throw new Error(`Bundled media binaries are incomplete after install for ${process.platform}`);
  }

  console.log(`Bundled media binaries prepared for ${process.platform}`);
}

main();
