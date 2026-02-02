const axios = require('axios');

async function testProblematicReel() {
    const instagramUrl = 'https://www.instagram.com/reel/DSU9VA7D501/';
    const options = {
        method: 'GET',
        url: 'https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert',
        params: { url: instagramUrl },
        headers: {
            'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
            'x-rapidapi-key': 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267'
        }
    };

    try {
        console.log(`Testing Instagram RapidAPI with URL: ${instagramUrl}`);
        const response = await axios.request(options);
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error testing Instagram API:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testProblematicReel();
