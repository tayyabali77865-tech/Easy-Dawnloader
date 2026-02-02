const axios = require('axios');

async function testSocialMediaApi() {
    const videoUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'social-media-video-downloader.p.rapidapi.com';

    try {
        console.log(`Testing Social Media Host: ${host}`);
        const response = await axios.get(`https://${host}/smvd/get/all`, {
            params: { url: videoUrl },
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
            timeout: 5000
        });
        console.log('✅ SUCCESS!');
        console.log('Data:', JSON.stringify(response.data).substring(0, 500));
    } catch (e) {
        console.log(`FAILED Social Media Host: ${e.message} (${e.response ? e.response.status : 'No response'})`);
        if (e.response) console.log('Response:', JSON.stringify(e.response.data));
    }
}

testSocialMediaApi();
