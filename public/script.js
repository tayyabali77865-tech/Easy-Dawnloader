// ========================================
// GLOBAL STATE & CONFIGURATION
// ========================================
const API_BASE = '/api';
let currentPlatform = 'youtube';
let currentFormat = 'video'; // For YouTube: 'video' or 'audio'

// ========================================
// DOM ELEMENTS
// ========================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const platformSections = document.querySelectorAll('.platform-section');
const themeToggle = document.getElementById('theme-toggle');

// ========================================
// THEME MANAGEMENT
// ========================================
let darkTheme = localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme');

const updateTheme = () => {
    document.body.setAttribute('data-theme', darkTheme ? 'dark' : 'light');
    const iconName = darkTheme ? 'sun' : 'moon';
    themeToggle.innerHTML = `<i data-feather="${iconName}" id="theme-icon"></i>`;
    localStorage.setItem('theme', darkTheme ? 'dark' : 'light');
    if (window.feather) feather.replace();
};

themeToggle.addEventListener('click', () => {
    darkTheme = !darkTheme;
    updateTheme();
});

updateTheme();

// ========================================
// NAVIGATION & PLATFORM SWITCHING
// ========================================
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = link.dataset.platform;

        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Switch platform section
        platformSections.forEach(section => section.classList.remove('active'));
        document.getElementById(platform).classList.add('active');

        // Update current platform
        currentPlatform = platform;

        // Close mobile menu
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ========================================
// YOUTUBE DOWNLOADER
// ========================================
const youtubeUrl = document.getElementById('youtube-url');
const youtubeFetch = document.getElementById('youtube-fetch');
const youtubeLoader = document.getElementById('youtube-loader');
const youtubeError = document.getElementById('youtube-error');
const youtubeErrorText = document.getElementById('youtube-error-text');
const youtubeResult = document.getElementById('youtube-result');
const youtubeDownloads = document.getElementById('youtube-downloads');
const formatBtns = document.querySelectorAll('.format-btn');

// Format Selection
formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        formatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFormat = btn.dataset.format;
    });
});

// YouTube URL Validation
const isValidYouTubeUrl = (url) => {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    return patterns.some(pattern => pattern.test(url));
};

