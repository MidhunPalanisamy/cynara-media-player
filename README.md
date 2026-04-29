# Velmora

Watch Local. Feel Cinematic.

Velmora is a modern desktop video player built with Electron, designed for users who prefer a clean, distraction-free experience for local media playback. It combines a cinematic interface with practical features such as folder-based organization, advanced playback controls, and multi-track support.

Velmora focuses on local-first playback, avoiding unnecessary complexity while delivering a smooth and immersive viewing experience.

---

## Features

* Folder-based playlists
  Automatically organizes your media by treating folders as structured playlists.

* Cinematic user interface
  Minimal, distraction-free design focused entirely on content.

* Subtitle and audio track support
  Supports multiple audio tracks and subtitles (SRT, VTT).

* Self-contained release builds
  Production builds bundle FFmpeg and FFprobe so end users do not need Homebrew or separate media tools installed.

* Advanced playback controls
  Includes precise seeking, playback speed control, and aspect ratio handling.

* Audio boost
  Supports amplification up to 200% with dynamic balancing.

* Persistent library
  Remembers imported folders and playback preferences across sessions.

---

## Download

Velmora is distributed through GitHub Releases:

https://github.com/MidhunPalanisamy/velmora-media-player/releases

Select the appropriate build for your system:

* macOS (Apple Silicon): `.dmg` (arm64)
* macOS (Intel): `.dmg` (x64)
* Windows: `.exe` installer (x64)

Note:
On macOS, the system may block the app on first launch because it is not yet code-signed. This is expected behavior.

---

## Installation

### macOS

1. Download the appropriate `.dmg` file.
2. Open the file and drag Velmora into the Applications folder.
3. On first launch:

   * Right-click the app and select "Open"
   * Click "Open" again when prompted

Alternative (advanced users):

```bash
xattr -rd com.apple.quarantine /Applications/Velmora.app
```

---

### Windows

1. Download the `.exe` installer.
2. Run the installer and follow the setup steps.
3. If Windows SmartScreen appears:

   * Click "More info"
   * Click "Run anyway"

---

## Usage

* Add Media
  Use the "Add Folder" option to import your local media directories. Each folder is treated as a playlist.

* Playback
  Select any video to begin playback. The interface minimizes controls during playback for a cinematic experience.

* Subtitles and Audio
  Switch between available tracks directly from the player interface.

* Controls
  Standard shortcuts are supported:

  * Space: Play/Pause
  * Arrow keys: Seek
  * F: Fullscreen
  * M: Mute

---

## Tech Stack

* Electron
* Node.js
* HTML5, CSS3, JavaScript

---

## Development Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/MidhunPalanisamy/velmora-media-player.git
cd velmora-media-player
npm install
npm start
```

---

## Build

To generate production builds:

```bash
npm run build
```

On the first run, the build step downloads the platform-specific FFmpeg/FFprobe binaries that Velmora packages into the app. macOS builds are generated one architecture at a time to avoid `hdiutil` DMG resize contention.

Build output will be available in the `dist/` directory.

---

## Releases

Velmora follows semantic versioning.

Releases are automatically built and published using GitHub Actions when a version tag is pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Website

Official website:

https://midhunpalanisamy.github.io/velmora-media-player/

---

## Project Status

Velmora is actively under development. Core functionality is stable, and ongoing improvements are being made to performance, UI, and feature set.

---

## License

License will be added in a future update.

---

## Author

Midhun Palanisamy
