const axios = require('axios');
const fs = require('fs');

async function fullDump() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/video/${videoId}`;

    try {
        console.log(`Fetching full dump for: ${url}`);
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('✅ SUCCESS!');
        fs.writeFileSync('tiktok_full_dump.json', JSON.stringify(response.data, null, 2));
        console.log('Dump saved to tiktok_full_dump.json');
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

fullDump();
