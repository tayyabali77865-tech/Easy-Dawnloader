const axios = require('axios');

async function testTypo() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const hostWithOneP = 'tiktok-scraper-videos-music-challenges-downloader.p.rapidapi.com';

    try {
        console.log(`Testing Host with one 'p': ${hostWithOneP}`);
        const response = await axios.get(`https://${hostWithOneP}/video/${videoId}`, {
            headers: { 'x-rapidapi-host': hostWithOneP, 'x-rapidapi-key': apiKey },
            timeout: 3000
        });
        console.log('✅ SUCCESS!');
        console.log('Data Keys:', Object.keys(response.data.data || {}));
    } catch (e) {
        console.log(`FAILED with one 'p': ${e.message} (${e.response ? e.response.status : 'No response'})`);
    }
}

testTypo();
