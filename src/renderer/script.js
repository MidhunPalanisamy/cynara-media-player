document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('main-player');
    const videoWrapper = document.getElementById('video-wrapper');
    const videoList = document.getElementById('video-list');
    const nowPlayingTitle = document.getElementById('now-playing-title');
    const nowPlayingFile = document.getElementById('now-playing-file');
    const toast = document.getElementById('toast');
    const videoCount = document.getElementById('video-count');
    const searchStatus = document.getElementById('search-status');
    const searchInput = document.getElementById('video-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const rewindBtn = document.getElementById('rewind-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const seekSlider = document.getElementById('seek-slider');
    const currentTimeLabel = document.getElementById('current-time');
    const durationLabel = document.getElementById('duration');
    const speedSelect = document.getElementById('speed-select');
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const audioSelect = document.getElementById('audio-select');
    const audioTrackStatus = document.getElementById('audio-track-status');
    const subtitleSelect = document.getElementById('subtitle-select');
    const subtitlePlaceSelect = document.getElementById('subtitle-place-select');
    const subtitleSizeSelect = document.getElementById('subtitle-size-select');
    const subtitleColorSelect = document.getElementById('subtitle-color-select');
    const subtitleBgSelect = document.getElementById('subtitle-bg-select');
    const subtitleOverlay = document.getElementById('subtitle-overlay');
    const subtitleDisplay = document.getElementById('subtitle-display');
    const subtitleFileInput = document.getElementById('subtitle-file');
    const loadSubtitleBtn = document.getElementById('load-subtitle-btn');

    function srtToVtt(srtText) {
        // Add WEBVTT header if not present
        let vttText = 'WEBVTT\n\n' + srtText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Replace comma with dot for milliseconds
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        return vttText;
    }

    function applySubtitleSettings() {
        subtitleOverlay.classList.remove('subtitle-pos-top', 'subtitle-pos-middle', 'subtitle-pos-bottom');
        subtitleOverlay.classList.add(`subtitle-pos-${subtitlePlaceSelect.value}`);

        subtitleDisplay.classList.remove('subtitle-size-sm', 'subtitle-size-md', 'subtitle-size-lg', 'subtitle-size-xl');
        subtitleDisplay.classList.add(`subtitle-size-${subtitleSizeSelect.value}`);

        subtitleDisplay.classList.remove('subtitle-color-white', 'subtitle-color-yellow', 'subtitle-color-cyan', 'subtitle-color-green');
        subtitleDisplay.classList.add(`subtitle-color-${subtitleColorSelect.value}`);

        subtitleDisplay.classList.remove('subtitle-bg-soft', 'subtitle-bg-solid', 'subtitle-bg-none');
        subtitleDisplay.classList.add(`subtitle-bg-${subtitleBgSelect.value}`);
    }

    function hideSubtitleOverlay() {
        subtitleDisplay.innerHTML = '';
        subtitleDisplay.classList.add('hidden');
    }

    function renderActiveSubtitleCue() {
        if (!activeSubtitleTrack || activeSubtitleTrack.mode === 'disabled') {
            hideSubtitleOverlay();
            return;
        }

        const activeCues = activeSubtitleTrack.activeCues ? Array.from(activeSubtitleTrack.activeCues) : [];
        if (!activeCues.length) {
            hideSubtitleOverlay();
            return;
        }

        subtitleDisplay.innerHTML = '';
        activeCues.forEach((cue) => {
            const line = document.createElement('div');
            line.className = 'subtitle-line';

            if (typeof cue.getCueAsHTML === 'function') {
                line.appendChild(cue.getCueAsHTML());
            } else {
                line.textContent = cue.text || '';
            }

            subtitleDisplay.appendChild(line);
        });

        subtitleDisplay.classList.remove('hidden');
    }

    function clearActiveSubtitleTrack(keepSelection = false) {
        const tracks = Array.from(videoPlayer.textTracks || []);
        tracks.forEach((track) => {
            track.removeEventListener('cuechange', renderActiveSubtitleCue);
            track.mode = 'disabled';
        });

        activeSubtitleTrack = null;
        hideSubtitleOverlay();

        if (!keepSelection) {
            activeSubtitleTrackLabel = '';
            subtitleSelect.value = 'off';
        }
    }

    function activateSubtitleTrack(track, optionValue) {
        if (!track) {
            clearActiveSubtitleTrack();
            return;
        }

        clearActiveSubtitleTrack(true);
        activeSubtitleTrack = track;
        activeSubtitleTrackLabel = track.label || '';
        activeSubtitleTrack.mode = 'hidden';
        activeSubtitleTrack.addEventListener('cuechange', renderActiveSubtitleCue);
        renderActiveSubtitleCue();

        if (typeof optionValue === 'string') {
            subtitleSelect.value = optionValue;
        }
    }

    function restoreActiveSubtitleTrack() {
        const selectedValue = subtitleSelect.value;
        if (selectedValue === 'off') {
            hideSubtitleOverlay();
            return;
        }

        if (!selectedValue.startsWith('embedded_')) {
            const track = videoPlayer.textTracks[Number.parseInt(selectedValue, 10)];
            if (track) {
                activateSubtitleTrack(track, selectedValue);
                return;
            }
        }

        if (activeSubtitleTrackLabel) {
            const tracks = Array.from(videoPlayer.textTracks || []);
            const matchIndex = tracks.findIndex((track) => track.label === activeSubtitleTrackLabel);
            if (matchIndex >= 0) {
                activateSubtitleTrack(tracks[matchIndex], String(matchIndex));
                return;
            }
        }

        hideSubtitleOverlay();
    }

    async function handleSubtitleImport(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            let content = e.target.result;
            const fileName = file.name;

            if (fileName.endsWith('.srt')) {
                content = srtToVtt(content);
            }

            const blob = new Blob([content], { type: 'text/vtt' });
            const url = URL.createObjectURL(blob);

            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = fileName.replace(/\.[^/.]+$/, "") + " (Imported)";
            track.src = url;
            track.srclang = 'en';

            videoPlayer.appendChild(track);

            setTimeout(() => {
                updateSubtitleTracks();
                const tracks = videoPlayer.textTracks;
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].label === track.label) {
                        activateSubtitleTrack(tracks[i], String(i));
                        break;
                    }
                }
                showToast(`Subtitle imported: ${file.name}`);
            }, 100);
        };
        reader.readAsText(file);
    }

    subtitleFileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleSubtitleImport(e.target.files[0]);
        }
    };

    loadSubtitleBtn.onclick = () => {
        subtitleFileInput.click();
    };

    function updateSubtitleTracks() {
        console.log("Updating subtitle tracks UI...");
        const currentSelection = subtitleSelect.value;
        subtitleSelect.innerHTML = '<option value="off">None / Off</option>';

        const seenLabels = new Set();
        const tracks = videoPlayer.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const label = track.label || track.language || `Track ${i + 1}`;

            if (!seenLabels.has(label)) {
                seenLabels.add(label);
                const option = document.createElement('option');
                option.value = String(i);
                option.textContent = label;
                if (track === activeSubtitleTrack || track.mode !== 'disabled') {
                    option.selected = true;
                }
                subtitleSelect.appendChild(option);
            }
        }

        if (embeddedTracks && embeddedTracks.subtitle) {
            embeddedTracks.subtitle.forEach((track) => {
                const label = `${track.label} (Embedded)`;
                if (!seenLabels.has(label)) {
                    seenLabels.add(label);
                    const option = document.createElement('option');
                    option.value = `embedded_${track.index}`;
                    option.textContent = label;
                    subtitleSelect.appendChild(option);
                }
            });
        }

        if (currentSelection && Array.from(subtitleSelect.options).some((option) => option.value === currentSelection)) {
            subtitleSelect.value = currentSelection;
        }
    }

    subtitleSelect.onchange = async () => {
        const val = subtitleSelect.value;
        if (val === 'off') {
            clearActiveSubtitleTrack();
            return;
        }

        if (val.startsWith('embedded_')) {
            const index = Number.parseInt(val.split('_')[1], 10);
            const trackInfo = embeddedTracks.subtitle.find((track) => track.index === index);
            if (trackInfo) {
                await handleEmbeddedSubtitleSelection(index, trackInfo.label);
            }
            return;
        }

        const track = videoPlayer.textTracks[Number.parseInt(val, 10)];
        if (track) {
            activateSubtitleTrack(track, val);
        }
    };

    subtitlePlaceSelect.onchange = applySubtitleSettings;
    subtitleSizeSelect.onchange = applySubtitleSettings;
    subtitleColorSelect.onchange = applySubtitleSettings;
    subtitleBgSelect.onchange = applySubtitleSettings;
    applySubtitleSettings();

    videoPlayer.textTracks.onaddtrack = () => {
        console.log("Track added via API/FFmpeg");
        updateSubtitleTracks();
        restoreActiveSubtitleTrack();
    };
    videoPlayer.textTracks.onremovetrack = () => {
        console.log("Track removed");
        updateSubtitleTracks();
        if (activeSubtitleTrack && !Array.from(videoPlayer.textTracks || []).includes(activeSubtitleTrack)) {
            clearActiveSubtitleTrack();
        } else {
            restoreActiveSubtitleTrack();
        }
    };

    videoPlayer.onloadeddata = () => {
        // Initialize Audio System on first load if needed
        if (!audioContext) {
            setupAudio(videoPlayer);
        }
    };
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const videoShell = document.getElementById('video-shell');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsSidePanel = document.getElementById('settings-side-panel');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const ratioSelect = document.getElementById('ratio-select');
    const boostSelect = document.getElementById('boost-select');
    const settingsLoader = document.getElementById('settings-loader');

    let currentVideoPath = "";
    let embeddedTracks = { audio: [], subtitle: [] };
    let sourceAudioTrackIndex = -1;
    let activeAudioSelection = '-1';
    let pendingAudioSelection = '-1';
    let pendingAudioSwitchTime = 0;
    let pendingAudioWasPlaying = false;
    let isAudioSwitchInProgress = false;
    let audioSwitchLoaderTimeout = null;
    let activeSubtitleTrack = null;
    let activeSubtitleTrackLabel = '';

    function setLoading(isLoading) {
        clearTimeout(audioSwitchLoaderTimeout);

        if (isLoading) {
            settingsLoader.classList.remove('hidden');
            audioSwitchLoaderTimeout = setTimeout(() => {
                if (!isAudioSwitchInProgress) {
                    return;
                }

                console.error("Audio switch timed out");
                isAudioSwitchInProgress = false;
                audioSelect.disabled = false;
                audioSelect.value = activeAudioSelection;
                settingsLoader.classList.add('hidden');
                showToast("Audio switch timed out");
            }, 10000);
            return;
        }

        settingsLoader.classList.add('hidden');
    }

    function updateAudioTrackStatus() {
        if (embeddedTracks.audio.length <= 1) {
            audioTrackStatus.textContent = 'Currently using: Default audio';
            return;
        }

        const selectedTrack = activeAudioSelection === '-1'
            ? embeddedTracks.audio[sourceAudioTrackIndex] || embeddedTracks.audio[0]
            : embeddedTracks.audio[Number.parseInt(activeAudioSelection, 10)];

        audioTrackStatus.textContent = selectedTrack
            ? `Currently using: ${selectedTrack.label}`
            : 'Currently using: Default audio';
    }

    function populateAudioTrackOptions() {
        audioSelect.innerHTML = '';

        if (embeddedTracks.audio.length <= 1) {
            const option = document.createElement('option');
            option.value = '-1';
            option.textContent = 'Default Audio';
            audioSelect.appendChild(option);
            audioSelect.value = '-1';
            updateAudioTrackStatus();
            return;
        }

        const sourceTrack = embeddedTracks.audio[sourceAudioTrackIndex] || embeddedTracks.audio[0];
        const sourceOption = document.createElement('option');
        sourceOption.value = '-1';
        sourceOption.textContent = `${sourceTrack.label} (Original)`;
        audioSelect.appendChild(sourceOption);

        embeddedTracks.audio.forEach((track, index) => {
            if (index === sourceAudioTrackIndex) {
                return;
            }

            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = track.label;
            audioSelect.appendChild(option);
        });

        audioSelect.value = activeAudioSelection;
        updateAudioTrackStatus();
    }

    populateAudioTrackOptions();

    function buildMediaSrc(filePath) {
        return `file://${filePath}`;
    }

    function reloadVideoSource(filePath, currentTime, wasPlaying) {
        const newSrc = `${buildMediaSrc(filePath)}?t=${Date.now()}`;

        videoPlayer.pause();
        videoPlayer.removeAttribute("src");
        videoPlayer.load();

        const restorePlayback = () => {
            const safeTime = Number.isFinite(currentTime) ? currentTime : 0;
            const duration = Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : safeTime;
            videoPlayer.currentTime = Math.min(safeTime, duration || safeTime);

            if (wasPlaying) {
                const playPromise = videoPlayer.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch((err) => {
                        console.error("Failed to resume playback after audio switch:", err);
                    });
                }
            }
        };

        videoPlayer.addEventListener('loadedmetadata', restorePlayback, { once: true });
        videoPlayer.src = newSrc;
        videoPlayer.load();
    }

    window.api.onAudioSwitched(({ newSrc }) => {
        if (!newSrc) {
            console.error("Audio switch reply missing source");
            isAudioSwitchInProgress = false;
            audioSelect.disabled = false;
            audioSelect.value = activeAudioSelection;
            setLoading(false);
            updateAudioTrackStatus();
            showToast("Failed to switch audio track");
            return;
        }

        reloadVideoSource(newSrc, pendingAudioSwitchTime, pendingAudioWasPlaying);
        activeAudioSelection = pendingAudioSelection;
        isAudioSwitchInProgress = false;
        audioSelect.disabled = false;
        audioSelect.value = activeAudioSelection;
        setLoading(false);
        updateAudioTrackStatus();
        showToast(activeAudioSelection === '-1' ? "Original audio restored" : "Audio track switched");
    });

    window.api.onAudioSwitchFailed((data) => {
        console.error("Audio switch failed:", data?.message);
        isAudioSwitchInProgress = false;
        audioSelect.disabled = false;
        audioSelect.value = activeAudioSelection;
        setLoading(false);
        updateAudioTrackStatus();
        showToast(data?.message || "Failed to switch audio track");
    });

    audioSelect.onchange = () => {
        const val = audioSelect.value;

        if (!currentVideoPath) {
            audioSelect.value = activeAudioSelection;
            return;
        }

        if (isAudioSwitchInProgress) {
            audioSelect.value = activeAudioSelection;
            return;
        }

        if (val === activeAudioSelection) {
            return;
        }

        const selectedTrack = Number.parseInt(val, 10);
        if (val !== '-1' && !embeddedTracks.audio[selectedTrack]) {
            console.error("Invalid audio track selection:", val);
            audioSelect.value = activeAudioSelection;
            showToast("Audio track unavailable");
            return;
        }

        pendingAudioSelection = val;
        pendingAudioSwitchTime = videoPlayer.currentTime;
        pendingAudioWasPlaying = !videoPlayer.paused;
        isAudioSwitchInProgress = true;
        audioSelect.disabled = true;

        if (val === '-1') {
            showToast("Switching to original audio...");
        } else {
            console.log("Selected audio track:", selectedTrack);
            showToast(`Switching to audio track ${selectedTrack}...`);
        }

        setLoading(true);
        window.api.switchAudio({
            filePath: currentVideoPath,
            trackIndex: val === '-1' ? -1 : selectedTrack,
            currentTime: pendingAudioSwitchTime
        });
    };

    async function detectEmbeddedTracks(filePath) {
        settingsLoader.classList.remove('hidden');
        // MANDATORY: Always pair with a safety timeout to prevent infinite loading
        const loaderTimeout = setTimeout(() => {
            settingsLoader.classList.add('hidden');
            console.warn("Media parsing timed out");
        }, 10000);

        try {
            await window.api.cleanupTemp(); // Cleanup old temp files
            const metadata = await window.api.getVideoMetadata(filePath);

            // MANDATORY: Deduplicate logic from FFprobe
            embeddedTracks = { audio: [], subtitle: [] };
            const seenAudio = new Set();
            const seenSub = new Set();

            console.log("FFprobe raw output:", metadata);

            if (metadata && metadata.streams) {
                metadata.streams.forEach(stream => {
                    const lang = stream.tags?.language || "und";
                    const title = stream.tags?.title || "";
                    const trackLabel = title ? `${title} (${lang})` : (lang !== "und" ? lang : `Track ${stream.index}`);

                    if (stream.codec_type === 'audio') {
                        const key = `${stream.index}-${trackLabel}`;
                        if (!seenAudio.has(key)) {
                            seenAudio.add(key);
                            embeddedTracks.audio.push({
                                index: stream.index,
                                label: `${trackLabel} [${stream.codec_name}]`,
                                isDefault: Boolean(stream.disposition?.default),
                                stream: stream
                            });
                        }
                    } else if (stream.codec_type === 'subtitle') {
                        const key = `${stream.index}-${trackLabel}`;
                        if (!seenSub.has(key)) {
                            seenSub.add(key);
                            embeddedTracks.subtitle.push({
                                index: stream.index,
                                label: `${trackLabel} [${stream.codec_name}]`,
                                stream: stream
                            });
                        }
                    }
                });
            }

            console.log("Audio Tracks:", embeddedTracks.audio);
            console.log("Subtitle Tracks:", embeddedTracks.subtitle);
            sourceAudioTrackIndex = embeddedTracks.audio.findIndex((track) => track.isDefault);
            if (sourceAudioTrackIndex < 0) {
                sourceAudioTrackIndex = embeddedTracks.audio.length > 0 ? 0 : -1;
            }

            activeAudioSelection = '-1';
            pendingAudioSelection = '-1';
            audioSelect.disabled = false;
            populateAudioTrackOptions();

            // Populate Subtitle UI
            updateSubtitleTracks();

        } catch (err) {
            console.error("Metadata detection failed:", err);
            showToast("Failed to detect tracks");
        } finally {
            clearTimeout(loaderTimeout); // MANDATORY: Loading MUST end
            settingsLoader.classList.add('hidden');
        }
    }

    async function handleEmbeddedSubtitleSelection(streamIndex, label) {
        settingsLoader.classList.remove('hidden');
        const loaderTimeout = setTimeout(() => settingsLoader.classList.add('hidden'), 10000);

        try {
            // MANDATORY: Remove existing <track> elements BEFORE adding new ones
            const existingTracks = videoPlayer.querySelectorAll("track");
            existingTracks.forEach(t => t.remove());

            const vttPath = await window.api.extractSubtitle({
                filePath: currentVideoPath,
                streamIndex: streamIndex
            });

            if (vttPath) {
                const track = document.createElement('track');
                track.kind = 'subtitles';
                track.label = label + " (Embedded)";
                track.src = `file://${vttPath}`;
                track.srclang = 'en';
                track.default = true;

                videoPlayer.appendChild(track);

                setTimeout(() => {
                    const tracks = videoPlayer.textTracks;
                    for (let i = 0; i < tracks.length; i++) {
                        if (tracks[i].label === track.label) {
                            activateSubtitleTrack(tracks[i], String(i));
                            break;
                        }
                    }
                }, 200);
            }
        } catch (err) {
            console.error("Subtitle extraction failed:", err);
            showToast("Failed to extract subtitle");
        } finally {
            clearTimeout(loaderTimeout);
            settingsLoader.classList.add('hidden');
        }
    }
    
    // Upload Buttons
    const uploadFilesBtn = document.getElementById('upload-files-btn');
    const uploadFolderBtn = document.getElementById('upload-folder-btn');
    const resetLibraryBtn = document.getElementById('reset-library-btn');

    let libraryData = []; // [{ name: string, path: string, videos: [], expanded: boolean }]
    let allVideos = [];   // Flattened for easy navigation
    let currentIndex = -1;
    let toastTimer = null;
    let userIsSeeking = false;
    let controlsTimer = null;
    const controlsHideDelay = 3000;

    // Audio Boost System
    let audioContext, sourceNode, gainNode, compressor;

    function setupAudio(video) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = audioContext.createMediaElementSource(video);
            compressor = audioContext.createDynamicsCompressor();
            gainNode = audioContext.createGain();

            // Connect nodes
            sourceNode.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set initial boost
            setBoost(boostSelect.value);
        } catch (err) {
            console.error("Audio Boost setup failed:", err);
        }
    }

    function setBoost(level) {
        if (gainNode) {
            gainNode.gain.value = parseFloat(level);
        }
    }

    async function saveLibrary() {
        await window.api.saveLibrary(libraryData);
    }

    async function loadLibrary() {
        const saved = await window.api.loadLibrary();
        if (saved) {
            libraryData = saved;
            
            // Sync folders with filesystem on startup
            const syncPromises = libraryData.map(async (playlist) => {
                if (playlist.path) {
                    try {
                        const currentFiles = await window.api.scanFolder(playlist.path);
                        playlist.videos = currentFiles.map(parseVideo);
                    } catch (err) {
                        console.error(`Sync failed for folder: ${playlist.path}`, err);
                    }
                }
            });

            await Promise.all(syncPromises);
            
            updateAllVideos();
            renderLibrary();
            await saveLibrary(); // Save the synced state
        }
    }

    function updateAllVideos() {
        allVideos = libraryData.flatMap(p => p.videos);
    }

    function showToast(message) {
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainder = String(totalSeconds % 60).padStart(2, '0');
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${remainder}`;
        }
        return `${minutes}:${remainder}`;
    }

    function parseVideo(filePath) {
        const filename = filePath.split(/[/\\]/).pop();
        const match = filename.match(/(?:^|[\s\[\-_])E(\d+)/i);
        const videoNum = match ? parseInt(match[1], 10) : null;

        return {
            path: filePath,
            filename,
            videoNum,
            displayName: videoNum !== null ? `Video ${videoNum}` : filename
        };
    }

    async function addPlaylist(name, filePaths, folderPath = null) {
        const newVideos = filePaths.map(parseVideo);
        
        const existing = folderPath ? libraryData.find(p => p.path === folderPath) : libraryData.find(p => p.name === name);
        
        if (existing) {
            const paths = new Set(existing.videos.map(v => v.path));
            newVideos.forEach(v => {
                if (!paths.has(v.path)) {
                    existing.videos.push(v);
                    paths.add(v.path);
                }
            });
        } else {
            libraryData.push({
                name,
                path: folderPath,
                videos: newVideos,
                expanded: true
            });
            if (folderPath) {
                window.api.watchFolder(folderPath);
            }
        }

        await saveLibrary();
        updateAllVideos();
        renderLibrary();
    }

    function renderLibrary(filter = '') {
        videoList.innerHTML = '';
        const searchFilter = filter.toLowerCase();

        if (libraryData.length === 0) {
            videoList.innerHTML = '<div class="loading-card">Upload some videos to start</div>';
            videoCount.textContent = '0 videos';
            searchStatus.textContent = 'Library empty';
            return;
        }

        let totalMatchCount = 0;

        libraryData.forEach((playlist, pIndex) => {
            const playlistMatches = playlist.name.toLowerCase().includes(searchFilter);
            
            const filteredVideos = playlist.videos.filter(v => 
                v.filename.toLowerCase().includes(searchFilter) ||
                v.displayName.toLowerCase().includes(searchFilter)
            );

            // If neither the playlist name nor any videos match, skip this playlist
            if (!playlistMatches && filteredVideos.length === 0 && filter) return;

            // If the playlist name matches, we show ALL its videos. 
            // Otherwise, we show only the videos that match the search.
            const videosToShow = playlistMatches ? playlist.videos : filteredVideos;

            const section = document.createElement('div');
            section.className = 'playlist-section';
            
            const header = document.createElement('div');
            header.className = 'playlist-header clickable';
            // Highlight playlist if it's the reason it's being shown
            if (playlistMatches && filter) {
                header.classList.add('search-match');
            }

            header.innerHTML = `
                <span class="playlist-arrow">${playlist.expanded || filter ? '▼' : '▶'}</span>
                <span class="playlist-name">${playlist.name}</span>
            `;
            
            header.onclick = () => {
                playlist.expanded = !playlist.expanded;
                saveLibrary();
                renderLibrary(filter);
            };
            section.appendChild(header);

            if (playlist.expanded || filter) {
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'playlist-items';

                videosToShow.forEach((video) => {
                    totalMatchCount++;
                    const card = document.createElement('button');
                    card.className = 'video-card mini';
                    if (currentIndex !== -1 && allVideos[currentIndex].path === video.path) {
                        card.classList.add('active');
                    }

                    card.innerHTML = `
                        <div class="card-content">
                            <h3>${video.displayName}</h3>
                            <div class="file-name">${video.filename}</div>
                        </div>
                        ${video.videoNum !== null ? `<div class="video-number">${video.videoNum}</div>` : ''}
                    `;

                    card.onclick = () => {
                        const globalIndex = allVideos.findIndex(v => v.path === video.path);
                        playVideo(globalIndex);
                    };
                    itemsContainer.appendChild(card);
                });
                section.appendChild(itemsContainer);
            } else {
                totalMatchCount += videosToShow.length;
            }

            videoList.appendChild(section);
        });

        videoCount.textContent = `${totalMatchCount} videos`;
        searchStatus.textContent = filter ? 'Search results' : 'All videos';
        
        if (totalMatchCount === 0 && filter) {
            videoList.innerHTML = '<div class="empty-results">No matches found for "' + filter + '"</div>';
        }
    }

    function playVideo(index) {
        if (index < 0 || index >= allVideos.length) return;

        currentIndex = index;
        const video = allVideos[currentIndex];
        currentVideoPath = video.path;
        sourceAudioTrackIndex = -1;
        isAudioSwitchInProgress = false;
        audioSelect.disabled = false;
        activeAudioSelection = '-1';
        pendingAudioSelection = '-1';
        clearActiveSubtitleTrack();
        setLoading(false);
        updateAudioTrackStatus();

        // Clear existing tracks
        while (videoPlayer.firstChild) {
            videoPlayer.removeChild(videoPlayer.firstChild);
        }

        videoPlayer.src = `file://${video.path}`;
        videoPlayer.play();
        
        nowPlayingTitle.textContent = video.displayName;
        nowPlayingFile.textContent = video.filename;
        videoWrapper.classList.add('has-video');
        
        renderLibrary(searchInput.value);
        showToast(`Playing: ${video.displayName}`);

        detectEmbeddedTracks(video.path);
    }

    // IPC Upload Handlers
    async function handleUploadFiles() {
        const paths = await window.api.selectFiles();
        if (paths.length > 0) {
            await addPlaylist("Imported Files", paths);
            showToast(`Added ${paths.length} files`);
        }
    }

    async function handleUploadFolder() {
        const result = await window.api.selectFolder();
        if (result) {
            const { path, files } = result;
            const parts = path.split(/[/\\]/);
            const folderName = parts[parts.length - 1] || "Imported Folder";
            
            await addPlaylist(folderName, files, path);
            showToast(`Added folder: ${folderName}`);
        }
    }

    async function handleResetLibrary() {
        const confirmReset = confirm("Are you sure you want to clear all imported videos and folders?");
        if (!confirmReset) return;

        libraryData = [];
        await saveLibrary();
        allVideos = [];
        currentIndex = -1;
        currentVideoPath = '';
        sourceAudioTrackIndex = -1;
        embeddedTracks = { audio: [], subtitle: [] };
        activeAudioSelection = '-1';
        pendingAudioSelection = '-1';
        clearActiveSubtitleTrack();
        populateAudioTrackOptions();
        videoPlayer.src = '';
        videoWrapper.classList.remove('has-video');
        nowPlayingTitle.textContent = 'Select a video';
        nowPlayingFile.textContent = 'Ready to watch';
        renderLibrary();
        showToast("Library reset");
    }

    uploadFilesBtn.onclick = handleUploadFiles;
    uploadFolderBtn.onclick = handleUploadFolder;
    resetLibraryBtn.onclick = handleResetLibrary;

    // Folder Watch Handler
    window.api.onFolderUpdate(async (folderPath) => {
        const playlist = libraryData.find(p => p.path === folderPath);
        if (!playlist) return;

        const files = await window.api.scanFolder(folderPath);
        playlist.videos = files.map(parseVideo);
        
        await saveLibrary();
        updateAllVideos();
        renderLibrary(searchInput.value);
        showToast(`Updated folder: ${playlist.name}`);
    });

    // Load library on start
    loadLibrary();

    // Player Controls Logic
    playBtn.onclick = () => {
        if (videoPlayer.paused) videoPlayer.play();
        else videoPlayer.pause();
    };
