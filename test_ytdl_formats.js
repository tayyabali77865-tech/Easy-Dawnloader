const ytdl = require('@distube/ytdl-core');

const videoUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';

async function checkFormats() {
    try {
        console.log('Fetching video info...');
        const info = await ytdl.getInfo(videoUrl);

        console.log(`\nTitle: ${info.videoDetails.title}`);

        // Filter for video formats
        const formats = info.formats;

        console.log('\n--- Available Video Formats ---');
        formats.forEach(f => {
            if (f.hasVideo) {
                console.log(`Quality: ${f.qualityLabel} | Container: ${f.container} | HasAudio: ${f.hasAudio} | Codec: ${f.videoCodec}`);
            }
        });

    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkFormats();
