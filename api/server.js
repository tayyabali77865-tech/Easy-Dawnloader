const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

// Initialize environment variables (for local dev)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || RAPIDAPI_KEY;
const FACEBOOK_API_KEY = process.env.FACEBOOK_API_KEY || RAPIDAPI_KEY;
const INSTAGRAM_API_KEY = process.env.INSTAGRAM_API_KEY || RAPIDAPI_KEY;
const TIKTOK_API_KEY = process.env.TIKTOK_API_KEY || RAPIDAPI_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// HTTPS Agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// ========================================
// YOUTUBE API ENDPOINTS (Vercel Compatible)
// ========================================
const ytdl = require('@distube/ytdl-core');

/**
 * YouTube: Fetch Video Metadata via YouTube oEmbed (More reliable on Vercel)
 */
app.get('/api/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log(`[YOUTUBE INFO] Fetching metadata for: ${url}`);
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
            httpsAgent: httpsAgent
        });

        // Map oEmbed response to what the frontend expects
        res.json({
            title: response.data.title,
            thumbnail_url: response.data.thumbnail_url,
            author_name: response.data.author_name
        });
    } catch (error) {
        console.error('[YOUTUBE ERROR] Metadata fetch failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch video metadata from YouTube' });
    }
});

/**
 * YouTube: Fetch Download Options
 */
