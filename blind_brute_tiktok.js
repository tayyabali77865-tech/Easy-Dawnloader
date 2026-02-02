const axios = require('axios');

async function blindBrute() {
    const videoId = '7332450841198595330';
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const endpoints = [
        '/post/info', '/video/info', '/posts/info', '/videos/info',
        '/post/details', '/video/details', '/posts/details', '/videos/details',
        '/post/get', '/video/get', '/posts/get', '/videos/get',
        '/media/info', '/media/details', '/media/get',
        '/social-media/tiktok-scraper/posts/get',
        '/social-media/tiktok-scraper/video/get'
    ];

    for (const endpoint of endpoints) {
        try {
            const resp = await axios.get(`https://${host}${endpoint}`, {
                params: { url: tiktokUrl, id: videoId, post_id: videoId, video_id: videoId },
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 2000
            });
            console.log(`✅ FOUND GET: ${endpoint}`);
            process.exit(0);
        } catch (e) { }

        try {
            await axios.post(`https://${host}${endpoint}`, { url: tiktokUrl, id: videoId, post_id: videoId }, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 2000
            });
            console.log(`✅ FOUND POST: ${endpoint}`);
            process.exit(0);
        } catch (e) { }
    }
    console.log('❌ All blind tests failed.');
}

blindBrute();
