const axios = require('axios');

async function testTikTokEndpoints() {
    const tiktokUrl = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058'; // Example popular video
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const testCases = [
        { name: 'post/info', url: `https://${host}/post/info`, params: { url: tiktokUrl }, method: 'GET' },
        { name: 'video/info', url: `https://${host}/video/info`, params: { url: tiktokUrl }, method: 'GET' },
        { name: 'download', url: `https://${host}/download`, params: { url: tiktokUrl }, method: 'GET' },
        { name: 'posts', url: `https://${host}/social-media/tiktok-scraper/posts`, data: { url: tiktokUrl }, method: 'POST' }
    ];

    for (const test of testCases) {
        try {
            console.log(`\n--- Testing ${test.name} ---`);
            const config = {
                method: test.method,
                url: test.url,
                headers: {
                    'x-rapidapi-host': host,
                    'x-rapidapi-key': apiKey
                }
            };
            if (test.method === 'GET') config.params = test.params;
            else config.data = test.data;

            const response = await axios(config);
            console.log(`✅ ${test.name} SUCCESS!`);
            console.log('Response Status:', response.status);
            console.log('Response Keys:', Object.keys(response.data));
            if (response.data.video_url || response.data.download_url || response.data.links) {
                console.log('Found download links!');
            }
            // Log a bit of the response
            console.log('Preview:', JSON.stringify(response.data).substring(0, 300));
        } catch (error) {
            console.log(`❌ ${test.name} FAILED: ${error.message}`);
            if (error.response) {
                console.log('Status:', error.response.status);
                // console.log('Data:', error.response.data);
            }
        }
    }
}

testTikTokEndpoints();
