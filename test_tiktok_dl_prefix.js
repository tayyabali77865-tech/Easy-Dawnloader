const axios = require('axios');

async function testDlPrefix() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const paths = ['/dl/video', '/dl/post', '/download/video', '/download/post'];

    for (const path of paths) {
        try {
            console.log(`Testing GET: ${path}/${videoId}`);
            const response = await axios.get(`https://${host}${path}/${videoId}`, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 3000
            });
            console.log('✅ SUCCESS!');
            process.exit(0);
        } catch (e) { }

        try {
            console.log(`Testing POST: ${path}`);
            await axios.post(`https://${host}${path}`, { id: videoId }, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 3000
            });
            console.log('✅ SUCCESS!');
            process.exit(0);
        } catch (e) { }
    }
    console.log('❌ All /dl/ tests failed.');
}

testDlPrefix();
