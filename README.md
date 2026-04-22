# 🎬 Cynara

Cynara is a robust, production-grade desktop video player built with Electron. It features a smart media library system, real-time folder watching, and advanced playback controls including a VLC-style audio boost.

## ✨ Features

- **📁 Smart Media Library**: Automatically organizes your videos into playlists based on folders.
- **🔄 Real-Time Sync**: Watchers monitor your folders and update the library instantly when files are added, removed, or renamed.
- **🔊 Audio Boost**: VLC-style audio amplification up to 200% with built-in dynamics compression to prevent distortion.
- **📐 Universal Aspect Ratio**: Automatic scaling (`object-fit: contain`) ensures all videos, including vertical ones, display perfectly without cropping.
- **💾 Persistent Storage**: Remembers your library and settings across restarts using JSON-based persistence.
- **🔍 Advanced Search**: Search by video title or playlist name; matching playlists are highlighted and automatically expanded.
- **⌨️ Media Hotkeys**: Standard playback controls (Space for play/pause, Arrows for seeking, etc.).
- **⚙️ Professional UI**: A clean, modern dark theme with red accents and intuitive icon-based controls.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory:
   ```bash
   cd Vid_player
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the application in development mode:
```bash
npm start
```

## 📦 Building for Production

To package the application for distribution:

### For macOS (.dmg)
```bash
npm run build -- --mac
```

### For Windows (.exe)
```bash
npm run build -- --win
```

*Note: Windows builds on macOS require `wine` to be installed.*

## 🛠 Tech Stack

- **Framework**: Electron
- **Frontend**: HTML5, Vanilla CSS, JavaScript
- **Audio Engine**: Web Audio API (Context, Gain, Compressor)
- **Persistence**: Node.js `fs` module with JSON
- **Bundler**: electron-builder

## 📄 License

This project is created for personal and professional local media management.

---
*Created by Midhun Palanisamy*
