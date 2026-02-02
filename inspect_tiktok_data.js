const axios = require('axios');

async function inspectTikTokData() {
    const videoId = '7024281421016237058';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/video/${videoId}`;

    try {
        console.log(`Inspecting: ${url}`);
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('--- Response Structure ---');
        console.log('Keys:', Object.keys(response.data));
        if (response.data.data) {
            console.log('Data Keys:', Object.keys(response.data.data));
            const d = response.data.data;
            console.log('Title:', d.desc || d.description);
            console.log('Direct Links:');
            // Look for play_addr, download_addr, or similar
            if (d.video) {
                console.log('Video Keys:', Object.keys(d.video));
                console.log('Play URL:', d.video.play_addr ? d.video.play_addr.url_list[0] : 'Not found');
                console.log('Download URL:', d.video.download_addr ? d.video.download_addr.url_list[0] : 'Not found');
            }
            if (d.music) {
                console.log('Music URL:', d.music.play_url ? d.music.play_url.url_list[0] : 'Not found');
            }
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

inspectTikTokData();
