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
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// HTTPS Agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// ========================================
// YOUTUBE API ENDPOINTS
// ========================================

/**
 * YouTube: Fetch Video Metadata via YouTube oEmbed
 */
app.get('/api/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log(`[YOUTUBE INFO] Fetching metadata for: ${url}`);
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
            httpsAgent: httpsAgent
        });
        res.json(response.data);
    } catch (error) {
        console.error('[YOUTUBE ERROR] Metadata fetch failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch video metadata from YouTube' });
    }
});

/**
 * YouTube: Fetch Download Link using local yt-dlp binary
 */
app.post('/api/youtube/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const { exec } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');

        console.log(`[YOUTUBE DOWNLOAD] Fetching metadata via yt-dlp for: ${url}`);

        // Arguments for metadata fetch
        const args = [
            `"${url}"`,
            '--dump-single-json',
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--no-update'
        ];

        // Execute yt-dlp
        exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('[YOUTUBE ERROR] yt-dlp failed:', error.message);
                return res.status(500).json({ error: 'Failed to fetch video info via yt-dlp' });
            }

            try {
                const info = JSON.parse(stdout);
                const title = info.title;
                const formats = info.formats || [];

                if (format === 'audio') {
                    // Audio download (MP3)
                    const audioFormats = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');

                    const uniqueAudio = [];
                    const seenBitrates = new Set();

                    audioFormats.forEach(f => {
                        const bitrate = Math.round(f.abr || 0);
                        if (bitrate > 0 && !seenBitrates.has(bitrate)) {
                            seenBitrates.add(bitrate);
                            uniqueAudio.push({
                                url: f.url,
                                quality: `${bitrate}kbps`,
                                bitrate: bitrate,
                                format: 'mp3',
                                id: f.format_id
                            });
                        }
                    });

                    uniqueAudio.sort((a, b) => b.bitrate - a.bitrate);

                    res.json({
                        formats: uniqueAudio,
                        title: title,
                        note: 'Downloads are proxied through the server.'
                    });

                } else {
                    // Video download
                    const videoFormats = formats.filter(f => f.vcodec !== 'none');
                    const formatsByHeight = new Map();

                    videoFormats.forEach(f => {
                        const height = f.height;
                        if (!height) return;

                        const hasAudio = f.acodec !== 'none';
                        const currentBest = formatsByHeight.get(height);

                        // Logic: Prefer formats with audio
                        if (!currentBest || (hasAudio && !currentBest.hasAudio)) {
                            formatsByHeight.set(height, {
                                ...f,
                                hasAudio: hasAudio
                            });
                        }
                    });

                    // Convert to array
                    const uniqueVideos = Array.from(formatsByHeight.values()).map(f => ({
                        url: f.url,
                        quality: `${f.height}p`,
                        height: f.height,
                        format: f.ext || 'mp4',
                        hasAudio: f.hasAudio,
                        id: f.format_id
                    }));

                    uniqueVideos.sort((a, b) => b.height - a.height);

                    console.log(`[YOUTUBE SUCCESS] Found ${uniqueVideos.length} refined options`);

                    res.json({
                        formats: uniqueVideos,
                        title: title,
                        note: 'High quality videos (1080p+) may not have audio. Look for the mute icon.'
                    });
                }

            } catch (parseErr) {
                console.error('[YOUTUBE ERROR] JSON parse failed:', parseErr);
                res.status(500).json({ error: 'Failed to parse video metadata' });
            }
        });

    } catch (error) {
        console.error('[YOUTUBE ERROR]:', error.message);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

/**
 * YouTube: Stream Download (Proxy)
 * Pipes the video content directly from local yt-dlp binary to the client response.
 */
app.get('/api/youtube/stream-download', async (req, res) => {
    const { url, id, ext } = req.query;

    if (!url || !id) {
        return res.status(400).send('URL and ID are required');
    }

    try {
        const { spawn } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');

        console.log(`[YOUTUBE PROXY] Streaming format ${id} for: ${url} (ext: ${ext})`);

        // Set headers based on format
        const isAudio = ext === 'mp3';
        const filename = `download.${ext || 'mp4'}`;
        const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);

        // Spawn yt-dlp to stream content to stdout
        const args = [
            url,
            '-f', id,
            '-o', '-',
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--no-update'
        ];

        const ytdlProcess = spawn(binaryPath, args);

        ytdlProcess.stdout.pipe(res);

        ytdlProcess.stderr.on('data', (data) => {
            // Only log errors, not progress
            const msg = data.toString();
            if (msg.includes('ERROR')) console.error(`[YOUTUBE STREAM ERROR] ${msg}`);
        });

        ytdlProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(`[YOUTUBE STREAM] Exited with code ${code}`);
            }
        });

    } catch (error) {
        console.error('[YOUTUBE PROXY ERROR]:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Proxy error: ' + error.message);
        }
    }
});

/**
 * YouTube: Stream video/audio through server (Legacy Stream Endpoint for /stream)
 */
