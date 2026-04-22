const repo = "MidhunPalanisamy/velmora-media-player";

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

    // Update OS Detection text
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
        
        // Fallback for download button
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
        } else if (os === "win") {
            asset = latest.assets.find(a => a.name.toLowerCase().endsWith(".exe"));
        }

        if (asset) {
            window.location.href = asset.browser_download_url;
        } else {
            // If no direct match or OS is 'other', scroll to releases
            document.getElementById("releases").scrollIntoView({ behavior: 'smooth' });
        }
    };
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
                <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                ${asset.name}
            </a>
        `).join("");

        releaseElement.innerHTML = `
            <div class="release-info">
                <h3>
                    ${release.name || release.tag_name}
                    ${index === 0 ? '<span class="release-tag">Latest</span>' : ''}
                </h3>
                <p class="release-date">Published on ${date}</p>
            </div>
            <div class="release-assets">
                ${assetsHtml}
            </div>
        `;
        
        releasesList.appendChild(releaseElement);
    });

    // Re-initialize icons for dynamically added content
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    fetchReleases();
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
