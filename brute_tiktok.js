const axios = require('axios');

async function bruteForceTikTok() {
    const videoId = '7332450841198595330'; // Recent ID
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const prefixes = ['', '/api', '/v1', '/v2', '/social-media/tiktok-scraper', '/social-media/tiktok-scraper/v1'];
    const paths = [`/post/${videoId}`, `/video/${videoId}`, `/post/info`, `/video/info`, `/download`, `/convert`];

    for (const prefix of prefixes) {
        for (const path of paths) {
            try {
                const url = `https://${host}${prefix}${path}`;
                console.log(`Testing GET: ${url}`);
                const response = await axios.get(url, {
                    params: { url: tiktokUrl, id: videoId },
                    headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                    timeout: 3000
                });
                console.log('✅ SUCCESS! Path:', prefix + path);
                console.log('Keys:', Object.keys(response.data));
                return;
            } catch (e) { }

            try {
                const url = `https://${host}${prefix}${path}`;
                console.log(`Testing POST: ${url}`);
                const response = await axios.post(url, { url: tiktokUrl, id: videoId }, {
                    headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                    timeout: 3000
                });
                console.log('✅ SUCCESS! Path:', prefix + path);
                console.log('Keys:', Object.keys(response.data));
                return;
            } catch (e) { }
        }
    }
}

bruteForceTikTok();
