const axios = require('axios');

async function exhaustiveDump() {
    const videoId = '7332450841198595330';
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const testCases = [
        { method: 'GET', path: `/video/${videoId}`, params: {} },
        { method: 'GET', path: `/video`, params: { id: videoId } },
        { method: 'GET', path: `/video`, params: { url: tiktokUrl } },
        { method: 'GET', path: `/post`, params: { url: tiktokUrl } },
        { method: 'POST', path: `/video`, data: { url: tiktokUrl } },
        { method: 'GET', path: `/social-media/tiktok-scraper/video/${videoId}`, params: {} }
    ];

    for (const test of testCases) {
        try {
            console.log(`\n--- Testing ${test.method} ${test.path} ---`);
            const config = {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 5000
            };

            let response;
            if (test.method === 'GET') {
                response = await axios.get(`https://${host}${test.path}`, { ...config, params: test.params });
            } else {
                response = await axios.post(`https://${host}${test.path}`, test.data, config);
            }

            console.log('Status:', response.status);
            console.log('Response Keys:', Object.keys(response.data));
            if (response.data.data) {
                console.log('Data Keys:', Object.keys(response.data.data));
                // Log anything that looks like a download link
                const json = JSON.stringify(response.data.data);
                if (json.includes('http')) {
                    console.log('🚨 FOUND URLS IN DATA! 🚨');
                    // Find URLs
                    const urls = json.match(/https?:\/\/[^"']+/g) || [];
                    console.log('First 3 URLs:', urls.slice(0, 3));
                } else {
                    console.log('No URLs found in data.');
                }
            }
        } catch (error) {
            console.log(`Failed: ${error.message} (${error.response ? error.response.status : 'No response'})`);
        }
    }
}

exhaustiveDump();
