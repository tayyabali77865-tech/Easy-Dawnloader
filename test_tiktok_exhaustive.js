const axios = require('axios');

async function testTikTokComprehensive() {
    const videoId = '7024281421016237058';
    const tiktokUrl = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const GET_Variations = [
        `/post/${videoId}`,
        `/posts/${videoId}`,
        `/post/id/${videoId}`,
        `/posts/id/${videoId}`,
        `/video/${videoId}`,
        `/videos/${videoId}`,
        `/video/id/${videoId}`,
        `/videos/id/${videoId}`,
        `/post/info?url=${encodeURIComponent(tiktokUrl)}`,
        `/video/info?url=${encodeURIComponent(tiktokUrl)}`,
        `/post?url=${encodeURIComponent(tiktokUrl)}`,
        `/video?url=${encodeURIComponent(tiktokUrl)}`
    ];

    const POST_Variations = [
        { path: '/posts', data: { url: tiktokUrl } },
        { path: '/posts', data: { link: tiktokUrl } },
        { path: '/post/info', data: { url: tiktokUrl } },
        { path: '/video/info', data: { url: tiktokUrl } }
    ];

    for (const path of GET_Variations) {
        try {
            const fullUrl = path.startsWith('http') ? path : `https://${host}${path}`;
            console.log(`\nTesting GET: ${fullUrl}`);
            const response = await axios.get(fullUrl, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 5000
            });
            console.log('✅ SUCCESS!');
            console.log('Keys:', Object.keys(response.data));
            return; // Stop if we find one
        } catch (error) {
            console.log(`❌ FAILED: ${error.message} (${error.response ? error.response.status : 'No response'})`);
        }
    }

    for (const test of POST_Variations) {
        try {
            console.log(`\nTesting POST: ${test.path} with data ${JSON.stringify(test.data)}`);
            const response = await axios.post(`https://${host}${test.path}`, test.data, {
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

testTikTokComprehensive();
