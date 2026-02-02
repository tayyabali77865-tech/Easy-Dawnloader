const axios = require('axios');

function findUrls(obj, found = []) {
    if (!obj) return found;
    if (typeof obj === 'string' && obj.startsWith('http')) {
        found.push(obj);
    } else if (typeof obj === 'object') {
        for (const k in obj) {
            findUrls(obj[k], found);
        }
    }
    return found;
}

async function recursiveSearch() {
    const videoId = '7332450841198595330';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    try {
        console.log(`Deep searching for URLs in: /video/${videoId}`);
        const response = await axios.get(`https://${host}/video/${videoId}`, {
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('✅ SUCCESS!');
        const urls = findUrls(response.data);
        if (urls.length > 0) {
            console.log('🚨 FOUND URLS! 🚨');
            console.log(urls.slice(0, 5));
        } else {
            console.log('No URLs found in the entire response object.');
            console.log('Full JSON Keys:', JSON.stringify(Object.keys(response.data)));
            console.log('Data object keys:', JSON.stringify(Object.keys(response.data.data || {})));
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

recursiveSearch();
