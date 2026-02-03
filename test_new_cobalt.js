const axios = require('axios');
const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const cobaltMirrors = [
    'https://cobalt.meowing.de',
    'https://qwkuns.me',
    'https://cobalt.canine.tools',
    'https://cobalt.clxxped.lol',
    'https://dl.woof.monster'
];

async function test() {
    console.log('--- Testing New Cobalt Mirrors ---');
    for (const base of cobaltMirrors) {
        let success = false;
        const endpoints = ['/api/json', '/'];
        for (const ep of endpoints) {
            try {
                const res = await axios.post(`${base}${ep}`, {
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
                if (res.data.url || res.data.picker) {
                    console.log(`[SUCCESS] ${base}${ep}`);
                    success = true;
                    break;
                } else {
                    console.log(`[DATA MISMATCH] ${base}${ep}: ${JSON.stringify(res.data)}`);
                }
            } catch (e) {
                // console.log(`[ERR] ${base}${ep}: ${e.message}`);
            }
        }
        if (!success) {
            console.log(`[ALL FAILED] ${base}`);
        }
    }
}
test();
