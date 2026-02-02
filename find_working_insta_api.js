const axios = require('axios');

const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
const testUrl = 'https://www.instagram.com/p/DDMkF8xyBHu/';

const providers = [
    {
        name: 'Instagram Media Downloader',
        host: 'instagram-media-downloader.p.rapidapi.com',
        endpoint: 'https://instagram-media-downloader.p.rapidapi.com/rapid/post.php',
        params: { url: testUrl }
    },
    {
        name: 'Instagram Downloader (v2)',
        host: 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
        endpoint: 'https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/v1/media',
        params: { url: testUrl }
    },
    {
        name: 'Instagram Bulk Profile Scrapper',
        host: 'instagram-bulk-profile-scrapper.p.rapidapi.com',
        endpoint: 'https://instagram-bulk-profile-scrapper.p.rapidapi.com/clients/api/ig/media',
        params: { url: testUrl }
    },
    {
        name: 'Social Media Video Downloader',
        host: 'social-media-video-downloader.p.rapidapi.com',
        endpoint: 'https://social-media-video-downloader.p.rapidapi.com/smvd/get/all',
        params: { url: testUrl }
    }
];

async function testProvider(provider) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${provider.name}`);
    console.log('='.repeat(60));

    try {
        const resp = await axios.get(provider.endpoint, {
            params: provider.params,
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': provider.host
            },
            timeout: 15000
        });

        console.log('✅ Status:', resp.status);
        console.log('Response keys:', Object.keys(resp.data));
        console.log('Data preview:', JSON.stringify(resp.data).substring(0, 200));

        // Try to find download URLs in the response
        const dataStr = JSON.stringify(resp.data);
        if (dataStr.includes('http') && (dataStr.includes('.mp4') || dataStr.includes('.jpg'))) {
            console.log('🎯 FOUND DOWNLOAD URLS!');
            return provider;
        }

    } catch (err) {
        console.log('❌ Failed:', err.message);
        if (err.response) {
            console.log('   Status:', err.response.status);
            console.log('   Data:', JSON.stringify(err.response.data).substring(0, 150));
        }
    }

    return null;
}

async function findWorkingProvider() {
    for (const provider of providers) {
        const result = await testProvider(provider);
        if (result) {
            console.log(`\n\n🎉 WORKING PROVIDER FOUND: ${result.name}`);
            console.log(`Host: ${result.host}`);
            console.log(`Endpoint: ${result.endpoint}`);
            return;
        }
    }
    console.log('\n\n❌ No working providers found');
}

findWorkingProvider();