videoPlayer.onplay = () => {
    // Initialize Audio System on first play
    if (!audioContext) {
        setupAudio(videoPlayer);
    }
    if (audioContext) {
        audioContext.resume();
    }

    document.getElementById('play-img').src = '../../assets/pause.png';
    document.getElementById('play-img').style.marginLeft = '0';
    videoShell.classList.remove('is-paused');
    resetControlsTimer();
};

videoPlayer.onpause = () => {
    document.getElementById('play-img').src = '../../assets/play.png';
    document.getElementById('play-img').style.marginLeft = '2px';
    videoShell.classList.add('is-paused');
};

    videoPlayer.ontimeupdate = () => {
        if (!userIsSeeking) {
            seekSlider.value = videoPlayer.currentTime;
            currentTimeLabel.textContent = formatTime(videoPlayer.currentTime);
        }

        if (activeSubtitleTrack) {
            renderActiveSubtitleCue();
        }
    };

    videoPlayer.onloadedmetadata = () => {
        seekSlider.max = videoPlayer.duration;
        durationLabel.textContent = formatTime(videoPlayer.duration);

        console.log("Metadata loaded, textTracks count:", videoPlayer.textTracks.length);

        updateSubtitleTracks();
        restoreActiveSubtitleTrack();
        updateAudioTrackStatus();
    };
    seekSlider.oninput = () => {
        userIsSeeking = true;
        currentTimeLabel.textContent = formatTime(seekSlider.value);
    };

    seekSlider.onchange = () => {
        userIsSeeking = false;
        videoPlayer.currentTime = seekSlider.value;
    };

    rewindBtn.onclick = () => videoPlayer.currentTime -= 10;
    forwardBtn.onclick = () => videoPlayer.currentTime += 10;
    
    prevBtn.onclick = () => {
        if (currentIndex > 0) playVideo(currentIndex - 1);
    };
    
    nextBtn.onclick = () => {
        if (currentIndex < allVideos.length - 1) playVideo(currentIndex + 1);
    };

    volumeSlider.oninput = () => {
        videoPlayer.volume = volumeSlider.value;
        muteBtn.textContent = videoPlayer.volume === 0 ? 'Unmute' : 'Mute';
    };

    muteBtn.onclick = () => {
        videoPlayer.muted = !videoPlayer.muted;
        muteBtn.textContent = videoPlayer.muted ? 'Unmute' : 'Mute';
    };

    speedSelect.onchange = () => {
        videoPlayer.playbackRate = parseFloat(speedSelect.value);
    };

    boostSelect.onchange = () => {
        setBoost(boostSelect.value);
        showToast(`Audio Boost: ${Math.round(parseFloat(boostSelect.value) * 100)}%`);
    };

    ratioSelect.onchange = () => {
        videoPlayer.style.objectFit = ratioSelect.value;
    };

    fullscreenBtn.onclick = () => {
        if (!document.fullscreenElement) {
            videoShell.requestFullscreen();
            document.getElementById('fullscreen-img').src = '../../assets/normal-screen.png';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreen-img').src = '../../assets/full-screen.png';
        }
    };

    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        settingsSidePanel.classList.toggle('hidden');
    };

    closeSettingsBtn.onclick = () => {
        settingsSidePanel.classList.add('hidden');
    };

    document.addEventListener('click', (e) => {
        if (!settingsSidePanel.contains(e.target) && !settingsBtn.contains(e.target)) {
            settingsSidePanel.classList.add('hidden');
        }
    });

    settingsSidePanel.onclick = (e) => e.stopPropagation();

    searchInput.oninput = () => renderLibrary(searchInput.value);
    clearSearchBtn.onclick = () => {
        searchInput.value = '';
        renderLibrary();
    };

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                playBtn.click();
                break;
            case 'KeyF':
                fullscreenBtn.click();
                break;
            case 'KeyM':
                muteBtn.click();
                break;
            case 'ArrowLeft':
                videoPlayer.currentTime -= 5;
                break;
            case 'ArrowRight':
                videoPlayer.currentTime += 5;
                break;
        }
    });

    function hideControls() {
        videoShell.classList.add('controls-hidden');
    }

    function resetControlsTimer() {
        videoShell.classList.remove('controls-hidden');
        clearTimeout(controlsTimer);
        if (!videoPlayer.paused) {
            controlsTimer = setTimeout(hideControls, controlsHideDelay);
        }
    }

    videoShell.onmousemove = resetControlsTimer;
});
