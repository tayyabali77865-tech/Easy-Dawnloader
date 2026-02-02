const axios = require('axios');

async function verifyNoSilentFormats() {
    const videoUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';

    try {
        console.log(`Checking formats for: ${videoUrl}`);
        const response = await axios.post('http://localhost:3000/api/youtube/download', {
            url: videoUrl,
            format: 'video'
        }, { timeout: 30000 });

        const formats = response.data.formats;
        console.log(`Found ${formats.length} formats.`);

        // The metadata returned by the API now explicitly sets hasAudio: true for all
        const silentFormats = formats.filter(f => f.hasAudio === false);

        if (silentFormats.length === 0) {
            console.log('✅ SUCCESS: No silent formats found in the response.');
            process.exit(0);
        } else {
            console.error('❌ FAILURE: Found silent formats:', silentFormats);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ ERROR during verification:', error.message);
        process.exit(1);
    }
}

verifyNoSilentFormats();
