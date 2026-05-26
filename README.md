# Velmora

**Watch Local. Feel Cinematic.**

Velmora is a modern desktop video player built with Electron, designed for users who prefer a clean, distraction-free experience for local media playback. It combines a cinematic interface with practical features such as folder-based organization, advanced multi-track audio support, and real-time audio enhancement.

[**Official Website**](https://midhunpalanisamy.github.io/velmora-media-player/) | [**GitHub Releases**](https://github.com/MidhunPalanisamy/velmora-media-player/releases)

---

## Features

* **Folder-based Playlists:** Automatically organizes media by treating local directories as structured playlists with file system watching.
* **Cinematic UI:** A minimal, distraction-free design focused entirely on the content.
* **Advanced Multi-Track Support:** On-the-fly switching between multiple audio tracks and embedded subtitle extraction via FFmpeg.
* **Audio Boost:** Real-time amplification up to 200% with dynamic balancing and compression to prevent clipping.
* **Self-Contained Builds:** Production builds bundle platform-specific FFmpeg and FFprobe binaries; no external dependencies required for end-users.
* **Customizable Subtitles:** Support for SRT/VTT with adjustable positioning, sizing, and styling.
* **Persistent Library:** Remembers imported folders, playback positions, and preferences across sessions.

---

## Download

Select the appropriate build for your system from the [Releases Page](https://github.com/MidhunPalanisamy/velmora-media-player/releases):

* **macOS (Apple Silicon):** `.dmg` (arm64)
* **macOS (Intel):** `.dmg` (x64)
* **Windows:** `.exe` installer (x64)

---

## Installation

### macOS
1. Download the `.dmg` file and drag Velmora to your **Applications** folder.
2. **First Launch:** Since the app is not yet code-signed, right-click the app and select **Open**, then click **Open** again in the dialog.
3. *Alternative for advanced users:*
 ```bash
   xattr -rd com.apple.quarantine /Applications/Velmora.app
```

### Windows
1. Run the `.exe` installer.
2. If Windows SmartScreen appears, click **More info** and then **Run anyway**.

---

## Usage

### Controls & Shortcuts
* **Space:** Play/Pause
* **Arrow Keys:** Seek (Left/Right)
* **F:** Toggle Fullscreen
* **M:** Mute/Unmute
* **Settings Gear:** Access audio boost, aspect ratio, and track selection.

---

## How It Works

Velmora uses a hybrid architecture to bridge the gap between web technologies and low-level media processing:

1.  **Metadata Extraction:** Uses `ffprobe` to identify stream layouts (Video, Audio, Subtitles) upon loading.
2.  **Audio Remuxing:** When a non-default audio track is selected, the main process executes a targeted `ffmpeg` command to remux the stream into a temporary container for seamless playback.
3.  **Audio Pipeline:** Routes audio through an `AudioContext` graph featuring a `DynamicsCompressorNode` for the 200% boost functionality.
4.  **Subtitle Conversion:** Converts external SRT files to WebVTT on-the-fly for HTML5 video compatibility.

---

## Tech Stack

* **Frontend:** Vanilla JS, HTML5, CSS3
* **Runtime:** Electron / Node.js
* **Media Engine:** FFmpeg & FFprobe (Bundled)
* **Audio:** Web Audio API

---

## Development

### Setup
```bash
git clone https://github.com/MidhunPalanisamy/velmora-media-player.git
cd velmora-media-player
npm install
npm start
```

### Build
To generate production-ready, self-contained packages:
```bash
npm run build
```
The build process automatically triggers `prepare:media-binaries` to download the correct FFmpeg versions for packaging.

---

## Project Status
Velmora is actively maintained. Core functionality is stable, with ongoing improvements focused on performance and UI refinement.

---

## License
MIT - See [LICENSE](LICENSE) for details.

---

## Author
**Midhun Palanisamy**  
[Website](https://midhunpalanisamy.github.io/velmora-media-player/)
