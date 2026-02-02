const axios = require('axios');

async function testFacebookApi() {
    const url = 'https://www.facebook.com/share/r/1FB3GpnxKC/';
    const options = {
        method: 'POST',
        url: 'https://facebook-media-downloader1.p.rapidapi.com/get_media',
        headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'facebook-media-downloader1.p.rapidapi.com',
            'x-rapidapi-key': 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267'
        },
        data: {
            url: url
        }
    };

    try {
        console.log('Testing Facebook RapidAPI...');
        const response = await axios.request(options);
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error testing Facebook API:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testFacebookApi();
