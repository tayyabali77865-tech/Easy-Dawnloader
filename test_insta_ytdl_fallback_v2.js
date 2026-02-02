const { exec } = require('child_process');
const path = require('path');

const binaryPath = path.join(__dirname, 'yt-dlp.exe');
const fullUrl = 'https://www.instagram.com/reel/DSU9VA7D501/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==';

console.log(`Testing yt-dlp with problematic Instagram URL: ${fullUrl}`);

const args = [
    `"${fullUrl}"`,
    '--dump-single-json',
    '--no-check-certificates',
    '--no-warnings'
];

exec(`"${binaryPath}" ${args.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
        console.error('yt-dlp failed for this Instagram Reel:', error.message);
        if (stderr) console.error('Stderr:', stderr);
        return;
    }

    try {
        const info = JSON.parse(stdout);
        console.log('--- Metadata Found ---');
        console.log('Title:', info.title);
        console.log('Format count:', info.formats ? info.formats.length : 0);
    } catch (parseErr) {
        console.error('Failed to parse yt-dlp output:', parseErr);
        console.log('Raw output snippet:', stdout.substring(0, 200));
    }
});
