const axios = require('axios');

async function testPrefixes() {
    const videoId = '7332450841198595330';
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const paths = [
        '/social-media/tiktok-scraper/posts',
        '/social-media/tiktok-scraper/posts-by-url',
        '/social-media/tiktok-scraper/get-post',
        '/social-media/tiktok-scraper/post/details',
        '/post/details'
    ];

    for (const path of paths) {
        try {
            console.log(`\n--- Testing Path: ${path} ---`);
            const response = await axios.post(`https://${host}${path}`, {
                url: tiktokUrl
            }, {
                headers: {
                    'x-rapidapi-host': host,
                    'x-rapidapi-key': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            console.log('✅ SUCCESS (POST)!');
            console.log('Keys:', Object.keys(response.data));
            return;
        } catch (e) {
            console.log(`POST Failed: ${e.message} (${e.response ? e.response.status : 'No response'})`);
        }

        try {
            const response = await axios.get(`https://${host}${path}`, {
                params: { url: tiktokUrl },
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 5000
            });
            console.log('✅ SUCCESS (GET)!');
            console.log('Keys:', Object.keys(response.data));
            return;
        } catch (e) {
            console.log(`GET Failed: ${e.message} (${e.response ? e.response.status : 'No response'})`);
        }
    }
}

testPrefixes();
