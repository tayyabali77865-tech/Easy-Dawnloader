const axios = require('axios');

async function verifyTikTokFix() {
    const url = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058';

    try {
        console.log(`[TEST] Calling /api/tiktok/download with: ${url}`);
        const response = await axios.post('http://localhost:3000/api/tiktok/download', {
            url: url
        });

        console.log('✅ SUCCESS!');
        console.log('Title:', response.data.title);
        console.log('Formats Found:', response.data.formats.length);
        response.data.formats.forEach(f => {
            console.log(`- ${f.quality} (${f.format})`);
        });
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        }
    }
}

verifyTikTokFix();
