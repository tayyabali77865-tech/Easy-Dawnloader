const axios = require('axios');

async function testFollowers() {
    const videoId = '7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/user/id/${videoId}/followers`;

    try {
        console.log(`Testing Followers: ${url}`);
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('✅ SUCCESS!');
        console.log('Keys:', Object.keys(response.data));
        if (response.data.data) {
            console.log('Data Keys:', Object.keys(response.data.data));
            console.log('Followers count (if any):', response.data.data.followers ? response.data.data.followers.length : 'N/A');
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        if (error.response) console.log('Response:', JSON.stringify(error.response.data));
    }
}

testFollowers();
