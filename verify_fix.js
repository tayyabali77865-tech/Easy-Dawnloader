const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testFix() {
    const videoUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4'; // Use a known short video
    const formatId = 'sb3'; // storyboard format is small and fast to test
    const proxyUrl = `http://localhost:3000/api/youtube/stream-download?url=${encodeURIComponent(videoUrl)}&id=${formatId}`;

    console.log(`Testing proxy download: ${proxyUrl}`);

    try {
        const response = await axios({
            method: 'get',
            url: proxyUrl,
            responseType: 'stream'
        });

        let totalLength = 0;
        response.data.on('data', (chunk) => {
            totalLength += chunk.length;
        });

        response.data.on('end', () => {
            console.log(`✅ Download finished. Received ${totalLength} bytes.`);
            if (totalLength > 0) {
                console.log('🎉 SUCCESS: The download is not 0 bytes!');
                process.exit(0);
            } else {
                console.error('❌ FAILURE: Received 0 bytes.');
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('❌ ERROR during test:', error.message);
        process.exit(1);
    }
}

testFix();