app.post('/api/youtube/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log(`[YOUTUBE DOWNLOAD] Processing: ${url} (Format: ${format})`);

        // ==========================================
        // METHOD 1: Cobalt API (Multiple Instances)
        // ==========================================
        const cobaltInstances = [
            'https://api.cobalt.tools/api/json',
            'https://cobalt-api.vgest.io/api/json',
            'https://api.v0.pw/api/json',
            'https://co.wuk.sh/api/json'
        ];

        for (const endpoint of cobaltInstances) {
            try {
                console.log(`[YOUTUBE] Trying Cobalt Instance: ${endpoint}`);
                const response = await axios.post(endpoint, {
                    url: url,
                    isAudioOnly: format === 'audio',
                    vQuality: '720',
                    audioFormat: 'mp3'
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    },
                    timeout: 7000
                });

                const data = response.data;
                if (data.status === 'stream' || data.status === 'redirect') {
                    return res.json({
                        formats: [{
                            url: data.url,
                            quality: format === 'audio' ? 'Download MP3' : 'Download Video (Best)',
                            format: format === 'audio' ? 'mp3' : 'mp4',
                            hasAudio: true,
                            id: 'cobalt-success'
                        }],
                        title: 'YouTube Video',
                        note: 'Download link retrieved successfully.'
                    });
                } else if (data.status === 'picker') {
                    const pickerFormats = data.picker.map((p, i) => ({
                        url: p.url,
                        quality: p.type === 'video' ? `Download ${p.quality || 'Video'}` : `Download Audio (${p.quality || 'MP3'})`,
                        format: p.extension || (p.type === 'video' ? 'mp4' : 'mp3'),
                        hasAudio: true,
                        id: `cobalt-p-${i}`
                    }));
                    return res.json({ formats: pickerFormats, title: 'YouTube Video', note: 'Quality options generated.' });
                }
            } catch (err) {
                console.warn(`[YOUTUBE] Cobalt ${endpoint} failed: ${err.message}`);
            }
        }

        // ==========================================
        // METHOD 2: Public Proxy Fallback (Invidious API)
        // ==========================================
        try {
            console.log('[YOUTUBE] Trying Invidious Fallback...');
            const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            if (videoIdMatch) {
                const videoId = videoIdMatch[1];
                const invidiousInstances = [
                    'https://invidious.snopyta.org',
                    'https://yewtu.be',
                    'https://vid.puffyan.us',
                    'https://inv.riverside.rocks'
                ];

                for (const instance of invidiousInstances) {
                    try {
                        console.log(`[YOUTUBE] Trying Invidious Instance: ${instance}`);
                        const invResp = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: 5000 });
                        const invData = invResp.data;

                        if (invData && (invData.formatStreams || invData.adaptiveFormats)) {
                            const combined = [...(invData.formatStreams || []), ...(invData.adaptiveFormats || [])];
                            const filtered = combined.filter(s => format === 'audio' ? s.type.includes('audio') : s.type.includes('video'));

                            if (filtered.length > 0) {
                                const selected = filtered.slice(0, 5).map((s, i) => ({
                                    url: s.url,
                                    quality: s.qualityLabel || s.audioQuality || 'Standard',
                                    format: s.container || (s.type.includes('video') ? 'mp4' : 'm4a'),
                                    hasAudio: s.type.includes('video') && s.qualityLabel !== undefined,
                                    id: `inv-${i}`
                                }));
                                return res.json({
                                    formats: selected,
                                    title: invData.title || 'YouTube Video',
                                    note: 'Retrieved via decentralized proxy.'
                                });
                            }
                        }
                    } catch (e) {
                        console.warn(`[YOUTUBE] Invidious ${instance} failed`);
                    }
                }
            }
        } catch (e) {
            console.error('[YOUTUBE] Invidious fallback error:', e.message);
        }

        // ==========================================
        // METHOD 3: RapidAPI Fallback (Social Media Downloader)
        // ==========================================
        try {
            console.log(`[YOUTUBE] Attempting RapidAPI fallback (using ${process.env.YOUTUBE_API_KEY ? 'Specific' : 'Global'} Key)...`);
            const rResponse = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
                params: { url: url },
                headers: {
                    'x-rapidapi-key': YOUTUBE_API_KEY,
                    'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
                },
                timeout: 8000
            });
            if (rResponse.data && rResponse.data.success) {
                const links = rResponse.data.links || [];
                if (links.length > 0) {
                    const mapped = links
                        .filter(l => format === 'audio' ? l.type === 'audio' : l.type === 'video')
                        .map((l, i) => ({
                            url: l.link,
                            quality: l.quality || 'Download Now',
                            format: l.extension || 'mp4',
                            hasAudio: true,
                            id: `rapid-${i}`
                        }));
                    if (mapped.length > 0) {
                        return res.json({ formats: mapped, title: rResponse.data.title || 'YouTube Video' });
                    }
                }
            }
        } catch (e) { }

        // ==========================================
        // METHOD 4: Internal Library (Last Resort)
        // ==========================================
        console.log('[YOUTUBE] Final attempt with internal library...');
        try {
            const info = await ytdl.getInfo(url, {
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
                    }
                }
            });
            const videoFormats = info.formats.filter(f => f.hasVideo && f.hasAudio);
            if (videoFormats.length > 0) {
                return res.json({
                    formats: videoFormats.map(f => ({
                        url: f.url,
                        quality: f.qualityLabel || 'Download',
                        format: 'mp4',
                        hasAudio: true,
                        id: f.itag
                    })),
                    title: info.videoDetails.title
                });
            }
            throw new Error('No compatible formats found');
        } catch (err) {
            console.error('[YOUTUBE LIBRARY ERROR]:', err.message);
            return res.status(500).json({
                error: 'YouTube is currently blocking this request on the server. Please try again in 5 minutes or use a different video.',
                details: err.message
            });
        }

    } catch (globalErr) {
        console.error('[GLOBAL YOUTUBE ERROR]:', globalErr.message);
        res.status(500).json({ error: 'Internal Server Error during YouTube processing' });
    }
});



/**
 * YouTube: Stream Download (Proxy) - Needed if direct links 403
 */
