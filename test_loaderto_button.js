const axios = require('axios');

async function testLoaderToButton() {
    const url = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    const buttonUrl = `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp4`;

    try {
        console.log(`Testing Loader.to Button: ${buttonUrl}`);
        const response = await axios.get(buttonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        console.log('✅ SUCCESS!');
        console.log('Content (first 1000 chars):', response.data.substring(0, 1000));
        if (response.data.includes('download')) {
            console.log('🚨 FOUND DOWNLOAD LINKS IN PAGE 🚨');
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

testLoaderToButton();
