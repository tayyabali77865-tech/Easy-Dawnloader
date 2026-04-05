const axios = require('axios');

async function testServer() {
    const baseUrl = 'http://localhost:3000';
    try {
        console.log('Checking server health...');
        await axios.get(baseUrl);
        console.log('✅ Server is reachable at ' + baseUrl);
    } catch (err) {
        console.error('❌ Server is NOT reachable:', err.message);
        return; // Stop if server is down
    }

    // Test YouTube Info API
    const testVideo = 'https://www.youtube.com/watch?v=ScMzIvxBSi4'; // Short harmless video
    try {
        console.log('\nTesting /api/youtube/info...');
        const res = await axios.get(`${baseUrl}/api/youtube/info?url=${encodeURIComponent(testVideo)}`);
        console.log('✅ YouTube Info API success:', res.status);
    } catch (err) {
        console.error('❌ YouTube Info API failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

testServer();
