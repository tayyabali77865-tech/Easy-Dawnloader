const axios = require('axios');

async function testOfficial() {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    try {
        const res = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: '720'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://cobalt.tools',
                'Referer': 'https://cobalt.tools/'
            },
            timeout: 10000
        });

        console.log('Response:', res.data);
    } catch (e) {
        console.log('Error:', e.message);
        if (e.response) console.log('Data:', e.response.data);
    }
}

testOfficial();
