# Velmora

Watch Local. Feel Cinematic.

Velmora is a production-quality desktop video player built with Electron, designed specifically for users who value a clean and immersive local media playback experience. It combines a modern, cinematic interface with robust media management features.

## Features

- Folder-based playlists: Automatically organizes media by treating your local folders as instant playlists.
- Cinematic user interface: A distraction-free environment that prioritizes your content.
- Comprehensive track support: Full compatibility with multiple audio tracks and subtitles (SRT, VTT).
- Advanced playback controls: Precision seeking, speed adjustment, and aspect ratio management.
- Audio boost: VLC-style amplification up to 200% with integrated dynamics compression.
- Persistent library: Remembers your media folders and settings across sessions.

## Download

Velmora is distributed through GitHub Releases. You can find the latest version and all previous releases at the link below:

https://github.com/MidhunPalanisamy/velmora-media-player/releases

Direct download options:
- macOS: Download the .dmg file for Apple Silicon or Intel systems.
- Windows: Download the .exe installer for 64-bit systems.

## Installation

### macOS

1. Download the latest .dmg file.
2. Open the .dmg and drag the Velmora app into your Applications folder.
3. Because Velmora is not yet code-signed, you may need to right-click the app and select "Open" on the first launch to bypass Gatekeeper.

### Windows

1. Download the latest .exe installer.
2. Run the installer and follow the on-screen instructions.
3. If Windows SmartScreen displays a warning, click "More info" and then select "Run anyway" to proceed with the installation.

## Usage

- Add Media: Use the "Add Folder" option to link your local media directories. Velmora will automatically generate playlists based on the folder structure.
- Playback: Select any video to begin playback. The cinematic UI will automatically hide controls during playback to minimize distractions.
- Subtitles and Audio: Use the on-screen controls to switch between available subtitle files and audio tracks.
- Shortcuts: Utilize standard media keys or keyboard shortcuts (Space for Play/Pause, Arrow keys for seeking) for efficient control.

## Screenshots

(Add screenshots here)

## Tech Stack

- Electron
- Node.js
- HTML5 / CSS3 / JavaScript (Vanilla)

## Development Setup

To set up the project locally for development, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/MidhunPalanisamy/velmora-media-player.git
   ```

2. Navigate to the project directory:
   ```bash
   cd velmora-media-player
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application in development mode:
   ```bash
   npm start
   ```

## Build

To generate production-ready binaries, use the build command:

```bash
npm run build
```

The output for your current operating system will be generated in the `dist/` directory.

## Releases

Velmora uses semantic versioning. New releases are automatically built and published via GitHub Actions whenever a new tag is pushed to the repository.

## Website

Visit the official landing page for Velmora:

https://midhunpalanisamy.github.io/velmora-media-player/

## License

No license specified yet.

## Author

Midhun Palanisamy
