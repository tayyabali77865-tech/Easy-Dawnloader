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

// HTTPS Agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// ========================================
// YOUTUBE API ENDPOINTS
// ========================================

// Vercel routes /api/* to this file. 
// So app.get('/youtube/info') maps to /api/youtube/info.

app.get('/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    try {
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { httpsAgent });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video metadata' });
    }
});

app.post('/youtube/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    try {
        const { exec } = require('child_process');
        // If in api/, yt-dlp is in the parent directory (root)
        const binaryPath = process.platform === 'win32' ? path.join(__dirname, '..', 'yt-dlp.exe') : path.join(__dirname, '..', 'yt-dlp');
        const args = [`"${url}"`, '--dump-single-json', '--no-check-certificates', '--no-warnings', '--prefer-free-formats', '--no-update'];
        exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
            if (error) return res.status(500).json({ error: 'yt-dlp failed' });
            try {
                const info = JSON.parse(stdout);
                const title = info.title;
                const formats = info.formats || [];
                if (format === 'audio') {
                    const uniqueAudio = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none').map(f => ({
                        url: f.url, quality: `${Math.round(f.abr || 0)}kbps`, format: 'mp3', id: f.format_id
                    }));
                    res.json({ formats: uniqueAudio, title });
                } else {
                    const uniqueVideos = Array.from(formats.filter(f => f.vcodec !== 'none').reduce((map, f) => {
                        const height = f.height;
                        if (height && (!map.has(height) || (f.acodec !== 'none' && !map.get(height).acodec))) map.set(height, f);
                        return map;
                    }, new Map()).values()).map(f => ({
                        url: f.url, quality: `${f.height}p`, format: f.ext || 'mp4', hasAudio: f.acodec !== 'none', id: f.format_id
                    })).sort((a, b) => b.height - a.height);
                    res.json({ formats: uniqueVideos, title });
                }
            } catch (e) { res.status(500).json({ error: 'Parse failed' }); }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/youtube/stream-download', async (req, res) => {
    const { url, id, ext } = req.query;
    try {
        const { spawn } = require('child_process');
        const binaryPath = process.platform === 'win32' ? path.join(__dirname, '..', 'yt-dlp.exe') : path.join(__dirname, '..', 'yt-dlp');
        res.setHeader('Content-Disposition', `attachment; filename="download.${ext || 'mp4'}"`);
        res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        const args = [url, '-f', id, '-o', '-', '--no-check-certificates', '--no-warnings', '--no-update'];
        const ytdl = spawn(binaryPath, args);
        ytdl.stdout.pipe(res);
    } catch (e) { res.status(500).send(e.message); }
});

// FACEBOOK, INSTAGRAM, TIKTOK
app.post('/facebook/download', async (req, res) => {
    try {
        const { facebook } = require('@mrnima/facebook-downloader');
        const result = await facebook(req.body.url);
        const formats = [];
        if (result.links.Download_High) formats.push({ url: result.links.Download_High, quality: 'HD', format: 'mp4' });
        if (result.links.Download_Low) formats.push({ url: result.links.Download_Low, quality: 'SD', format: 'mp4' });
        res.json({ formats, title: result.title || 'Facebook Video' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/instagram/download', async (req, res) => {
    try {
        const { instagramGetUrl } = require('instagram-url-direct');
        const result = await instagramGetUrl(req.body.url);
        const formats = result.url_list.map((u, i) => ({ url: u, quality: i === 0 ? 'High' : 'Standard', format: 'mp4' }));
        res.json({ formats, title: 'Instagram' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/tiktok/download', async (req, res) => {
    try {
        const TiktokApiDl = require('@tobyg74/tiktok-api-dl');
        const result = await TiktokApiDl.Downloader(req.body.url, { version: "v3" });
        const formats = [];
        if (result.result.video) formats.push({ url: result.result.video, quality: 'No Watermark', format: 'mp4' });
        if (result.result.music) formats.push({ url: result.result.music, quality: 'Audio', format: 'mp3' });
        res.json({ formats, title: result.result.title || 'TikTok' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Legacy
app.get('/info', (req, res) => res.redirect(307, `/api/youtube/info?${new URLSearchParams(req.query)}`));
app.post('/download', (req, res) => res.redirect(307, '/api/youtube/download'));

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;



