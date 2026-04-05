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

app.get('/api/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    try {
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { httpsAgent });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/youtube/download', async (req, res) => {
    const { url, format } = req.body;
    try {
        const { exec } = require('child_process');
        const binaryPath = process.platform === 'win32' ? path.join(__dirname, 'yt-dlp.exe') : path.join(__dirname, 'yt-dlp');
        const args = [`"${url}"`, '--dump-single-json', '--no-check-certificates', '--no-warnings', '--prefer-free-formats', '--no-update'];
        exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
            if (error) return res.status(500).json({ error: 'Failed' });
            const info = JSON.parse(stdout);
            const formats = info.formats || [];
            if (format === 'audio') {
                const uniqueAudio = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none').map(f => ({ url: f.url, quality: '320kbps', format: 'mp3', id: f.format_id }));
                res.json({ formats: uniqueAudio, title: info.title });
            } else {
                const uniqueVideos = Array.from(formats.filter(f => f.vcodec !== 'none').reduce((m, f) => { m.set(f.height, f); return m; }, new Map()).values()).map(f => ({ url: f.url, quality: f.height + 'p', format: f.ext, id: f.format_id }));
                res.json({ formats: uniqueVideos, title: info.title });
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/youtube/stream-download', async (req, res) => {
    const { url, id, ext } = req.query;
    try {
        const { spawn } = require('child_process');
        const binaryPath = process.platform === 'win32' ? path.join(__dirname, 'yt-dlp.exe') : path.join(__dirname, 'yt-dlp');
        res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        const ytdl = spawn(binaryPath, [url, '-f', id, '-o', '-', '--no-check-certificates', '--no-update']);
        ytdl.stdout.pipe(res);
    } catch (e) { res.status(500).send(e.message); }
});

// OTHER
app.post('/api/facebook/download', async (req, res) => {
    try {
        const { facebook } = require('@mrnima/facebook-downloader');
        const result = await facebook(req.body.url);
        res.json({ formats: [{ url: result.links.Download_High, quality: 'HD' }], title: result.title });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/instagram/download', async (req, res) => {
    try {
        const { instagramGetUrl } = require('instagram-url-direct');
        res.json({ formats: (await instagramGetUrl(req.body.url)).url_list.map(u => ({ url: u })), title: 'Instagram' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tiktok/download', async (req, res) => {
    try {
        const TiktokApiDl = require('@tobyg74/tiktok-api-dl');
        const result = await TiktokApiDl.Downloader(req.body.url, { version: "v3" });
        res.json({ formats: [{ url: result.result.video }], title: 'TikTok' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Run on ${PORT}`));
}
module.exports = app;
