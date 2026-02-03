const axios = require('axios');
const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

async function testYT1S() {
    console.log('--- Testing YT1S ---');
    try {
        const params = new URLSearchParams();
        params.append('q', testVideoUrl);
        params.append('vt', 'home');

        const res = await axios.post('https://yt1s.com/api/ajaxSearch/index', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 7000
        });
        console.log(`[SUCCESS] YT1S: ${res.status}`);
        console.log('Data:', JSON.stringify(res.data).substring(0, 200));
    } catch (e) {
        console.log(`[FAILED]  YT1S: ${e.message}`);
    }
}

async function run() {
    await testYT1S();
}
run();
