const axios = require('axios');
const testVideoUrl = 'https://www.youtube.com/watch?v=dQw1w9WgXcQ';

async function testVevioz() {
    console.log('--- Testing Vevioz ---');
    try {
        const res = await axios.get(`https://api.vevioz.com/apis/download?url=${encodeURIComponent(testVideoUrl)}`, { timeout: 7000 });
        console.log(`[SUCCESS] Vevioz: ${res.status}`);
        console.log('Data:', JSON.stringify(res.data).substring(0, 100));
    } catch (e) {
        console.log(`[FAILED]  Vevioz: ${e.message}`);
    }
}

async function testDirectInvidious() {
    // Try a specifically known working one
    const inst = 'https://invidious.projectsegfau.lt';
    try {
        const videoId = 'dQw4w9WgXcQ';
        const res = await axios.get(`${inst}/api/v1/videos/${videoId}`, { timeout: 10000 });
        console.log(`--- Invidious ${inst} ---`);
        console.log('Streams found:', res.data.formatStreams?.length || 0);
    } catch (e) {
        console.log('Invidious error:', e.message);
    }
}

async function run() {
    await testVevioz();
    await testDirectInvidious();
}
run();
