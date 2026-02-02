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
// NOTE: ytdl-core removed - doesn't work on Vercel's read-only filesystem

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
        const failureReasons = []; // Track why each method failed

        // ==========================================
        // METHOD 1: Cobalt API v10 (Updated Feb 2026)
        // ==========================================
        const cobaltInstances = [
            { url: 'https://api.cobalt.tools', endpoint: '/api/json' }, // Official (Best Quality)
            { url: 'https://cobalt-api.kwiatekmiki.com', endpoint: '/' }, // Backup (Works but no Content-Type)
            { url: 'https://cobalt.oup.us', endpoint: '/' },
            { url: 'https://cobalt.slpy.one', endpoint: '/' }
        ];

        for (const instance of cobaltInstances) {
            try {
                console.log(`[Attempt] Trying Cobalt Instance: ${instance.url}`);

                const response = await axios.post(`${instance.url}${instance.endpoint}`, {
                    url: url,
                    vQuality: '720',
                    filenamePattern: 'basic', // Force simple filename
                    disableMetadata: true     // Reduce header complexity
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Origin': 'https://cobalt.tools', // Spoof Origin for Official API
                        'Referer': 'https://cobalt.tools/', // Spoof Referer
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    },
                    timeout: 8000
                });

                if (response.data && response.data.url) {
                    // Success!
                    res.json({
                        title: 'Ready to Download',
                        url: null, // Legacy field
                        formats: [{
                            url: response.data.url, // The Direct Link (Tunnel)
                            quality: '720p',
                            format: 'mp4',
                            hasAudio: true
                        }]
                    });
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
                const reason = `Cobalt ${base}: ${err.response?.status || err.message}`;
                // Special handling for 400/401 which usually means bot protection or bad request
                if (err.response?.status === 400 || err.response?.status === 401) {
                    if (err.response?.data) console.warn(`[YOUTUBE] Cobalt Error Body:`, JSON.stringify(err.response.data).substring(0, 200));
                }
                failureReasons.push(reason);
                console.warn(`[YOUTUBE] ${reason}`);
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
                // ==========================================
                // METHOD 2: Invidious API (Working Instances - Feb 2026)
                // ==========================================
                const invidiousInstances = [
                    'https://inv.nadeko.net',
                    'https://invidious.privacyredirect.com',
                    'https://invidious.fdn.fr',
                    'https://inv.tux.pizza'
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
                        // Simplify logging
                    }
                }
            }
        } catch (e) {
            console.error('[YOUTUBE] Invidious fallback critical error:', e.message);
        }

        // ==========================================
        // METHOD 4: RapidAPI Fallback (OPTIONAL - only if key is set)
        // ==========================================
        if (process.env.YOUTUBE_API_KEY) {
            try {
                console.log(`[YOUTUBE] Attempting RapidAPI fallback (using Specific Key)...`);
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
                            console.log(`[YOUTUBE SUCCESS] RapidAPI linked successfully.`);
                            return res.json({ formats: mapped, title: rResponse.data.title || 'YouTube Video' });
                        }
                    }
                }
                console.warn(`[YOUTUBE] RapidAPI succeeded but returned no links`);
            } catch (e) {
                console.error(`[YOUTUBE] RapidAPI Method 4 failed: ${e.response?.status || e.message}`);
                if (e.response?.status === 401 || e.response?.status === 403) {
                    console.error(`[YOUTUBE] CRITICAL: RapidAPI Key might be invalid.`);
                }
            }
        } else {
            console.log('[YOUTUBE] Skipping RapidAPI (no YOUTUBE_API_KEY set)');
        }

        // ==========================================
        // METHOD 5: Alternative RapidAPI (YT API) - OPTIONAL
        // ==========================================
        if (process.env.YOUTUBE_API_KEY) {
            try {
                console.log(`[YOUTUBE] Trying Method 5 (YT API)...`);
                const ytResponse = await axios.get('https://yt-api.p.rapidapi.com/dl', {
                    params: { id: url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1] },
                    headers: {
                        'x-rapidapi-key': YOUTUBE_API_KEY,
                        'x-rapidapi-host': 'yt-api.p.rapidapi.com'
                    },
                    timeout: 8000
                });

                if (ytResponse.data && ytResponse.data.status === 'OK') {
                    const formats = (ytResponse.data.formats || []).map((f, i) => ({
                        url: f.url,
                        quality: f.qualityLabel || 'Download',
                        format: 'mp4',
                        hasAudio: true,
                        id: `ytapi-${i}`
                    }));
                    if (formats.length > 0) {
                        console.log(`[YOUTUBE SUCCESS] Method 5 Succeeded.`);
                        return res.json({ formats: formats, title: ytResponse.data.title || 'YouTube Video' });
                    }
                }
            } catch (e) {
                console.warn(`[YOUTUBE] Method 5 failed: ${e.response?.status || e.message}`);
            }
        } else {
            console.log('[YOUTUBE] Skipping Method 5 (no YOUTUBE_API_KEY set)');
        }

        // ==========================================
        // FINAL: All Methods Failed
        // ==========================================
        console.error('[YOUTUBE] All download methods exhausted');
        console.error('[YOUTUBE] Failure summary:', failureReasons);
        return res.json({
            error: 'Unable to download this video using free methods.',
            details: `Tried ${failureReasons.length} methods. Failures: ${failureReasons.join(' | ')}`,
            hint: 'All free APIs failed. This video might be restricted. For better reliability, add your own RapidAPI key (free tier available) - check SETUP.md for instructions.',
            debugInfo: failureReasons
        });

    } catch (globalErr) {
        console.error('[GLOBAL YOUTUBE ERROR]:', globalErr.message);
        res.status(500).json({ error: 'Internal Server Error during YouTube processing', details: globalErr.message });
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
        console.log(`[PROXY] Redirecting to: ${url}`);

        // VERCEL LIMITATION FIX:
        // We cannot stream large files through Vercel Serverless Functions due to 
        // execution time limits (10s) and body size limits (4.5MB).
        // Attempting to pipe streams results in 0-byte downloads or timeouts.
        // We MUST redirect the client to the upstream URL directly.

        return res.redirect(302, url);

    } catch (error) {
        console.error(`[PROXY ERROR] Direct redirect failed? ${error.message}`);
        res.status(500).send('Redirect failed');
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
