const { exec } = require('child_process');
const path = require('path');
const url = 'https://youtu.be/j7ZC77fRGnE';

const binaryPath = path.join(__dirname, 'yt-dlp.exe');
console.log(`Testing yt-dlp binary at: "${binaryPath}"`);

// Standard arguments for JSON dump
const args = [
    url,
    '--dump-single-json',
    '--no-check-certificates',
    '--no-warnings',
    '--prefer-free-formats',
    '--no-update'
];

// Execute explicitly
console.log('Running command...');
exec(`"${binaryPath}" ${args.join(' ')}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing yt-dlp: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return;
    }

    try {
        const output = JSON.parse(stdout);
        console.log(`Title: ${output.title}`);

        const formats = output.formats;
        console.log(`Total Formats: ${formats.length}`);

        // Check critical resolutions
        [1080, 720, 480, 360].forEach(h => {
            const matching = formats.filter(f => f.height === h);
            if (matching.length > 0) {
                console.log(`\n--- ${h}p Formats ---`);
                matching.forEach(f => {
                    console.log(`ID: ${f.format_id} | Ext: ${f.ext} | Acodec: ${f.acodec} | Vcodec: ${f.vcodec} | Note: ${f.format_note}`);
                });
            } else {
                console.log(`\nNo formats found for ${h}p`);
            }
        });

    } catch (parseErr) {
        console.error("Failed to parse output:", parseErr);
    }
});
