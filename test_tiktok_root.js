const axios = require('axios');

async function testRoot() {
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const paths = ['/', '/api', '/v1', '/v2', '/info', '/status'];

    for (const path of paths) {
        try {
            console.log(`Testing: ${path}`);
            const response = await axios.get(`https://${host}${path}`, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 3000
            });
            console.log('✅ SUCCESS!');
            console.log('Data:', JSON.stringify(response.data).substring(0, 200));
        } catch (e) {
            console.log(`Failed ${path}: ${e.message} (${e.response ? e.response.status : 'No response'})`);
        }
    }
}

testRoot();
