const axios = require('axios');

const testVideo = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
const format = '1080';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLoaderTo() {
    try {
        console.log(`1. Requesting download for ${testVideo} in ${format}p...`);
        const step1 = await axios.get(`https://api.loader.to/v1/download`, {
            params: {
                format: format,
                url: testVideo,
                api: 'dfcb6d76f2f6a9894gjkege8a4ab232222' // Public key found in docs/examples often, or tries without
            }
        });

        if (!step1.data || !step1.data.id) {
            console.log('❌ Step 1 FAILED:', step1.data);
            return;
        }

        const id = step1.data.id;
        console.log(`✅ Job created with ID: ${id}`);

        console.log('2. Polling for status...');
        let attempts = 0;
        while (attempts < 20) {
            const step2 = await axios.get(`https://api.loader.to/v1/download/status`, {
                params: { id: id }
            });

            const status = step2.data.content; // usually returned here
            // API structure might vary, logging full response to debug
            // console.log('Poll response:', JSON.stringify(step2.data).substring(0, 100));

            if (step2.data.success === 1 && step2.data.download_url) {
                console.log(`\n🎉 SUCCESS! Download URL: ${step2.data.download_url}`);
                return;
            }

            console.log(`   Status: ${step2.data.text || 'Processing'}...`);
            await sleep(2000);
            attempts++;
        }
        console.log('❌ Timed out waiting for download.');

    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.response) console.log('Data:', error.response.data);
    }
}

testLoaderTo();
