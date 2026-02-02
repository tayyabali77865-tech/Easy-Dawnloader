const { exec } = require('child_process');
const path = require('path');

const binaryPath = path.join(__dirname, 'yt-dlp.exe');
const fbUrl = 'https://www.facebook.com/share/r/1FB3GpnxKC/';

console.log(`Testing yt-dlp with Facebook URL: ${fbUrl}`);

const args = [
    `"${fbUrl}"`,
    '--dump-single-json',
    '--no-check-certificates',
    '--no-warnings'
];

exec(`"${binaryPath}" ${args.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
        console.error('yt-dlp failed for Facebook:', error.message);
        return;
    }

    try {
        const info = JSON.parse(stdout);
        console.log('--- Metadata Found ---');
        console.log('Title:', info.title);
        console.log('Number of formats:', info.formats ? info.formats.length : 0);

        if (info.formats && info.formats.length > 0) {
            console.log('Example format sample:', JSON.stringify(info.formats[0]).substring(0, 200));
        }
    } catch (parseErr) {
        console.error('Failed to parse yt-dlp output:', parseErr);
        console.log('Raw output:', stdout.substring(0, 500));
    }
});
