const axios = require('axios');

async function testQueryParam() {
    const videoId = '7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const urls = [
        `https://${host}/video?id=${videoId}`,
        `https://${host}/post?id=${videoId}`,
        `https://${host}/video/info?id=${videoId}`,
        `https://${host}/post/info?id=${videoId}`
    ];

    for (const url of urls) {
        try {
            console.log(`Testing: ${url}`);
            const response = await axios.get(url, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
            });
            console.log('✅ SUCCESS!');
            console.log('Data:', JSON.stringify(response.data).substring(0, 500));
            return;
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
        }
    }
}

testQueryParam();
