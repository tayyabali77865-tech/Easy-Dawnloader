const axios = require('axios');

async function inspectTikTokFinal() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
    const url = `https://${host}/video/${videoId}`;

    try {
        const response = await axios.get(url, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        const detail = response.data.data.aweme_detail;
        console.log('--- Aweme Detail Keys ---');
        console.log(Object.keys(detail));

        console.log('\n--- Video Object ---');
        if (detail.video) {
            console.log('Video Play URL:', detail.video.play_addr ? detail.video.play_addr.url_list[0] : 'N/A');
            console.log('Video Download URL:', detail.video.download_addr ? detail.video.download_addr.url_list[0] : 'N/A');
            console.log('Bitrate:', detail.video.bit_rate ? detail.video.bit_rate[0] : 'N/A');
        }

        console.log('\n--- Music Object ---');
        if (detail.music) {
            console.log('Music Play URL:', detail.music.play_url ? detail.music.play_url.url_list[0] : 'N/A');
            console.log('Music Author:', detail.music.author);
            console.log('Music Title:', detail.music.title);
        }

        console.log('\n--- Description ---');
        console.log(detail.desc);

    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

inspectTikTokFinal();
