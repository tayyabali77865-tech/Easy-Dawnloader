const axios = require('axios');

const instances = [
    'https://cobalt-api.kwiatekmiki.com',
    'https://api.cobalt.tools',
    'https://co.wuk.sh',
    'https://api.wuk.sh',
    'https://cobalt.slpy.one',
    'https://cobalt.oup.us',
    'https://cobalt.synced.team',
    'https://api.succoon.com'
];

async function testInstance(base) {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    try {
        const res = await axios.post(`${base}/`, {
            url: url,
            videoQuality: '720'
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            timeout: 5000
        });

        if (res.data.url) {
            console.log(`\n[SUCCESS] ${base}`);
            console.log('Tunnel URL:', res.data.url);

            try {
                const head = await axios.head(res.data.url, { timeout: 5000 });
                console.log('Status:', head.status);
                console.log('Content-Type:', head.headers['content-type']);
                console.log('Content-Length:', head.headers['content-length']);

                if (head.headers['content-type'] === 'video/mp4') {
                    console.log('>>> FOUND PERFECT INSTANCE <<<');
                }
            } catch (e) {
                console.log('HEAD failed:', e.message);
            }
        }
    } catch (e) {
        // console.log(`[FAILED] ${base}: ${e.message}`);
    }
}

async function run() {
    console.log('Checking instances...');
    const promises = instances.map(testInstance);
    await Promise.allSettled(promises);
}

run();
