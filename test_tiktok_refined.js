const axios = require('axios');

async function testTikTokRefined() {
    const videoId = '7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const testUrls = [
        `https://${host}/post/id/${videoId}`,
        `https://${host}/video/id/${videoId}`
    ];

    for (const url of testUrls) {
        try {
            console.log(`\nTesting: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'x-rapidapi-host': host,
                    'x-rapidapi-key': apiKey
                }
            });
            console.log('✅ SUCCESS!');
            console.log('Preview:', JSON.stringify(response.data).substring(0, 500));
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
            if (error.response) console.log('Status:', error.response.status);
        }
    }
}

testTikTokRefined();
