const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (path) => ipcRenderer.invoke('scan-folder', path),
  watchFolder: (path) => ipcRenderer.invoke('watch-folder', path),
  saveLibrary: (data) => ipcRenderer.invoke('save-library', data),
  loadLibrary: () => ipcRenderer.invoke('load-library'),
  onFolderUpdate: (callback) => ipcRenderer.on('folder-updated', (_, path) => callback(path)),
  getVideoMetadata: (path) => ipcRenderer.invoke('get-video-metadata', path),
  extractSubtitle: (data) => ipcRenderer.invoke('extract-subtitle', data),
  switchAudio: (data) => ipcRenderer.send('switch-audio', data),
  onAudioSwitched: (callback) => ipcRenderer.on('audio-switched', (_, data) => callback(data)),
  onAudioSwitchFailed: (callback) => ipcRenderer.on('audio-switch-failed', (_, data) => callback(data)),
  cleanupTemp: () => ipcRenderer.invoke('cleanup-temp')
});
