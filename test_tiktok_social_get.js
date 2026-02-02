const axios = require('axios');

async function testSocialMediaGet() {
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const path = '/social-media/tiktok-scraper/posts';

    try {
        console.log(`Testing GET: ${path}`);
        const response = await axios.get(`https://${host}${path}`, {
            params: { url: tiktokUrl },
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
            timeout: 3000
        });
        console.log('✅ SUCCESS!');
        console.log('Data Keys:', Object.keys(response.data));
        console.log('Data:', JSON.stringify(response.data).substring(0, 500));
    } catch (e) {
        console.log(`FAILED: ${e.message} (${e.response ? e.response.status : 'No response'})`);
        if (e.response) console.log('Response:', JSON.stringify(e.response.data));
    }
}

testSocialMediaGet();
