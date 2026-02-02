const axios = require('axios');

async function multiIdTest() {
    const ids = [
        '7024281421016237058', // Khaby (Old)
        '7332450841198595330', // Leah Halton (Recent)
        '7319324510344415518'  // Random Recent
    ];
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    for (const id of ids) {
        try {
            const url = `https://${host}/video/${id}`;
            console.log(`\nTesting ID: ${id}`);
            const response = await axios.get(url, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 5000
            });

            console.log('Status Code:', response.data.data ? response.data.data.status_code : 'N/A');
            console.log('Keys in data:', Object.keys(response.data.data || {}));
            if (response.data.data && response.data.data.aweme_detail) {
                console.log('✅ Found aweme_detail!');
                return; // Stop if we find one that works
            } else {
                console.log('❌ aweme_detail is null');
            }
        } catch (error) {
            console.log(`❌ Error for ${id}: ${error.message}`);
        }
    }
}

multiIdTest();
