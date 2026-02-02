const axios = require('axios');

async function testTikWM() {
    const url = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';
    try {
        console.log(`Testing TikWM for: ${url}`);
        const response = await axios.get('https://www.tikwm.com/api/', {
            params: { url: url }
        });

        console.log('✅ SUCCESS!');
        console.log('Keys:', Object.keys(response.data));
        if (response.data.data) {
            console.log('Title:', response.data.data.title);
            console.log('Play URL:', response.data.data.play);
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

testTikWM();
