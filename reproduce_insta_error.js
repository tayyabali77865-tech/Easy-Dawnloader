const axios = require('axios');

async function reproduceError() {
    const fullUrl = 'https://www.instagram.com/reel/DSU9VA7D501/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==';
    try {
        console.log(`Sending request to local server for: ${fullUrl}`);
        const response = await axios.post('http://localhost:3000/api/instagram/download', {
            url: fullUrl
        });
        console.log('Server Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Local Server Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

reproduceError();
