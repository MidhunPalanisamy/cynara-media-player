const darwinResources = [
  {
    from: '.cache/bundled-binaries/node_modules/@ffmpeg-installer/darwin-arm64',
    to: 'bin/darwin-arm64',
    filter: ['ffmpeg']
  },
  {
    from: '.cache/bundled-binaries/node_modules/@ffmpeg-installer/darwin-x64',
    to: 'bin/darwin-x64',
    filter: ['ffmpeg']
  },
  {
    from: '.cache/bundled-binaries/node_modules/@ffprobe-installer/darwin-arm64',
    to: 'bin/darwin-arm64',
    filter: ['ffprobe']
  },
  {
    from: '.cache/bundled-binaries/node_modules/@ffprobe-installer/darwin-x64',
    to: 'bin/darwin-x64',
    filter: ['ffprobe']
  }
];

const windowsResources = [
  {
    from: '.cache/bundled-binaries/node_modules/@ffmpeg-installer/win32-x64',
    to: 'bin/win32-x64',
    filter: ['ffmpeg.exe']
  },
  {
    from: '.cache/bundled-binaries/node_modules/@ffprobe-installer/win32-x64',
    to: 'bin/win32-x64',
    filter: ['ffprobe.exe']
  }
];

const extraResources = process.platform === 'darwin'
  ? darwinResources
  : process.platform === 'win32'
    ? windowsResources
    : [];

module.exports = {
  appId: 'com.velmora.player',
  productName: 'Velmora',
  publish: null,
  artifactName: 'Velmora-${version}-${os}-${arch}.${ext}',
  mac: {
    target: ['dmg'],
    icon: 'assets/velmora.icns',
    category: 'public.app-category.video'
  },
  win: {
    target: ['nsis'],
    icon: 'assets/velmora.ico'
  },
  directories: {
    output: 'dist'
  },
  files: [
    'src/**/*',
    'assets/**/*'
  ],
  extraResources
};
