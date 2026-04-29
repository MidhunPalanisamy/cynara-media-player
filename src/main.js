const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

let mainWindow;
let watchers = {};
const userDataPath = app.getPath('userData');
const libraryFilePath = path.join(userDataPath, 'library.json');
const tempDir = path.join(userDataPath, 'temp_tracks');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

ipcMain.handle('get-video-metadata', async (event, filePath) => {
  try {
    const { stdout } = await execPromise(`ffprobe -v error -show_streams -print_format json "${filePath}"`);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('ffprobe error:', err);
    return null;
  }
});

ipcMain.on('switch-audio', async (event, { filePath, trackIndex }) => {
  try {
    if (trackIndex === -1) {
      event.reply('audio-switched', { newSrc: filePath });
      return;
    }

    const output = path.join(tempDir, `audio-switch-${Date.now()}.mp4`);
    console.log('Generated file:', output);
    console.log('Selected audio track:', trackIndex);

    const command = `ffmpeg -y -i "${filePath}" -map 0:v -map 0:a:${trackIndex} -c copy "${output}"`;
    await execPromise(command);

    if (!fs.existsSync(output)) {
      console.error('FFmpeg output missing');
      event.reply('audio-switch-failed', { message: 'FFmpeg output missing' });
      return;
    }

    event.reply('audio-switched', { newSrc: output });
  } catch (err) {
    console.error('ffmpeg remux error:', err);
    event.reply('audio-switch-failed', { message: 'Failed to switch audio track' });
  }
});

ipcMain.handle('extract-subtitle', async (event, { filePath, streamIndex }) => {
  const outputFileName = `sub_${Date.now()}.vtt`;
  const outputPath = path.join(tempDir, outputFileName);
  try {
    const command = `ffmpeg -i "${filePath}" -map 0:${streamIndex} -y "${outputPath}"`;
    await execPromise(command);
    return outputPath;
  } catch (err) {
    console.error('ffmpeg sub extraction error:', err);
    return null;
  }
});

ipcMain.handle('cleanup-temp', async () => {
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    }
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
});

function scanFolder(folderPath) {
  try {
    return fs.readdirSync(folderPath)
      .filter(f => f.match(/\.(mp4|mkv|webm|mov|avi)$/i))
      .map(f => path.join(folderPath, f));
  } catch (err) {
    console.error('Error scanning folder:', err);
    return [];
  }
}

function watchFolder(folderPath) {
  if (watchers[folderPath]) return;

  try {
    watchers[folderPath] = fs.watch(folderPath, (eventType, filename) => {
      if (filename && filename.match(/\.(mp4|mkv|webm|mov|avi)$/i)) {
        if (mainWindow) {
          mainWindow.webContents.send('folder-updated', folderPath);
        }
      }
    });
  } catch (err) {
    console.error(`Failed to watch folder: ${folderPath}`, err);
  }
}

// Prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      backgroundColor: '#0a0a0a',
      titleBarStyle: 'hiddenInset',
      title: 'Velmora',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false // Required for playing local files directly if not using file:// protocol or custom scheme properly
      }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    mainWindow.on('closed', () => {
      mainWindow = null;
      // Close all watchers
      Object.values(watchers).forEach(w => w.close());
      watchers = {};

      // Cleanup temp tracks
      try {
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          for (const file of files) {
            fs.unlinkSync(path.join(tempDir, file));
          }
        }
      } catch (err) {
        console.error('Cleanup failed:', err);
      }
    });
  }

  app.whenReady().then(createWindow);

  ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Video Files',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi'] }]
    });
    return result.filePaths;
  });

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Video Folder',
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const folderPath = result.filePaths[0];
    const files = scanFolder(folderPath);
    return { path: folderPath, files };
  });

  ipcMain.handle('scan-folder', async (event, folderPath) => {
    return scanFolder(folderPath);
  });

  ipcMain.handle('watch-folder', (event, folderPath) => {
    watchFolder(folderPath);
  });

  ipcMain.handle('save-library', (event, data) => {
    try {
      fs.writeFileSync(libraryFilePath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    }
  });

  ipcMain.handle('load-library', () => {
    try {
      if (fs.existsSync(libraryFilePath)) {
        const data = JSON.parse(fs.readFileSync(libraryFilePath, 'utf-8'));
        // Re-establish watchers for folders in the library
        data.forEach(item => {
          if (item.path) watchFolder(item.path);
        });
        return data;
      }
    } catch (err) {
      console.error('Load failed:', err);
    }
    return [];
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
