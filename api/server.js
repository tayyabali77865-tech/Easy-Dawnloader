const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

// Initialize environment variables (for local dev)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Use User's RapidAPI Key
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';

// Middleware
app.use(cors());
app.use(express.json());

// HTTPS Agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * YouTube: Fetch Video Metadata via YouTube oEmbed
 */
app.get('/api/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
            httpsAgent: httpsAgent,
            timeout: 5000
        });

        res.json({
            title: response.data.title,
            thumbnail_url: response.data.thumbnail_url,
            author_name: response.data.author_name
        });
    } catch (error) {
        console.error('[YOUTUBE ERROR] Metadata fetch failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch video metadata' });
    }
});

/**
 * YouTube: Fetch Download Options
 */
app.post('/api/youtube/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`[YOUTUBE DOWNLOAD] Processing: ${url}`);
    const failureReasons = [];

    try {
        // ==========================================
        // METHOD 1: RapidAPI (MOST RELIABLE ON VERCEL)
        // ==========================================
        if (RAPIDAPI_KEY) {
            try {
                console.log(`[Attempt] RapidAPI: social-media-video-downloader...`);
                const rResponse = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
                    params: { url: url },
                    headers: {
                        'x-rapidapi-key': RAPIDAPI_KEY,
                        'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
                    },
                    timeout: 8000
                });

                if (rResponse.data && rResponse.data.success && rResponse.data.links) {
                    const links = rResponse.data.links;
                    // Flexible mapping - grab anything that looks like a video or audio
                    const mapped = links.map((l, i) => ({
                        url: l.link,
                        quality: l.quality || (l.type === 'video' ? 'Video' : 'Audio'),
                        format: l.extension || 'mp4',
                        hasAudio: true,
                        id: `rapid-${i}`
                    }));

                    if (mapped.length > 0) {
                        return res.json({
                            title: rResponse.data.title || 'YouTube Video',
                            formats: mapped
                        });
                    }
                }
            } catch (e) {
                console.warn(`[Fail] RapidAPI: ${e.message}`);
                failureReasons.push(`RapidAPI: ${e.message}`);
            }
        }

        // ==========================================
        // METHOD 2: Cobalt API v10 (Official & Mirrors)
        // ==========================================
        const cobaltInstances = [
            { url: 'https://api.cobalt.tools', endpoint: '/api/json', official: true },
            { url: 'https://co.wuk.sh', endpoint: '/api/json' },
            { url: 'https://cobalt-api.kwiatekmiki.com', endpoint: '/' }
        ];

        for (const instance of cobaltInstances) {
            try {
                const apiUrl = `${instance.url}${instance.endpoint}`;
                console.log(`[Attempt] Cobalt: ${apiUrl}`);

                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };

                if (instance.official) {
                    headers['Origin'] = 'https://cobalt.tools';
                    headers['Referer'] = 'https://cobalt.tools/';
                    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
                }

                // Cobalt v10 Request Body
                const response = await axios.post(apiUrl, {
                    url: url,
                    videoQuality: '720',
                    filenameStyle: 'basic',
                    isAudioOnly: format === 'audio'
                }, { headers, timeout: 5000 });

                const data = response.data;

                // Case: Direct Download
                if (data.url) {
                    return res.json({
                        title: 'Ready',
                        formats: [{ url: data.url, quality: '720p', format: 'mp4', hasAudio: true }]
                    });
                }

                // Case: Picker (Items)
                if (data.picker && Array.isArray(data.picker)) {
                    const formats = data.picker.map((p, i) => ({
                        url: p.url,
                        quality: p.quality || (p.type === 'video' ? 'Video' : 'Audio'),
                        format: 'mp4',
                        hasAudio: true,
                        id: `cobalt-${i}`
                    }));
                    if (formats.length > 0) {
                        return res.json({ title: 'Ready', formats });
                    }
                }
            } catch (err) {
                const errMsg = err.response?.data?.text || err.message;
                console.warn(`[Fail] Cobalt ${instance.url}: ${errMsg}`);
                failureReasons.push(`${instance.url}: ${errMsg}`);
            }
        }

        // ==========================================
        // METHOD 3: Invidious Fallback
        // ==========================================
        const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            try {
                console.log(`[Attempt] Invidious: Nadeko...`);
                const invResp = await axios.get(`https://inv.nadeko.net/api/v1/videos/${videoId}`, { timeout: 4000 });
                const streams = [...(invResp.data.formatStreams || []), ...(invResp.data.adaptiveFormats || [])];
                if (streams.length > 0) {
                    const formats = streams.slice(0, 5).map((s, i) => ({
                        url: s.url,
                        quality: s.qualityLabel || 'Standard',
                        format: s.container || 'mp4',
                        hasAudio: true,
                        id: `inv-${i}`
                    }));
                    return res.json({ title: invResp.data.title, formats });
                }
            } catch (e) {
                console.warn(`[Fail] Invidious: ${e.message}`);
            }
        }

        // ==========================================
        // FINAL FAILURE
        // ==========================================
        return res.status(500).json({
            error: 'No download options available for this video.',
            hint: 'This video might be private, restricted, or all API credits are exhausted.',
            debug: failureReasons.slice(0, 3)
        });

    } catch (err) {
        console.error('[CRITICAL] Final Catch:', err.message);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// Other endpoints (minimal placeholders)
app.post('/api/facebook/download', (req, res) => res.status(501).json({ error: 'Coming soon' }));
app.post('/api/instagram/download', (req, res) => res.status(501).json({ error: 'Coming soon' }));
app.post('/api/tiktok/download', (req, res) => res.status(501).json({ error: 'Coming soon' }));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
