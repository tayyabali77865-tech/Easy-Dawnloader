const url = 'https://www.tiktok.com/@looooooooch/video/7332450841198595330';

async function testLibRecent() {
    try {
        console.log('[STEP 1] Importing @tobyg74/tiktok-api-dl...');
        const Tiktok = require('@tobyg74/tiktok-api-dl');

        console.log('[STEP 2] Calling Downloader with recent video...');
        const result = await Tiktok.Downloader(url, { version: "v3" });

        console.log('Result Status:', result.status);
        if (result.status === 'success' && result.result) {
            console.log('✅ SUCCESS!');
            console.log('Video URL:', result.result.video || 'Not found');
            console.log('Music URL:', result.result.music || 'Not found');
        } else {
            console.log('❌ FAILED with status:', result.status);
            console.log('Full response:', JSON.stringify(result));
        }
    } catch (error) {
        console.error('--- CRASH ---');
        console.error(error.message);
    }
}

testLibRecent();
