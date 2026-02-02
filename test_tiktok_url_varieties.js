const axios = require('axios');

async function testTiktokUrls() {
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const endpoints = [
        '/post/info',
        '/video/info',
        '/post/detail',
        '/video/detail',
        '/download',
        '/media'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing GET: ${endpoint}`);
            const response = await axios.get(`https://${host}${endpoint}`, {
                params: { url: tiktokUrl },
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 3000
            });
            console.log('✅ SUCCESS! Endpoint:', endpoint);
            console.log('Keys:', Object.keys(response.data));
            return;
        } catch (e) {
            // console.log(`FAILED ${endpoint}: ${e.message}`);
        }

        try {
            console.log(`Testing POST: ${endpoint}`);
            const response = await axios.post(`https://${host}${endpoint}`, { url: tiktokUrl }, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 3000
            });
            console.log('✅ SUCCESS! Endpoint:', endpoint);
            console.log('Keys:', Object.keys(response.data));
            return;
        } catch (e) {
            // console.log(`FAILED ${endpoint}: ${e.message}`);
        }
    }
}

testTiktokUrls();
