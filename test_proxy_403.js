const axios = require('axios');

async function testInstagramProxy() {
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const testUrl = 'https://www.instagram.com/reels/C_o8zM2S_9x/';

    console.log('Step 1: Calling Instagram RapidAPI...');

    try {
        const apiResp = await axios.get('https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert', {
            params: { url: testUrl },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com'
            },
            timeout: 15000
        });

        console.log('✅ API Response received');
        console.log('Result count:', apiResp.data.result ? apiResp.data.result.length : 0);

        if (apiResp.data.result && apiResp.data.result.length > 0) {
            const firstUrl = apiResp.data.result[0].url;
            console.log('\nStep 2: Testing direct access to CDN URL...');
            console.log('URL:', firstUrl.substring(0, 100) + '...');

            try {
                const directResp = await axios.head(firstUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://www.instagram.com/'
                    },
                    timeout: 10000
                });
                console.log('✅ Direct access works! Status:', directResp.status);
            } catch (directErr) {
                console.log('❌ Direct access FAILED:', directErr.message);
                if (directErr.response) {
                    console.log('   Status:', directErr.response.status);
                    console.log('   Headers:', JSON.stringify(directErr.response.headers));
                }
            }

            console.log('\nStep 3: Testing via local proxy...');
            const proxyUrl = `http://localhost:3000/api/proxy?url=${encodeURIComponent(firstUrl)}&filename=test.mp4`;

            try {
                const proxyResp = await axios.get(proxyUrl, {
                    timeout: 15000,
                    maxContentLength: 1000 // Just test headers, don't download full file
                });
                console.log('✅ Proxy works! Status:', proxyResp.status);
            } catch (proxyErr) {
                console.log('❌ Proxy FAILED:', proxyErr.message);
                if (proxyErr.response) {
                    console.log('   Status:', proxyErr.response.status);
                    console.log('   Error:', proxyErr.response.data);
                }
            }
        } else {
            console.log('❌ API returned no results');
        }

    } catch (apiErr) {
        console.log('❌ API call failed:', apiErr.message);
        if (apiErr.response) {
            console.log('   Status:', apiErr.response.status);
            console.log('   Data:', apiErr.response.data);
        }
    }
}

testInstagramProxy();
