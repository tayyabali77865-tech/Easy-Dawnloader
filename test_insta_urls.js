const axios = require('axios');

async function testMultipleUrls() {
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';

    const testUrls = [
        'https://www.instagram.com/p/C1234567890/',  // Generic post format
        'https://www.instagram.com/reel/C1234567890/', // Generic reel format
        'https://www.instagram.com/p/DDMkF8xyBHu/', // Real post from Instagram official
    ];

    for (const testUrl of testUrls) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${testUrl}`);
        console.log('='.repeat(60));

        try {
            const apiResp = await axios.get('https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert', {
                params: { url: testUrl },
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com'
                },
                timeout: 15000
            });

            console.log('✅ API Response Status:', apiResp.status);
            console.log('Response structure:', Object.keys(apiResp.data));
            console.log('Result count:', apiResp.data.result ? apiResp.data.result.length : 0);

            if (apiResp.data.result && apiResp.data.result.length > 0) {
                const firstUrl = apiResp.data.result[0].url;
                console.log('First URL preview:', firstUrl.substring(0, 80) + '...');
                console.log('URL domain:', new URL(firstUrl).hostname);

                // Test if this URL is accessible
                try {
                    await axios.head(firstUrl, { timeout: 5000 });
                    console.log('✅ URL is accessible');
                } catch (e) {
                    console.log('❌ URL not accessible:', e.response ? e.response.status : e.message);
                }
            }

        } catch (apiErr) {
            console.log('❌ API call failed:', apiErr.message);
            if (apiErr.response) {
                console.log('   Status:', apiErr.response.status);
                console.log('   Data:', JSON.stringify(apiErr.response.data).substring(0, 200));
            }
        }
    }
}

testMultipleUrls();