app.get('/api/youtube/stream', async (req, res) => {
    // Legacy endpoint, keeping it but it might fail if we removed youtube-dl-exec usage?
    // Actually our new setup downloads yt-dlp.exe. 
    // This endpoint spawns 'yt-dlp'. If we rely on yt-dlp.exe in CWD, we should update this too.
    // BUT the user didn't ask to fix this one specifically. I'll leave it or update it to be safe.
    // I'll update it to use local binary.
    const { v: videoId, type, title } = req.query;

    if (!videoId) {
        return res.status(400).send('Video ID is required');
    }

    try {
        const { spawn } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');
        const url = `https://www.youtube.com/watch?v=${videoId}`;

        console.log(`[YOUTUBE STREAM] Streaming ${type} for: ${videoId}`);

        // Set appropriate headers
        const filename = `${title || videoId}.${type === 'audio' ? 'mp3' : 'mp4'}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');

        // Build youtube-dl command
        const args = [
            url,
            '-o', '-',  // Output to stdout
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--no-update'
        ];

        if (type === 'audio') {
            args.push('-x');  // Extract audio
            args.push('--audio-format', 'mp3');
            args.push('--audio-quality', '0');  // Best quality
        } else {
            args.push('-f', 'best[ext=mp4]');  // Best MP4 format
        }

        // Spawn youtube-dl process
        const ytdlProcess = spawn(binaryPath, args);

        ytdlProcess.stdout.pipe(res);

        ytdlProcess.stderr.on('data', (data) => {
            console.error(`[YOUTUBE STREAM] ${data.toString()}`);
        });

        ytdlProcess.on('error', (error) => {
            console.error('[YOUTUBE STREAM ERROR]:', error.message);
            if (!res.headersSent) {
                res.status(500).send('Stream error: ' + error.message);
            }
        });

        ytdlProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[YOUTUBE STREAM] Process exited with code ${code}`);
            }
        });

    } catch (error) {
        console.error('[YOUTUBE STREAM ERROR]:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Failed to stream video: ' + error.message);
        }
    }
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

    try {
        const { facebook } = require('@mrnima/facebook-downloader');

        console.log(`[FACEBOOK] Fetching download links for: ${url}`);

        const result = await facebook(url);

        if (!result || !result.links) {
            return res.status(404).json({ error: 'No download links found for this Facebook video.' });
        }

        const formats = [];

        // Add HD quality if available
        if (result.links.Download_High) {
            formats.push({
                url: result.links.Download_High,
                quality: 'HD',
                format: 'mp4'
            });
        }

        // Add SD quality if available
        if (result.links.Download_Low) {
            formats.push({
                url: result.links.Download_Low,
                quality: 'SD',
                format: 'mp4'
            });
        }

        if (formats.length === 0) {
            return res.status(404).json({ error: 'No downloadable formats found.' });
        }

        console.log(`[FACEBOOK SUCCESS] Found ${formats.length} quality options`);

        res.json({
            formats: formats,
            title: result.title || 'Facebook Video',
            thumbnail: result.thumbnail || '',
            note: 'Click download immediately - links may expire'
        });
    } catch (error) {
        console.error('[FACEBOOK ERROR]:', error.message);
        res.status(500).json({ error: `Failed to download Facebook video: ${error.message}` });
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

    try {
        const { instagramGetUrl } = require('instagram-url-direct');
        console.log(`[INSTAGRAM] Fetching download links for: ${url}`);
        const result = await instagramGetUrl(url);
        if (!result || !result.url_list || result.url_list.length === 0) {
            return res.status(404).json({ error: 'No download links found for this Instagram content.' });
        }
        const formats = result.url_list.map((videoUrl, index) => ({
            url: videoUrl,
            quality: index === 0 ? 'High Quality' : `Quality ${index + 1}`,
            format: 'mp4'
        }));
        res.json({
            formats: formats,
            title: 'Instagram Content',
            thumbnail: result.thumbnail || '',
            note: 'Click download immediately - links may expire'
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
        const TiktokApiDl = require('@tobyg74/tiktok-api-dl');

        console.log(`[TIKTOK] Fetching download links for: ${url}`);

        const result = await TiktokApiDl.Downloader(url, {
            version: "v3"
        });

        if (!result || result.status !== 'success' || !result.result) {
            return res.status(404).json({ error: 'No download links found for this TikTok video.' });
        }

        const formats = [];
        const data = result.result;

        // Add no watermark version if available
        if (data.video) {
            formats.push({
                url: data.video,
                quality: 'No Watermark',
                format: 'mp4'
            });
        }

        // Add watermark version if available
        if (data.video_hd || data.video_sd) {
            formats.push({
                url: data.video_hd || data.video_sd,
                quality: data.video_hd ? 'HD (With Watermark)' : 'SD (With Watermark)',
                format: 'mp4'
            });
        }

        // Add audio if available
        if (data.music) {
            formats.push({
                url: data.music,
                quality: 'Audio Only',
                format: 'mp3'
            });
        }

        if (formats.length === 0) {
            return res.status(404).json({ error: 'No downloadable formats found.' });
        }

        console.log(`[TIKTOK SUCCESS] Found ${formats.length} download options`);

        res.json({
            formats: formats,
            title: data.title || 'TikTok Video',
            thumbnail: data.cover || '',
            note: 'Click download immediately - links may expire'
        });
    } catch (error) {
        console.error('[TIKTOK ERROR]:', error.message);
        res.status(500).json({ error: `Failed to download TikTok video: ${error.message}` });
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
