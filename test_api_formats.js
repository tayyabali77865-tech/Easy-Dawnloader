const axios = require('axios');

async function testApi() {
    try {
        console.log('Sending request to http://localhost:3001/api/youtube/download...');
        const response = await axios.post('http://localhost:3001/api/youtube/download', {
            url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
        });

        console.log('\n--- API Response (Formats) ---');
        response.data.formats.forEach(f => {
            console.log(`Quality: ${f.quality} | Height: ${f.height} | Format: ${f.format} | HasAudio: ${f.hasAudio} | ID: ${f.id}`);
        });

        console.log('\n--- Full Note ---');
        console.log(response.data.note);

    } catch (error) {
        console.error('API Call Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testApi();
