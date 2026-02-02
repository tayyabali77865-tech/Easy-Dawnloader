const axios = require('axios');

const instances = [
    'https://coapi.kelig.me/api/json',
    'https://nyc1.coapi.ggtyler.dev/api/json',
    'https://cobalt-api.ayo.tf/api/json',
    'https://api.cobalt.tacohitbox.com/api/json',
    'https://dl01.yt-dl.click/api/json'
];

const testVideo = 'https://www.youtube.com/watch?v=ScMzIvxBSi4'; // Short harmless video

async function testInstance(url) {
    try {
        console.log(`Testing ${url}...`);
        const response = await axios.post(url, {
            url: testVideo,
            vQuality: '1080' // Requesting 1080p
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });

        if (response.data && (response.data.url || response.data.picker)) {
            console.log(`✅ SUCCESS: ${url}`);
            console.log('Response preview:', JSON.stringify(response.data).substring(0, 100));
            return true;
        } else {
            console.log(`❌ FAILED (Invalid response): ${url}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ FAILED (${error.message}): ${url}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Testing Cobalt Instances for 1080p support...\n');

    for (const instance of instances) {
        const success = await testInstance(instance);
        if (success) {
            console.log(`\n🎉 Found working instance: ${instance}`);
            console.log('You can use this URL for the API.');
            break; // Stop after finding the first working one
        }
    }
}

runTests();
