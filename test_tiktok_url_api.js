const axios = require('axios');

async function testPostInfo() {
    const tiktokUrl = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/post/info`;

    try {
        console.log(`Testing: ${url} with url=${tiktokUrl}`);
        const response = await axios.get(url, {
            params: { url: tiktokUrl },
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('✅ SUCCESS!');
        console.log('Root Keys:', Object.keys(response.data));
        if (response.data.data) {
            console.log('Data Keys:', Object.keys(response.data.data));
        } else {
            console.log('Response body:', JSON.stringify(response.data).substring(0, 500));
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        if (error.response) console.log('Status:', error.response.status, 'Data:', error.response.data);
    }
}

testPostInfo();
