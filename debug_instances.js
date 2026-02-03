const axios = require('axios');

async function testInstance(base) {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    console.log(`\nTesting Instance: ${base}`);
    try {
        const res = await axios.post(`${base}/`, {
            url: url,
            videoQuality: '720'
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            timeout: 10000
        });

        if (res.data.url) {
            console.log('Tunnel URL:', res.data.url);
            console.log('Fetching HEAD of tunnel...');
            try {
                const dl = await axios.head(res.data.url);
                console.log('Status:', dl.status);
                // We are looking for 'video/mp4'
                console.log('Content-Type:', dl.headers['content-type']);
                console.log('Content-Length:', dl.headers['content-length']);
            } catch (e) {
                // HEAD might be blocked, try GET with range
                console.log('HEAD failed, trying GET byte range...');
                const dl = await axios.get(res.data.url, {
                    headers: { Range: 'bytes=0-100' }
                });
                console.log('Content-Type:', dl.headers['content-type']);
            }
        } else {
            console.log('No URL returned:', res.data);
        }
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

async function run() {
    await testInstance('https://cobalt.slpy.one');
    await testInstance('https://cobalt.oup.us');
    await testInstance('https://api.cobalt.tools');
}

run();
