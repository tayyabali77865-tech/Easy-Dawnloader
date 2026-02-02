const axios = require('axios');

async function testFullUrlWithApi() {
    const fullUrl = 'https://www.instagram.com/reel/DSU9VA7D501/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==';
    const options = {
        method: 'GET',
        url: 'https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert',
        params: { url: fullUrl },
        headers: {
            'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
            'x-rapidapi-key': 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267'
        }
    };

    try {
        console.log(`Testing RapidAPI with FULL URL: ${fullUrl}`);
        const response = await axios.request(options);
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('RapidAPI Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testFullUrlWithApi();
