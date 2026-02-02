const axios = require('axios');

async function testTikWM2() {
    const url = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058';
    try {
        console.log(`Testing TikWM for: ${url}`);
        const response = await axios.get('https://www.tikwm.com/api/', {
            params: { url: url },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        console.log('✅ SUCCESS!');
        console.log('Result:', JSON.stringify(response.data).substring(0, 500));
        if (response.data.data) {
            console.log('Video Play URL:', response.data.data.play);
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

testTikWM2();
