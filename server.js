const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from root directory
app.use(express.static(path.join(__dirname, 'public')));


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
        console.log(`[YOUTUBE DOWNLOAD] Fetching formats for: ${url}`);
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        const formats = info.formats;

        if (format === 'audio') {
            // Audio extraction
            const audioFormats = formats.filter(f => f.hasAudio && !f.hasVideo);
            const uniqueAudio = audioFormats.map(f => ({
                url: f.url,
                quality: `Download Audio (${f.audioBitrate}kbps)`,
                bitrate: f.audioBitrate,
                format: 'mp3',
                id: f.itag
            })).sort((a, b) => b.bitrate - a.bitrate);

            res.json({
                formats: uniqueAudio,
                title: title,
                note: 'Direct audio links generated.'
            });

        } else {
            // Video download
            // Filter for formats that have both video and audio (progressive)
            const videoFormats = formats.filter(f => f.hasVideo && f.hasAudio);

            const uniqueVideos = videoFormats.map(f => ({
                url: f.url,
                quality: `Download ${f.qualityLabel || 'Unknown'}`,
                height: f.height,
                format: f.container || 'mp4',
                hasAudio: true,
                id: f.itag
            })).sort((a, b) => b.height - a.height);

            res.json({
                formats: uniqueVideos,
                title: title,
                note: 'Direct video links generated.'
            });
        }

    } catch (error) {
        console.error('[YOUTUBE ERROR]:', error.message);
        res.status(500).json({ error: `Failed to fetch formats: ${error.message}` });
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
        console.log(`[FACEBOOK] Attempting RapidAPI...`);
        const response = await axios.post('https://facebook-media-downloader1.p.rapidapi.com/get_media', {
            url: url
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'facebook-media-downloader1.p.rapidapi.com',
                'x-rapidapi-key': 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267'
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

        // 2. Fallback to yt-dlp if RapidAPI failed or no links found
        if (formats.length === 0) {
            console.log(`[FACEBOOK] RapidAPI yielded no results. Falling back to yt-dlp...`);
            const { exec } = require('child_process');
            const binaryPath = path.join(__dirname, 'yt-dlp.exe');
            const args = [
                `"${url}"`,
                '--dump-single-json',
                '--no-check-certificates',
                '--no-warnings',
                '--prefer-free-formats',
                '--no-update',
                '--add-header', '"User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"',
                '--add-header', '"Referer:https://www.facebook.com/"'
            ];

            exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('[FACEBOOK FALLBACK ERROR] yt-dlp failed:', error.message);
                    return res.status(404).json({ error: 'Failed to find download links via API or local scraper. This video might be private or restricted.' });
                }

                try {
                    const info = JSON.parse(stdout);
                    const title = info.title || 'Facebook Video';
                    const ytdlFormats = info.formats || [];

                    // Filter and refine formats - Only show videos WITH audio
                    const uniqueFormats = [];
                    ytdlFormats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url).forEach(f => {
                        uniqueFormats.push({
                            url: f.url,
                            quality: 'Download',
                            format: f.ext || 'mp4'
                        });
                    });

                    if (uniqueFormats.length === 0) {
                        return res.status(404).json({ error: 'No downloadable formats found for this content.' });
                    }

                    console.log(`[FACEBOOK SUCCESS] Found ${uniqueFormats.length} options via yt-dlp`);
                    return res.json({
                        formats: uniqueFormats.slice(0, 5), // Limit to top 5
                        title: title,
                        note: 'Download links retrieved via global scraper.'
                    });

                } catch (parseErr) {
                    console.error('[FACEBOOK FALLBACK ERROR] JSON parse failed:', parseErr);
                    res.status(500).json({ error: 'Failed to process video metadata' });
                }
            });
            return; // Exit here as res will be handled in callback
        }

        console.log(`[FACEBOOK SUCCESS] Found ${formats.length} options via RapidAPI`);
        res.json({
            formats: formats,
            title: result.data.title || 'Facebook Video',
            note: 'Download links retrieved via RapidAPI.'
        });

    } catch (error) {
        console.error('[FACEBOOK CRITICAL ERROR]:', error.message);
        res.status(500).json({ error: `System error: ${error.message}` });
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

    // Clean URL (remove query params)
    const cleanUrl = url.split('?')[0];
    console.log(`[INSTAGRAM] Processing request for: ${cleanUrl}`);

    try {
        const { exec } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');

        console.log(`[INSTAGRAM] Using yt-dlp as primary method...`);
        const args = [
            `"${cleanUrl}"`,
            '--dump-single-json',
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--no-update',
            '--add-header', '"User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"',
            '--add-header', '"Referer:https://www.instagram.com/"'
        ];

        exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('[INSTAGRAM ERROR] yt-dlp failed:', error.message);
                return res.status(404).json({
                    error: 'Failed to download Instagram content. The post might be private, deleted, or temporarily unavailable.'
                });
            }

            try {
                const info = JSON.parse(stdout);
                const title = info.title || 'Instagram Content';
                const ytdlFormats = info.formats || [];

                // Filter and refine formats - Only show videos WITH audio
                const uniqueFormats = [];
                ytdlFormats.filter(f => f.url && f.acodec !== 'none').forEach(f => {
                    uniqueFormats.push({
                        url: f.url,
                        quality: 'Download',
                        format: f.ext || 'mp4'
                    });
                });

                if (uniqueFormats.length === 0) {
                    return res.status(404).json({ error: 'No downloadable formats found for this content.' });
                }

                console.log(`[INSTAGRAM SUCCESS] Found ${uniqueFormats.length} options via yt-dlp`);
                return res.json({
                    formats: uniqueFormats.slice(0, 5),
                    title: title,
                    note: 'Download links retrieved via secure scraper.'
                });

            } catch (parseErr) {
                console.error('[INSTAGRAM ERROR] JSON parse failed:', parseErr);
                res.status(500).json({ error: 'Failed to process video metadata' });
            }
        });

    } catch (error) {
        console.error('[INSTAGRAM ERROR]:', error.message);
        res.status(500).json({ error: `Failed to download Instagram content: ${error.message}` });
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
        const Tiktok = require('@tobyg74/tiktok-api-dl');
        const { spawn } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');

        let finalUrl = url;
        console.log(`[TIKTOK] Processing request for: ${url}`);

        // Resolve short URLs if needed
        if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
            try {
                const head = await axios.head(url, { maxRedirects: 5 });
                finalUrl = head.request.res.responseUrl || url;
                console.log(`[TIKTOK] Resolved short URL to: ${finalUrl}`);
            } catch (resolveErr) {
                console.warn('[TIKTOK] URL resolution failed, using original:', resolveErr.message);
            }
        }

        // Try library first for metadata
        let libResult;
        const versions = ["v3", "v2", "v1"];

        for (const v of versions) {
            try {
                console.log(`[TIKTOK] Attempting library fetch with version: ${v}`);
                libResult = await Tiktok.Downloader(finalUrl, { version: v });
                if (libResult && libResult.status === 'success' && libResult.result) break;
            } catch (e) {
                console.error(`[TIKTOK] Library ${v} failed:`, e.message);
            }
        }

        let title = 'TikTok Video';
        let thumbnail = '';

        if (libResult && libResult.status === 'success' && libResult.result) {
            const data = libResult.result;
            title = data.description || title;
            thumbnail = data.cover || thumbnail;
        }

        // Return streaming endpoint instead of direct URLs
        console.log(`[TIKTOK SUCCESS] Returning streaming endpoint`);
        return res.json({
            title,
            thumbnail,
            formats: [
                {
                    url: `/api/tiktok/stream?url=${encodeURIComponent(finalUrl)}&quality=best`,
                    quality: 'Download Video',
                    format: 'mp4'
                }
            ],
            note: 'Video will be streamed through server to bypass restrictions.'
        });

    } catch (globalError) {
        console.error('[TIKTOK CRITICAL ERROR]:', globalError);
        res.status(500).json({ error: `System error: ${globalError.message}` });
    }
});

