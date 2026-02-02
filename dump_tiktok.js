const axios = require('axios');
const fs = require('fs');

async function dumpTikTok() {
    const videoId = '7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/video/${videoId}`;

    try {
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        fs.writeFileSync('tiktok_dump.json', JSON.stringify(response.data, null, 2));
        console.log('✅ DUMPED to tiktok_dump.json');

        const d = response.data.data;
        if (d && d.aweme_detail) {
            const detail = d.aweme_detail;
            console.log('Keys in aweme_detail:', Object.keys(detail));
            if (detail.video) console.log('Video found');
            if (detail.music) console.log('Music found');
        } else {
            console.log('aweme_detail is MISSING or NULL');
            console.log('Full data keys:', d ? Object.keys(d) : 'null');
        }

    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

dumpTikTok();
