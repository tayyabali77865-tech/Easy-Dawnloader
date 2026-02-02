const axios = require('axios');

async function testVersionedPaths() {
    const videoId = '7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const paths = [
        `/v1/post/id/${videoId}`,
        `/v2/post/id/${videoId}`,
        `/api/post/id/${videoId}`,
        `/v1/video/id/${videoId}`,
        `/v2/video/id/${videoId}`,
        `/api/video/id/${videoId}`,
        `/social-media/tiktok-scraper/video/${videoId}`
    ];

    for (const path of paths) {
        try {
            const url = `https://${host}${path}`;
            console.log(`Testing: ${url}`);
            const response = await axios.get(url, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 5000
            });
            console.log('✅ SUCCESS!');
            console.log('Keys:', Object.keys(response.data));
            return;
        } catch (error) {
            console.log(`❌ FAILED: ${error.message} (${error.response ? error.response.status : 'No response'})`);
        }
    }
}

testVersionedPaths();
