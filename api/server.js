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
        console.log(`[YOUTUBE INFO] Fetching metadata: ${url}`);
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
            httpsAgent: httpsAgent
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

    try {
        console.log(`[YOUTUBE DOWNLOAD] URL: ${url} (Format: ${format})`);
        const failureReasons = [];

        // ==========================================
        // METHOD 1: Cobalt API (Direct + Proxy Masking)
        // ==========================================
        const cobaltInstances = [
            { url: 'https://api.cobalt.tools', endpoint: '/api/json', official: true },
            { url: 'https://co.wuk.sh', endpoint: '/api/json' },
            { url: 'https://cobalt-api.kwiatekmiki.com', endpoint: '/' },
            { url: 'https://cobalt.succoon.com', endpoint: '/api/json' },
            { url: 'https://cobalt.steamys.com', endpoint: '/api/json' },
            { url: 'https://cobalt.slpy.one', endpoint: '/api/json' },
            { url: 'https://cobalt.oup.us', endpoint: '/api/json' }
        ];

        // Helper to send success
        const sendSuccess = (data) => {
            return res.json({
                title: 'Ready to Download',
                formats: data.url ? [{ url: data.url, quality: '720p', format: 'mp4', hasAudio: true }] : []
            });
        };

        // Helper to handle picker
        const sendPicker = (picker) => {
            const formats = picker.map((p, i) => ({
                url: p.url,
                quality: p.type === 'video' ? (p.quality || 'Video') : 'Audio',
                format: 'mp4',
                hasAudio: p.type === 'video',
                id: `cobalt-${i}`
            }));
            return res.json({ title: 'Ready to Download', formats });
        };

        for (const instance of cobaltInstances) {
            // Strategy: Try Direct, then try via Proxy
            const methods = [
                { name: 'Direct', useProxy: false },
                { name: 'Proxy', useProxy: true }
            ];

            for (const method of methods) {
                try {
                    // Skip proxy for official instance (it's too strict with headers)
                    if (instance.official && method.useProxy) continue;

                    const apiUrl = method.useProxy
                        ? `https://corsproxy.io/?url=${encodeURIComponent(instance.url + instance.endpoint)}`
                        : `${instance.url}${instance.endpoint}`;

                    console.log(`[Attempt] ${method.name} -> ${instance.url}`);

                    const headers = {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    };

                    if (instance.official && !method.useProxy) {
                        headers['Origin'] = 'https://cobalt.tools';
                        headers['Referer'] = 'https://cobalt.tools/';
                        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
                    }

                    const response = await axios.post(apiUrl, {
                        url: url,
                        vQuality: '720',
                        filenamePattern: 'basic',
                        disableMetadata: true
                    }, { headers, timeout: method.useProxy ? 10000 : 5000 });

                    const data = response.data;

                    if (data.url) return sendSuccess(data);
                    if ((data.status === 'picker' || data.picker) && Array.isArray(data.picker)) {
                        return sendPicker(data.picker);
                    }
                    if (data.status === 'redirect' && data.url) return sendSuccess(data);

                } catch (err) {
                    const msg = err.response?.data?.text || err.message;
                    console.warn(`[Fail] ${method.name} ${instance.url}: ${msg}`);
                    failureReasons.push(`${instance.url}(${method.name}): ${msg}`);
                }
            }
        }

        // ==========================================
        // METHOD 2: Invidious Proxy Fallback
        // ==========================================
        try {
            console.log('[YOUTUBE] Trying Invidious...');
            const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            if (videoIdMatch) {
                const videoId = videoIdMatch[1];
                const invInstances = ['https://inv.nadeko.net', 'https://invidious.fdn.fr', 'https://inv.tux.pizza'];
                for (const inst of invInstances) {
                    try {
                        const invResp = await axios.get(`${inst}/api/v1/videos/${videoId}`, { timeout: 4000 });
                        const streams = [...(invResp.data.formatStreams || []), ...(invResp.data.adaptiveFormats || [])];
                        if (streams.length > 0) {
                            const formats = streams.slice(0, 5).map((s, i) => ({
                                url: s.url,
                                quality: s.qualityLabel || s.audioQuality || 'Standard',
                                format: s.container || (s.type.includes('video') ? 'mp4' : 'm4a'),
                                hasAudio: s.type.includes('video'),
                                id: `inv-${i}`
                            }));
                            return res.json({ title: invResp.data.title, formats });
                        }
                    } catch (e) { }
                }
            }
        } catch (e) { }

        // ==========================================
        // METHOD 3: RapidAPI Fallback
        // ==========================================
        if (YOUTUBE_API_KEY) {
            try {
                const rResp = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
                    params: { url: url },
                    headers: { 'x-rapidapi-key': YOUTUBE_API_KEY, 'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com' },
                    timeout: 8000
                });
                if (rResp.data?.success && rResp.data.links) {
                    const formats = rResp.data.links.map((l, i) => ({
                        url: l.link,
                        quality: l.quality || 'Download',
                        format: l.extension || 'mp4',
                        hasAudio: true,
                        id: `rapid-${i}`
                    }));
                    return res.json({ title: rResp.data.title, formats });
                }
            } catch (e) { }
        }

        // ==========================================
        // FINAL FAILURE
        // ==========================================
        return res.status(500).json({
            error: 'No download options available for this video.',
            details: failureReasons.slice(0, 3).join(' | '),
            hint: 'This video might be age-restricted or private.'
        });

    } catch (err) {
        console.error('[CRITICAL] YouTube handler failed:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Stubs for other platforms to prevent crashes
app.post('/api/facebook/download', (req, res) => res.status(501).json({ error: 'Functionality coming soon' }));
app.post('/api/instagram/download', (req, res) => res.status(501).json({ error: 'Functionality coming soon' }));
app.post('/api/tiktok/download', (req, res) => res.status(501).json({ error: 'Functionality coming soon' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