// TikTok streaming endpoint
app.get('/api/tiktok/stream', async (req, res) => {
    const { url, quality } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const { spawn } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');

        console.log(`[TIKTOK STREAM] Streaming video for: ${url}`);

        res.setHeader('Content-Disposition', 'attachment; filename="tiktok_video.mp4"');
        res.setHeader('Content-Type', 'video/mp4');

        // Use format selection that ensures video+audio in a single file
        const args = [
            url,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4',
            '-o', '-',
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--no-update',
            '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            '--add-header', 'Referer:https://www.tiktok.com/'
        ];

        const ytdlProcess = spawn(binaryPath, args);

        ytdlProcess.stdout.pipe(res);

        ytdlProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.includes('ERROR')) {
                console.error(`[TIKTOK STREAM ERROR] ${msg}`);
            }
        });

        ytdlProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[TIKTOK STREAM] Process exited with code ${code}`);
                if (!res.headersSent) {
                    res.status(500).send('Stream failed');
                }
            }
        });

        ytdlProcess.on('error', (error) => {
            console.error('[TIKTOK STREAM ERROR]:', error.message);
            if (!res.headersSent) {
                res.status(500).send('Stream error: ' + error.message);
            }
        });

    } catch (error) {
        console.error('[TIKTOK STREAM ERROR]:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Stream error: ' + error.message);
        }
    }
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
app.listen(PORT, () => {
    console.log('\n🚀 EasyDownloader Backend is up and running!');
    console.log(`🏠 URL: http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${__dirname}`);
    console.log('\n📡 Available Endpoints:');
    console.log('   ✅ YouTube: /api/youtube/info, /api/youtube/download');
    console.log('   ✅ Facebook: /api/facebook/download');
    console.log('   ✅ Instagram: /api/instagram/download');
    console.log('   ✅ TikTok: /api/tiktok/download');
    console.log('');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`
❌ ERROR: Port ${PORT} is already being used!
--------------------------------------------------
This means an OLD version of the server is still running.
Please CLOSE all other black terminal windows and 
double-click "run_me.bat" again.
--------------------------------------------------
        `);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

module.exports = app;
