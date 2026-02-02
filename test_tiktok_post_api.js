const axios = require('axios');

async function testTikTokPost() {
    const tiktokUrl = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const variations = [
        { path: '/social-media/tiktok-scraper/posts', data: { url: tiktokUrl } },
        { path: '/social-media/tiktok-scraper/posts-by-url', data: { url: tiktokUrl } },
        { path: '/v1/social-media/tiktok-scraper/posts', data: { url: tiktokUrl } }
    ];

    for (const test of variations) {
        try {
            console.log(`\nTesting POST: ${test.path} with ${JSON.stringify(test.data)}`);
            const response = await axios.post(`https://${host}${test.path}`, test.data, {
                headers: {
                    'x-rapidapi-host': host,
                    'x-rapidapi-key': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            console.log('✅ SUCCESS!');
            console.log('Keys:', Object.keys(response.data));
            if (response.data.data) {
                console.log('Data Keys:', Object.keys(response.data.data));
                // Check for video links
                const d = response.data.data;
                if (d.aweme_detail && d.aweme_detail.video) {
                    console.log('Video found in aweme_detail');
                }
            }
            return;
        } catch (error) {
            console.log(`❌ FAILED: ${error.message} (${error.response ? error.response.status : 'No response'})`);
            if (error.response) console.log('Response:', JSON.stringify(error.response.data));
        }
    }
}

testTikTokPost();
