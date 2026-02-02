const axios = require('axios');

async function testUserId() {
    const khabyUserId = '6689408655018659846'; // Khaby Lame's numeric ID
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/user/id/${khabyUserId}`;

    try {
        console.log(`Testing User ID: ${url}`);
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('✅ SUCCESS!');
        console.log('Keys:', Object.keys(response.data));
        if (response.data.data) {
            console.log('Data Keys:', Object.keys(response.data.data));
            if (response.data.data.user) {
                console.log('User Nickname:', response.data.data.user.nickname);
            }
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

testUserId();
