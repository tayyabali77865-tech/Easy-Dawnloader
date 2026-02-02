const axios = require('axios');

async function testFinalPrefix() {
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const path = '/social-media/tiktok-scraper/get-post-by-url';

    try {
        console.log(`Testing Final Prefix: ${path}`);
        const response = await axios.get(`https://${host}${path}`, {
            params: { url: tiktokUrl },
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
            timeout: 5000
        });
        console.log('✅ SUCCESS!');
        console.log('Data Keys:', Object.keys(response.data));
    } catch (e) {
        console.log(`FAILED: ${e.message} (${e.response ? e.response.status : 'No response'})`);
    }
}

testFinalPrefix();
