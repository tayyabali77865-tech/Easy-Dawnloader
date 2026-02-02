const axios = require('axios');

async function discoverDocs() {
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    const paths = ['/docs', '/', '/swagger.json', '/openapi.json', '/api-docs'];

    for (const path of paths) {
        try {
            console.log(`Testing: ${path}`);
            const response = await axios.get(`https://${host}${path}`, {
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey },
                timeout: 3000
            });
            console.log('✅ SUCCESS! Content length:', response.data ? JSON.stringify(response.data).length : 0);
            if (response.data && response.data.paths) {
                console.log('Endpoints found:', Object.keys(response.data.paths));
                return;
            }
        } catch (e) { }
    }
}

discoverDocs();
