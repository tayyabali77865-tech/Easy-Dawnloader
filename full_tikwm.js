const axios = require('axios');

async function fullTikWM() {
    const url = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    try {
        console.log(`Testing TikWM full for: ${url}`);
        const response = await axios.get('https://www.tikwm.com/api/', {
            params: { url: url }
        });

        console.log('✅ SUCCESS!');
        console.log('Full Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

fullTikWM();