// Fetch YouTube Video
youtubeFetch.addEventListener('click', async () => {
    const url = youtubeUrl.value.trim();

    if (!url) {
        showError('youtube', 'Please enter a YouTube URL');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showError('youtube', 'Invalid YouTube URL. Please enter a valid YouTube video or Shorts URL.');
        return;
    }

    hideError('youtube');
    youtubeResult.style.display = 'none';
    youtubeLoader.style.display = 'block';
    youtubeFetch.disabled = true;

    try {
        // Fetch metadata
        const infoResp = await fetch(`${API_BASE}/youtube/info?url=${encodeURIComponent(url)}`);
        if (!infoResp.ok) {
            const errData = await infoResp.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch video information');
        }
        const metadata = await infoResp.json();

        // Fetch download link
        const downloadResp = await fetch(`${API_BASE}/youtube/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format: currentFormat })
        });

        if (!downloadResp.ok) {
            const errData = await downloadResp.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch download link');
        }
        const downloadData = await downloadResp.json();
        renderYouTubeResults(url, metadata, downloadData);
    } catch (error) {
        console.error('YouTube Fetch Error:', error);

        let errorMessage = error.message;
        // Check if the server returned detailed hints
        if (errorMessage.includes('All 5 fallback layers failed')) {
            errorMessage = `<strong>YouTube Blocked (5-Layer Fallback Failed)</strong><br><br>` +
                `Please check if your <strong>YOUTUBE_API_KEY</strong> is set in Vercel. <br>` +
                `<small>Try adding a fresh RAPIDAPI_KEY to your Vercel Dashboard and Re-deploying.</small>`;
        }

        showError('youtube', errorMessage);
    } finally {
        youtubeLoader.style.display = 'none';
        youtubeFetch.disabled = false;
    }
});

// Render YouTube Results
const renderYouTubeResults = (videoUrl, metadata, downloadData) => {
    // Update thumbnail and info
    document.getElementById('youtube-thumbnail').src = metadata.thumbnail_url;
    document.getElementById('youtube-title-text').textContent = downloadData.title || metadata.title;
    document.getElementById('youtube-author').textContent = `By ${metadata.author_name}`;

    // Create download options
    youtubeDownloads.innerHTML = '';

    if (downloadData.formats && downloadData.formats.length > 0) {
        // Add note about expiration
        if (downloadData.note) {
            const noteDiv = document.createElement('div');
            noteDiv.style.cssText = 'padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; margin-bottom: 15px; color: #ffc107; font-size: 0.9em; text-align: center;';
            noteDiv.innerHTML = `⚠️ ${downloadData.note}`;
            youtubeDownloads.appendChild(noteDiv);
        }

        downloadData.formats.forEach(format => {
            const hasAudio = format.hasAudio !== false; // Default to true if undefined

            // Construct proxy URL
            // Encodes the source video URL and passes the format ID
            const proxyUrl = `${API_BASE}/youtube/stream-download?url=${encodeURIComponent(videoUrl)}&id=${format.id}&ext=${format.format}`;

            const downloadItem = createDownloadButton(
                proxyUrl,
                format.quality,
                format.format.toUpperCase(),
                hasAudio
            );
            youtubeDownloads.appendChild(downloadItem);
        });
    } else {
        youtubeDownloads.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No download options available.</p>';
    }

    youtubeResult.style.display = 'block';
    youtubeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// ========================================
// FACEBOOK DOWNLOADER
// ========================================
const facebookUrl = document.getElementById('facebook-url');
const facebookFetch = document.getElementById('facebook-fetch');
const facebookLoader = document.getElementById('facebook-loader');
const facebookError = document.getElementById('facebook-error');
const facebookErrorText = document.getElementById('facebook-error-text');
const facebookResult = document.getElementById('facebook-result');
const facebookDownloads = document.getElementById('facebook-downloads');

facebookFetch.addEventListener('click', async () => {
    const url = facebookUrl.value.trim();

    if (!url) {
        showError('facebook', 'Please enter a Facebook URL');
        return;
    }

    if (!url.includes('facebook.com')) {
        showError('facebook', 'Invalid Facebook URL');
        return;
    }

    hideError('facebook');
    facebookResult.style.display = 'none';
    facebookLoader.style.display = 'block';
    facebookFetch.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/facebook/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch Facebook video');
        }

        const data = await response.json();
        renderGenericResults('facebook', data);
    } catch (error) {
        console.error('Facebook Error:', error);
        showError('facebook', error.message || 'Facebook downloader is currently under development. Please try again later.');
    } finally {
        facebookLoader.style.display = 'none';
        facebookFetch.disabled = false;
    }
});

// ========================================
// INSTAGRAM DOWNLOADER
// ========================================
const instagramUrl = document.getElementById('instagram-url');
const instagramFetch = document.getElementById('instagram-fetch');
const instagramLoader = document.getElementById('instagram-loader');
const instagramError = document.getElementById('instagram-error');
const instagramErrorText = document.getElementById('instagram-error-text');
const instagramResult = document.getElementById('instagram-result');
const instagramDownloads = document.getElementById('instagram-downloads');

instagramFetch.addEventListener('click', async () => {
    const url = instagramUrl.value.trim();

    if (!url) {
        showError('instagram', 'Please enter an Instagram URL');
        return;
    }

    if (!url.includes('instagram.com')) {
        showError('instagram', 'Invalid Instagram URL');
        return;
    }

    hideError('instagram');
    instagramResult.style.display = 'none';
    instagramLoader.style.display = 'block';
    instagramFetch.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/instagram/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch Instagram content');
        }

        const data = await response.json();
        renderGenericResults('instagram', data);
    } catch (error) {
        console.error('Instagram Error:', error);
        showError('instagram', error.message || 'Instagram downloader is currently under development. Please try again later.');
    } finally {
        instagramLoader.style.display = 'none';
        instagramFetch.disabled = false;
    }
});

// ========================================
// TIKTOK DOWNLOADER
// ========================================
const tiktokUrl = document.getElementById('tiktok-url');
const tiktokFetch = document.getElementById('tiktok-fetch');
const tiktokLoader = document.getElementById('tiktok-loader');
const tiktokError = document.getElementById('tiktok-error');
const tiktokErrorText = document.getElementById('tiktok-error-text');
const tiktokResult = document.getElementById('tiktok-result');
const tiktokDownloads = document.getElementById('tiktok-downloads');

tiktokFetch.addEventListener('click', async () => {
    const url = tiktokUrl.value.trim();

    if (!url) {
        showError('tiktok', 'Please enter a TikTok URL');
        return;
    }

    if (!url.includes('tiktok.com')) {
        showError('tiktok', 'Invalid TikTok URL');
        return;
    }

    hideError('tiktok');
    tiktokResult.style.display = 'none';
    tiktokLoader.style.display = 'block';
    tiktokFetch.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/tiktok/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch TikTok video');
        }

        const data = await response.json();
        renderGenericResults('tiktok', data);
    } catch (error) {
        console.error('TikTok Error:', error);
        showError('tiktok', error.message || 'TikTok downloader is currently under development. Please try again later.');
    } finally {
        tiktokLoader.style.display = 'none';
        tiktokFetch.disabled = false;
    }
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Show Error Message
const showError = (platform, message) => {
    const errorElement = document.getElementById(`${platform}-error`);
    const errorTextElement = document.getElementById(`${platform}-error-text`);
    errorTextElement.textContent = message;
    errorElement.style.display = 'flex';
    if (window.feather) feather.replace();
};

// Hide Error Message
const hideError = (platform) => {
    const errorElement = document.getElementById(`${platform}-error`);
    errorElement.style.display = 'none';
};

const createDownloadButton = (url, quality, format, hasAudio = true) => {
    const item = document.createElement('a');
    item.className = 'download-item';
    item.href = url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';

    // User requested to remove audio icon
    const audioIcon = '';

    item.innerHTML = `
        <span class="quality">${quality}${audioIcon}</span>
        <span class="type">${format.toUpperCase()} • Download</span>
    `;
    return item;
};

// Render Generic Results (for Facebook, Instagram, TikTok)
const renderGenericResults = (platform, data) => {
    const downloadsElement = document.getElementById(`${platform}-downloads`);
    const resultElement = document.getElementById(`${platform}-result`);

    downloadsElement.innerHTML = '';

    const formats = data.formats || data.downloads || [];

    if (data.url) {
        // Check if it's a server-side streaming endpoint (starts with /)
        const isServerStream = data.url.startsWith('/');
        const finalUrl = isServerStream ? `${API_BASE.replace('/api', '')}${data.url}` : `${API_BASE}/proxy?url=${encodeURIComponent(data.url)}&filename=${encodeURIComponent(data.title || 'video')}.mp4`;

        const downloadItem = createDownloadButton(
            finalUrl,
            data.quality || 'High Quality',
            data.format || 'MP4'
        );
        downloadsElement.appendChild(downloadItem);
    } else if (formats.length > 0) {
        formats.forEach(format => {
            // Check if it's a server-side streaming endpoint (starts with /)
            const isServerStream = format.url.startsWith('/');
            const finalUrl = isServerStream ? `${API_BASE.replace('/api', '')}${format.url}` : `${API_BASE}/proxy?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(data.title || 'video')}.${format.format || 'mp4'}`;

            const downloadItem = createDownloadButton(
                finalUrl,
                format.quality || 'Standard',
                format.format || 'MP4'
            );
            downloadsElement.appendChild(downloadItem);
        });
    } else {
        downloadsElement.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No download options available.</p>';
    }

    resultElement.style.display = 'block';
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const activeInput = document.querySelector(`#${currentPlatform}-url`);
        if (activeInput) activeInput.focus();
    }

    // Escape: Close mobile menu
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// ========================================
// ENTER KEY SUPPORT
// ========================================
[youtubeUrl, facebookUrl, instagramUrl, tiktokUrl].forEach((input, index) => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const fetchButtons = [youtubeFetch, facebookFetch, instagramFetch, tiktokFetch];
            fetchButtons[index].click();
        }
    });
});

// ========================================
// INITIALIZATION
// ========================================
console.log('🚀 EasyDownloader initialized');
console.log('Current platform:', currentPlatform);
