const axios = require('axios');

async function testWithHeaders() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/video/${videoId}`;

    try {
        console.log(`Testing with headers: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'x-rapidapi-host': host,
                'x-rapidapi-key': apiKey,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        console.log('✅ SUCCESS!');
        console.log('Data Keys:', Object.keys(response.data.data || {}));
        if (response.data.data && response.data.data.aweme_detail) {
            console.log('--- FOUND AWEME_DETAIL! ---');
            console.log('Keys:', Object.keys(response.data.data.aweme_detail));
        } else {
            console.log('aweme_detail is still NULL');
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

testWithHeaders();
