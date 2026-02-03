const axios = require('axios');
const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

async function testHackerPoint() {
    console.log('--- Testing Hacker-Point ---');
    try {
        const res = await axios.head(`https://api.hacker-point.com/ytdlp/?url=${encodeURIComponent(testVideoUrl)}`, { timeout: 15000 });
        console.log(`[SUCCESS] Hacker-Point: ${res.status}`);
        console.log('Headers:', res.headers['content-type'], res.headers['content-length']);
    } catch (e) {
        console.log(`[FAILED]  Hacker-Point: ${e.message}`);
    }
}

async function run() {
    await testHackerPoint();
}
run();
