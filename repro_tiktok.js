const url = 'https://www.tiktok.com/@khaby.lame/video/7024281421016237058';

async function reproTikTok() {
    const path = require('path');
    try {
        console.log('[STEP 1] Importing @tobyg74/tiktok-api-dl...');
        const Tiktok = require('@tobyg74/tiktok-api-dl');
        console.log('Tiktok found:', !!Tiktok);

        console.log('[STEP 2] Calling Downloader...');
        let result;
        try {
            result = await Tiktok.Downloader(url, { version: "v3" });
            console.log('Result Status:', result ? result.status : 'null');
        } catch (libError) {
            console.error('Library failed:', libError.message);
        }

        const formats = [];
        let title = 'TikTok Video';
        let thumbnail = '';

        if (result && result.status === 'success' && result.result) {
            const data = result.result;
            console.log('[STEP 3] Processing library results...');
            title = data.description || title;
            thumbnail = data.cover || thumbnail;

            if (data.video) {
                formats.push({ url: data.video, quality: 'Download (No Watermark)', format: 'mp4' });
            }
            if (data.video_hd || data.video_sd) {
                formats.push({ url: data.video_hd || data.video_sd, quality: 'Download (With Watermark)', format: 'mp4' });
            }
            if (data.music) {
                formats.push({ url: data.music, quality: 'Download Audio', format: 'mp3' });
            }
        }

        if (formats.length > 0) {
            console.log('✅ SUCCESS via Library!');
            console.log('Formats:', formats.length);
            return;
        }

        console.log('[STEP 4] Falling back to yt-dlp via exec...');
        const { exec } = require('child_process');
        const binaryPath = path.join(__dirname, 'yt-dlp.exe');

        console.log('yt-dlp.exe exists:', require('fs').existsSync(binaryPath));

        const args = [
            `"${url}"`,
            '--dump-single-json',
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--no-update'
        ];

        console.log('Executing command...');
        exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('--- CRASH ---');
                console.error(error.message);
                return;
            }

            try {
                const output = JSON.parse(stdout);
                if (output && output.formats) {
                    console.log('✅ SUCCESS via yt-dlp exec!');
                    const ytdlFormats = output.formats
                        .filter(f => f.vcodec !== 'none' && f.acodec !== 'none');
                    console.log('Formats:', ytdlFormats.length);
                } else {
                    console.log('❌ No formats found in JSON');
                }
            } catch (err) {
                console.error('JSON Parse Error:', err.message);
                console.log('STDOUT snippet:', stdout.substring(0, 100));
            }
        });

    } catch (error) {
        console.error('--- CRASH ---');
        console.error(error.stack || error);
    }
}

reproTikTok();
