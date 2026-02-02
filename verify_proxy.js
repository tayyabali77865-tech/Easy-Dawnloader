const axios = require('axios');

async function verifyProxy() {
    const proxyUrl = 'http://localhost:3000/api/proxy';
    const targetUrl = 'https://www.google.com'; // Simple test

    try {
        console.log(`Testing proxy with: ${targetUrl}`);
        const resp = await axios.get(proxyUrl, {
            params: { url: targetUrl }
        });
        console.log('✅ Proxy SUCCESS!');
        console.log('Status:', resp.status);
        console.log('Headers:', resp.headers['content-type']);
    } catch (e) {
        console.log('❌ Proxy FAILED:', e.message);
        if (e.response) {
            console.log('Details:', e.response.status, e.response.data);
        }
    }
}

verifyProxy();
