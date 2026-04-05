const axios = require('axios');

const instances = [
    'https://api.cobalt.tools/api/json', // Official (might fail)
    'https://cobalt-api.ayo.tf/api/json',
    'https://api.cobalt.tacohitbox.com/api/json',
    'https://cobalt.missuo.me/api/json',
    'https://cobalt.kwiatekmiki.pl/api/json',
    'https://cobalt.q1n.dev/api/json'
];

const testVideo = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';

async function testInstance(url) {
    try {
        console.log(`Testing ${url}...`);
        const response = await axios.post(url, {
            url: testVideo,
            vQuality: '1080'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://cobalt.tools', // Sometimes helps
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 15000 // Increased timeout
        });

        if (response.data && (response.data.url || response.data.picker)) {
            console.log(`✅ SUCCESS: ${url}`);
            return true;
        } else {
            console.log(`❌ FAILED (Invalid response): ${url}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ FAILED: ${url} - ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Testing Cobalt Instances (Round 2)...\n');

    for (const instance of instances) {
        if (await testInstance(instance)) {
            console.log(`\n🎉 WE HAVE A WINNER: ${instance}`);
            break;
        }
    }
}

runTests();
