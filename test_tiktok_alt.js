const axios = require('axios');

async function testAltApi() {
    const tiktokUrl = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const altHost = 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com';

    try {
        console.log(`Testing Alt Host: ${altHost}`);
        const response = await axios.get(`https://${altHost}/index`, {
            params: { url: tiktokUrl },
            headers: { 'x-rapidapi-host': altHost, 'x-rapidapi-key': apiKey },
            timeout: 5000
        });
        console.log('✅ SUCCESS!');
        console.log('Data:', JSON.stringify(response.data).substring(0, 500));
    } catch (e) {
        console.log(`FAILED Alt Host: ${e.message} (${e.response ? e.response.status : 'No response'})`);
        if (e.response) console.log('Response:', JSON.stringify(e.response.data));
    }
}

testAltApi();
