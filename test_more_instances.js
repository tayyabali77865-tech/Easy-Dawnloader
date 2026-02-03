const axios = require('axios');

const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const videoId = 'dQw4w9WgXcQ';

const invInstances = [
    'https://invidious.projectsegfau.lt',
    'https://invidious.snopyta.org',
    'https://inv.riverside.rocks',
    'https://iv.ggtyler.dev',
    'https://invidious.nerdvpn.de',
    'https://yt.artemislena.eu',
    'https://invidious.flokinet.to',
    'https://invidious.privacydev.net',
    'https://yewtu.be',
    'https://vid.priv.au',
    'https://invi.petitweb.site'
];

async function testInvidious() {
    console.log('--- Testing Invidious ---');
    for (const inst of invInstances) {
        try {
            const res = await axios.get(`${inst}/api/v1/videos/${videoId}`, { timeout: 5000 });
            const streams = [...(res.data.formatStreams || []), ...(res.data.adaptiveFormats || [])];
            console.log(`[${streams.length > 0 ? 'SUCCESS' : 'NO STREAMS'}] ${inst}`);
        } catch (e) {
            console.log(`[FAILED]  ${inst}: ${e.message}`);
        }
    }
}

async function testCobaltExtra() {
    console.log('\n--- Testing Cobalt Mirrors ---');
    const mirrors = [
        'https://cobalt.mizunode.ovh',
        'https://cobalt.perox.cc',
        'https://cobalt.q69.one',
        'https://api.cobalt.tools'
    ];
    for (const base of mirrors) {
        try {
            const res = await axios.post(`${base}/api/json`, {
                url: testVideoUrl,
                videoQuality: '720'
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': 'https://cobalt.tools'
                },
                timeout: 5000
            });
            console.log(`[SUCCESS] ${base}`);
        } catch (e) {
            console.log(`[FAILED]  ${base}: ${e.message}`);
        }
    }
}

async function run() {
    await testInvidious();
    await testCobaltExtra();
}
run();
