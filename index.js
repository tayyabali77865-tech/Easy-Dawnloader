console.log('--- HYPER-RESILIENT BACKEND v2.1.0 ACTIVATED ---');

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

// Initialize environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// RapidAPI Key Handling
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';

app.use(cors());
app.use(express.json());

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * YouTube: Fetch Metadata
 */
app.get('/api/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    try {
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { timeout: 5000 });
        res.json({
            title: response.data.title,
            thumbnail_url: response.data.thumbnail_url,
            author_name: response.data.author_name,
            server_version: '2.1.0-HyperResilient'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

/**
 * YouTube: Fetch Download Options
 */
app.post('/api/youtube/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`[YOUTUBE DOWNLOAD] URL: ${url}`);
    const failureReasons = [];

    // ==========================================
    // METHOD 1: RapidAPI
    // ==========================================
    if (RAPIDAPI_KEY) {
        try {
            console.log(`[Attempt] RapidAPI...`);
            const rResp = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
                params: { url },
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
                },
                timeout: 7000
            });
            if (rResp.data && rResp.data.success && rResp.data.links) {
                const formats = rResp.data.links.map((l, i) => ({
                    url: l.link,
                    quality: l.quality || 'Download',
                    format: l.extension || 'mp4',
                    hasAudio: true,
                    id: `rapid-${i}`
                }));
                return res.json({ title: rResp.data.title || 'Video', formats });
            }
        } catch (e) {
            console.warn(`[Fail] RapidAPI: ${e.message}`);
            failureReasons.push(`RapidAPI(${e.response?.status || 'ERR'}): ${e.message}`);
        }
    }

    // ==========================================
    // METHOD 2: Cobalt Mirrors (Multi-Schema)
    // ==========================================
    const cobaltInstances = [
        { url: 'https://cobalt-api.kwiatekmiki.com', endpoint: '/' },
        { url: 'https://api.cobalt.tools', endpoint: '/api/json', official: true },
        { url: 'https://cobalt.cup.lol', endpoint: '/api/json' },
        { url: 'https://cobalt.nyx.re', endpoint: '/api/json' }
    ];

    for (const inst of cobaltInstances) {
        // Try v10 Schema
        try {
            const apiUrl = `${inst.url}${inst.endpoint}`;
            console.log(`[Attempt] Cobalt v10: ${inst.url}`);

            const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
            if (inst.official) {
                headers['Origin'] = 'https://cobalt.tools';
                headers['Referer'] = 'https://cobalt.tools/';
                headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
            }

            const response = await axios.post(apiUrl, {
                url: url,
                videoQuality: '720',
                filenameStyle: 'basic',
                isAudioOnly: format === 'audio'
            }, { headers, timeout: 4000 });

            if (response.data.url) {
                return res.json({ title: 'Ready', formats: [{ url: response.data.url, quality: '720p', format: 'mp4', hasAudio: true }] });
            }
            if (response.data.picker) {
                const formats = response.data.picker.map((p, i) => ({
                    url: p.url, quality: p.quality || 'Video', format: 'mp4', hasAudio: true, id: `c-${i}`
                }));
                return res.json({ title: 'Ready', formats });
            }
        } catch (e) {
            console.warn(`[Fail] Cobalt v10 ${inst.url}: ${e.message}`);

            // Try Legacy Schema for 400 errors
            if (e.response?.status === 400) {
                try {
                    console.log(`[Attempt] Cobalt Legacy: ${inst.url}`);
                    const response = await axios.post(`${inst.url}${inst.endpoint}`, {
                        url: url, vQuality: '720'
                    }, { timeout: 4000 });
                    if (response.data.url) {
                        return res.json({ title: 'Ready', formats: [{ url: response.data.url, quality: '720p', format: 'mp4', hasAudio: true }] });
                    }
                } catch (e2) {
                    console.warn(`[Fail] Cobalt Legacy ${inst.url}: ${e2.message}`);
                }
            }
            failureReasons.push(`${inst.url}: ${e.message}`);
        }
    }

    // ==========================================
    // METHOD 3: Invidious Expanded List
    // ==========================================
    const invInstances = [
        'https://invidious.projectsegfau.lt',
        'https://invidious.snopyta.org',
        'https://inv.riverside.rocks',
        'https://iv.ggtyler.dev',
        'https://invidious.fdn.fr'
    ];
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        for (const inst of invInstances) {
            try {
                console.log(`[Attempt] Invidious: ${inst}`);
                const invResp = await axios.get(`${inst}/api/v1/videos/${videoId}`, { timeout: 4000 });
                const streams = [...(invResp.data.formatStreams || []), ...(invResp.data.adaptiveFormats || [])];
                if (streams.length > 0) {
                    const formats = streams.slice(0, 5).map((s, i) => ({
                        url: s.url,
                        quality: s.qualityLabel || s.quality || 'Standard',
                        format: s.container || 'mp4',
                        hasAudio: true,
                        id: `inv-${i}`
                    }));
                    return res.json({ title: invResp.data.title || 'YouTube Video', formats });
                }
            } catch (e) {
                console.warn(`[Fail] Invidious ${inst}: ${e.message}`);
                failureReasons.push(`Invidious(${inst}): ${e.message}`);
            }
        }
    }

    // ==========================================
    // FINAL FAILURE
    // ==========================================
    return res.status(500).json({
        error: 'All download methods failed.',
        details: failureReasons.slice(0, 3).join(' | '),
        trace: failureReasons
    });
});

app.post('/api/facebook/download', (req, res) => res.status(501).json({ error: 'Coming soon' }));
app.post('/api/instagram/download', (req, res) => res.status(501).json({ error: 'Coming soon' }));
app.post('/api/tiktok/download', (req, res) => res.status(501).json({ error: 'Coming soon' }));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
