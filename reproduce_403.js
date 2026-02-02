const axios = require('axios');

async function testApis() {
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';

    // Test URLs that might return 403
    const urlsToTest = [
        'https://api.loader.to/v1/download',
        'https://www.tikwm.com/api/',
        'https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert'
    ];

    for (const testUrl of urlsToTest) {
        try {
            console.log(`Testing ${testUrl}...`);
            const resp = await axios.get(testUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': testUrl.includes('rapidapi') ? testUrl.split('/')[2] : undefined
                },
                timeout: 5000
            });
            console.log(`✅ ${testUrl} works!`);
        } catch (e) {
            console.log(`❌ ${testUrl} failed: ${e.message}`);
            if (e.response && e.response.data) {
                console.log('Response Body Snippet:', String(e.response.data).substring(0, 200));
            }
        }
    }
}

testApis();
