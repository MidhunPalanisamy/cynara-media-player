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
    const subtitleSelect = document.getElementById('subtitle-select');
    const subtitleFileInput = document.getElementById('subtitle-file');
    const loadSubtitleBtn = document.getElementById('load-subtitle-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const videoShell = document.getElementById('video-shell');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const ratioSelect = document.getElementById('ratio-select');
    const boostSelect = document.getElementById('boost-select');
    
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

        videoPlayer.src = `file://${video.path}`;
        videoPlayer.play();
        
        nowPlayingTitle.textContent = video.displayName;
        nowPlayingFile.textContent = video.filename;
        videoWrapper.classList.add('has-video');
        
        renderLibrary(searchInput.value);
        showToast(`Playing: ${video.displayName}`);
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
    };

    videoPlayer.onloadedmetadata = () => {
        seekSlider.max = videoPlayer.duration;
        durationLabel.textContent = formatTime(videoPlayer.duration);
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
        settingsPanel.classList.toggle('hidden');
    };

    document.onclick = () => settingsPanel.classList.add('hidden');
    settingsPanel.onclick = (e) => e.stopPropagation();

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