const repo = "MidhunPalanisamy/velmora-media-player";
let pendingDownload = null;

function detectOS() {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("Mac") !== -1) return "mac";
    if (userAgent.indexOf("Win") !== -1) return "win";
    return "other";
}

async function fetchReleases() {
    const releasesList = document.getElementById("releasesList");
    const downloadBtn = document.getElementById("downloadBtn");
    const osDetect = document.getElementById("os-detect");
    const os = detectOS();

    if (os === "mac") {
        osDetect.innerText = "Detected macOS - Recommended: .dmg";
        downloadBtn.innerText = "Download for Mac";
    } else if (os === "win") {
        osDetect.innerText = "Detected Windows - Recommended: .exe";
        downloadBtn.innerText = "Download for Windows";
    } else {
        osDetect.innerText = "Available for Windows & macOS";
        downloadBtn.innerText = "View All Downloads";
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases`);
        if (!response.ok) throw new Error("GitHub API request failed");
        
        const releases = await response.json();
        renderReleases(releases);
        setupDownloadButton(releases, os);

    } catch (error) {
        console.error("Error fetching releases:", error);
        releasesList.innerHTML = `
            <div class="loading">
                <p>Failed to load releases directly.</p>
                <a href="https://github.com/${repo}/releases" class="asset-btn" style="margin-top: 20px; display: inline-flex;">
                    View on GitHub
                </a>
            </div>
        `;
        
        downloadBtn.onclick = () => {
            window.open(`https://github.com/${repo}/releases`, "_blank");
        };
    }
}

function setupDownloadButton(releases, os) {
    const downloadBtn = document.getElementById("downloadBtn");
    if (!releases || releases.length === 0) return;

    const latest = releases[0];
    
    downloadBtn.onclick = () => {
        let asset;
        if (os === "mac") {
            asset = latest.assets.find(a => a.name.toLowerCase().endsWith(".dmg"));
            if (asset) showMacNote(asset.browser_download_url);
        } else if (os === "win") {
            asset = latest.assets.find(a => a.name.toLowerCase().endsWith(".exe"));
            if (asset) showWindowsNote(asset.browser_download_url);
        }

        if (!asset) {
            document.getElementById("releases").scrollIntoView({ behavior: 'smooth' });
        }
    };
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i>';
        btn.classList.add('copied');
        if (window.lucide) window.lucide.createIcons();
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('copied');
            if (window.lucide) window.lucide.createIcons();
        }, 2000);
    });
}

function showMacNote(url) {
    pendingDownload = url;
    const note = document.getElementById("downloadNote");
    const text = document.getElementById("noteText");
    const command = "xattr -rd com.apple.quarantine /Applications/Velmora.app";

    text.innerHTML = `
        <p>macOS may block the app on first launch because it's from an unverified developer.</p>
        <b>Method 1 (Recommended)</b>
        <ul>
            <li>Right-click the app in Applications</li>
            <li>Select "Open"</li>
            <li>Click "Open" again on the warning dialog</li>
        </ul>
        <b>Method 2 (Terminal)</b>
        <p>If the above doesn't work, run this command:</p>
        <code>
            <span>${command}</span>
            <button class="copy-btn" onclick="copyToClipboard('${command}', this)" title="Copy to clipboard">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
            </button>
        </code>
    `;

    note.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
}

function showWindowsNote(url) {
    pendingDownload = url;
    const note = document.getElementById("downloadNote");
    const text = document.getElementById("noteText");

    text.innerHTML = `
        <p>Windows SmartScreen may show a security warning.</p>
        <b>How to bypass:</b>
        <ul>
            <li>Click "More info" in the blue box</li>
            <li>Click "Run anyway"</li>
        </ul>
    `;

    note.classList.remove("hidden");
}

function closeNote(shouldDownload = false) {
    document.getElementById("downloadNote").classList.add("hidden");
    if (shouldDownload && pendingDownload) {
        const url = pendingDownload;
        pendingDownload = null;
        // Small delay for better UX after clicking "Got it"
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    } else {
        pendingDownload = null;
    }
}

function renderReleases(releases) {
    const releasesList = document.getElementById("releasesList");
    if (!releases || releases.length === 0) {
        releasesList.innerHTML = '<div class="loading">No releases found.</div>';
        return;
    }

    releasesList.innerHTML = "";
    
    releases.forEach((release, index) => {
        const date = new Date(release.published_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const releaseElement = document.createElement("div");
        releaseElement.className = "release-item";
        
        const assetsHtml = release.assets.map(asset => `
            <a href="${asset.browser_download_url}" class="asset-btn">
                <span class="asset-name">${asset.name}</span>
                <i data-lucide="download" style="width: 18px; height: 18px;"></i>
            </a>
        `).join("");

        releaseElement.innerHTML = `
            <div class="release-top">
                <div class="release-info">
                    <h3>
                        ${release.name || release.tag_name}
                        ${index === 0 ? '<span class="release-tag">Latest</span>' : ''}
                    </h3>
                    <p class="release-date">Published on ${date}</p>
                </div>
            </div>
            <div class="release-assets">
                ${assetsHtml}
            </div>
        `;
        
        releasesList.appendChild(releaseElement);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function scrollReveal() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal, .grid').forEach(el => {
        observer.observe(el);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    fetchReleases();
    scrollReveal();
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