app.get('/api/youtube/stream-download', async (req, res) => {
    const { url, id, ext } = req.query;
    if (!url) return res.status(400).send('URL is required');

    try {
        // For ytdl-core, we can use the original video URL and the 'itag' (id)
        // note: 'id' in frontend was format_id (string), here itag is number.
        // If the frontend sends the direct googlevideo URL, we can proxy it via our generic proxy
        // But let's try to stream using ytdl-core given the original video URL

        // Problem: The frontend passes the DIRECT googlevideo.com URL to this endpoint in some flows?
        // No, in the rewrite above, I'm sending back f.url which IS the direct link.
        // If the frontend tries to download that directly, it might get 403.
        // If it sends it here, we proxy it.

        console.log(`[YOUTUBE STREAM] Proxying: ${url}`);

        // Simple proxy for the direct URL
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="download.${ext || 'mp4'}"`);
        response.data.pipe(res);

    } catch (error) {
        console.error('[YOUTUBE PROXY ERROR]:', error.message);
        res.status(500).send('Proxy error');
    }
});

// Legacy stream endpoint (stubbed)
app.get('/api/youtube/stream', (req, res) => {
    res.status(400).send('Endpoint deprecated, use direct download');
});

// ========================================
// FACEBOOK API ENDPOINTS
// ========================================

/**
 * Facebook: Download Video
 */
app.post('/api/facebook/download', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`[FACEBOOK] Processing request for: ${url}`);

    try {
        // 1. Try RapidAPI first as requested
        console.log(`[FACEBOOK] Attempting RapidAPI (using ${process.env.FACEBOOK_API_KEY ? 'Specific' : 'Global'} Key)...`);
        const response = await axios.post('https://facebook-media-downloader1.p.rapidapi.com/get_media', {
            url: url
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'facebook-media-downloader1.p.rapidapi.com',
                'x-rapidapi-key': FACEBOOK_API_KEY
            },
            timeout: 10000 // 10s timeout for API
        }).catch(err => {
            console.error(`[FACEBOOK API ERROR] ${err.message}`);
            return { data: { success: false } };
        });

        const result = response.data;
        let formats = [];

        if (result && result.success && result.data) {
            const data = result.data;
            if (data.medias && Array.isArray(data.medias)) {
                data.medias.forEach(media => {
                    formats.push({
                        url: media.url,
                        quality: media.quality || 'Standard',
                        format: media.extension || 'mp4'
                    });
                });
            } else if (data.url) {
                formats.push({
                    url: data.url,
                    quality: 'High Quality',
                    format: 'mp4'
                });
            }
        }

        // 2. Error if RapidAPI failed
        if (formats.length === 0) {
            console.error('[FACEBOOK] RapidAPI yielded no results.');
            return res.status(404).json({ error: 'Failed to find download links for this Facebook video. It might be private or restricted.' });
        }

        console.log(`[FACEBOOK SUCCESS] Found ${formats.length} options via RapidAPI`);
        return res.json({
            formats: formats,
            title: result.data.title || 'Facebook Video',
            note: 'Download links retrieved via premium server.'
        });

    } catch (error) {
        console.error('[FACEBOOK CRITICAL ERROR]:', error.message);
        return res.status(500).json({ error: `System error: ${error.message}` });
    }
});

// ========================================
// INSTAGRAM API ENDPOINTS
// ========================================

/**
 * Instagram: Download Video/Reel
 */
app.post('/api/instagram/download', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`[INSTAGRAM] Processing request: ${url}`);

    try {
        // 1. Primary: RapidAPI
        try {
            console.log(`[INSTAGRAM] Attempting RapidAPI (using ${process.env.INSTAGRAM_API_KEY ? 'Specific' : 'Global'} Key)...`);
            const response = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
                params: { url: url },
                headers: {
                    'x-rapidapi-key': INSTAGRAM_API_KEY,
                    'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
                },
                timeout: 8000
            });

            if (response.data && response.data.success && response.data.links) {
                return res.json({
                    formats: response.data.links.map((l, i) => ({
                        url: l.link,
                        quality: l.quality || 'Download Video',
                        format: l.extension || 'mp4',
                        id: `ig-rapid-${i}`
                    })),
                    title: response.data.title || 'Instagram Post',
                    note: 'Download links retrieved via premium server.'
                });
            }
        } catch (e) { console.warn('[INSTAGRAM] RapidAPI failed'); }

        // 2. Fallback: Public API
        return res.status(404).json({ error: 'Instagram content not found or private. Try a public URL.' });

    } catch (error) {
        console.error('[INSTAGRAM ERROR]:', error.message);
        return res.status(500).json({ error: 'Failed to process Instagram request' });
    }
});

// ========================================
// TIKTOK API ENDPOINTS
// ========================================

/**
 * TikTok: Download Video
 */
app.post('/api/tiktok/download', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log(`[TIKTOK] Processing request: ${url}`);

        // 1. Primary: RapidAPI
        try {
            console.log(`[TIKTOK] Attempting RapidAPI (using ${process.env.TIKTOK_API_KEY ? 'Specific' : 'Global'} Key)...`);
            const response = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
                params: { url: url },
                headers: {
                    'x-rapidapi-key': TIKTOK_API_KEY,
                    'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
                },
                timeout: 8000
            });

            if (response.data && response.data.success && response.data.links) {
                return res.json({
                    formats: response.data.links.map((l, i) => ({
                        url: l.link,
                        quality: l.quality || 'Download Video',
                        format: l.extension || 'mp4',
                        id: `tt-rapid-${i}`
                    })),
                    title: response.data.title || 'TikTok Video',
                    note: 'Download links retrieved successfully.'
                });
            }
        } catch (e) { console.warn('[TIKTOK] RapidAPI failed'); }

        // 2. Fallback: SnapTik-style (Manual placeholder for now or common public API)
        return res.status(404).json({ error: 'TikTok video not found. Ensure the link is correct and public.' });

    } catch (error) {
        console.error('[TIKTOK ERROR]:', error.message);
        return res.status(500).json({ error: 'Failed to process TikTok request' });
    }
});

// TikTok streaming endpoint (Removed: Binary incompatibility with Vercel)
app.get('/api/tiktok/stream', (req, res) => {
    res.status(400).json({ error: 'Direct streaming is currently disabled. Please use the primary download links.' });
});

// ========================================
// UNIVERSAL PROXY ENDPOINT
// ========================================

/**
 * Universal Proxy: Fetches and streams files from external URLs to bypass 403/CORS errors.
 */
app.get('/api/proxy', async (req, res) => {
    const { url, filename } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        console.log(`[PROXY] Streaming: ${url}`);

        // Set dynamic referer based on URL
        let referer = 'https://www.google.com/';
        if (url.includes('facebook.com')) referer = 'https://www.facebook.com/';
        else if (url.includes('instagram.com')) referer = 'https://www.instagram.com/';
        else if (url.includes('tiktok.com')) referer = 'https://www.tiktok.com/';

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': referer
            },
            timeout: 30000
        });

        // Set headers for download
        const targetFilename = filename || 'video.mp4';
        res.setHeader('Content-Disposition', `attachment; filename="${targetFilename}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        // Pipe the stream
        response.data.pipe(res);

    } catch (error) {
        console.error(`[PROXY CRITICAL ERROR] Failed for: ${url}`);
        console.error(`[PROXY ERROR MESSAGE]: ${error.message}`);

        if (error.response) {
            console.error(`[PROXY STATUS]: ${error.response.status}`);
            console.error(`[PROXY HEADERS]:`, JSON.stringify(error.response.headers));

            // Try to log a snippet of error response body
            if (error.response.data && typeof error.response.data.on === 'function') {
                // It's a stream, we can't easily read it without piping, but we can try
                console.error('[PROXY ERROR BODY]: Response body is a stream.');
            } else {
                console.error(`[PROXY ERROR BODY]:`, String(JSON.stringify(error.response.data)).substring(0, 500));
            }

            return res.status(error.response.status).json({
                error: `Origin server returned ${error.response.status}`,
                details: error.message,
                origin: url.split('/')[2]
            });
        }
        res.status(500).json({ error: `Proxy failed: ${error.message}` });
    }
});

// ========================================
// LEGACY ENDPOINTS (for backward compatibility)
// ========================================
app.get('/api/info', (req, res) => res.redirect(307, `/api/youtube/info?${new URLSearchParams(req.query)}`));
app.post('/api/download', (req, res) => {
    req.body.format = req.body.format || 'video';
    res.redirect(307, '/api/youtube/download');
});

// ========================================
// SERVER STARTUP
// ========================================
// Final export for Vercel
module.exports = app;
