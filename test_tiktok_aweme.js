const axios = require('axios');

async function testAwemeV1() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    try {
        console.log(`Testing /aweme/v1/aweme/post for: ${videoId}`);
        const response = await axios.get(`https://${host}/aweme/v1/aweme/post`, {
            params: { aweme_id: videoId },
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
            timeout: 5000
        });

        console.log('✅ SUCCESS!');
        console.log('Data:', JSON.stringify(response.data).substring(0, 500));
    } catch (error) {
        console.log(`❌ FAILED: ${error.message} (${error.response ? error.response.status : 'No response'})`);
    }
}

testAwemeV1();
