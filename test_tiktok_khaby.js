const axios = require('axios');

async function testKhaby() {
    const videoId = '6803704209503489285'; // Khaby oldest
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/video/${videoId}`;

    try {
        console.log(`Testing Khaby: ${url}`);
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('✅ SUCCESS!');
        console.log('Data:', JSON.stringify(response.data.data));
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

testKhaby();
