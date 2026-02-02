const axios = require('axios');

async function verifyAudio() {
    const videoUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
    const formatId = '140'; // Usually m4a audio on YouTube
    const ext = 'mp3';
    const proxyUrl = `http://localhost:3000/api/youtube/stream-download?url=${encodeURIComponent(videoUrl)}&id=${formatId}&ext=${ext}`;

    console.log(`Testing audio proxy download: ${proxyUrl}`);

    try {
        const response = await axios({
            method: 'get',
            url: proxyUrl,
            responseType: 'stream'
        });

        const contentType = response.headers['content-type'];
        const contentDisposition = response.headers['content-disposition'];

        console.log(`Content-Type: ${contentType}`);
        console.log(`Content-Disposition: ${contentDisposition}`);

        if (contentType === 'audio/mpeg' && contentDisposition.includes('download.mp3')) {
            console.log('🎉 SUCCESS: Headers are correct for audio download!');
            process.exit(0);
        } else {
            console.error('❌ FAILURE: Headers are incorrect.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ ERROR during test:', error.message);
        process.exit(1);
    }
}

verifyAudio();
