const { spawn, exec } = require('child_process');
const path = require('path');

const binaryPath = path.join(__dirname, 'yt-dlp.exe');
const videoUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';

console.log('--- TEST 1: Get metadata ---');
exec(`"${binaryPath}" "${videoUrl}" --dump-single-json --no-check-certificates`, (err, stdout, stderr) => {
    if (err) {
        console.error('Metadata fetch failed:', err);
        return;
    }
    const info = JSON.parse(stdout);
    const firstFormat = info.formats[0];
    const formatId = firstFormat.format_id;
    const directUrl = firstFormat.url;

    console.log(`Format ID: ${formatId}`);
    console.log(`Direct URL: ${directUrl.substring(0, 50)}...`);

    console.log('\n--- TEST 2: Stream using Direct URL (Current behavior) ---');
    const args2 = [directUrl, '-f', formatId, '-o', '-', '--no-check-certificates'];
    console.log(`Running: yt-dlp ${args2.join(' ')}`);
    const proc2 = spawn(binaryPath, args2);

    let count2 = 0;
    proc2.stdout.on('data', (data) => {
        count2 += data.length;
    });

    proc2.stderr.on('data', (data) => {
        console.error(`Proc2 Stderr: ${data.toString()}`);
    });

    proc2.on('close', (code) => {
        console.log(`Proc2 closed with code ${code}. Total bytes: ${count2}`);

        console.log('\n--- TEST 3: Stream using Video URL (Proposed fix) ---');
        const args3 = [videoUrl, '-f', formatId, '-o', '-', '--no-check-certificates'];
        console.log(`Running: yt-dlp ${args3.join(' ')}`);
        const proc3 = spawn(binaryPath, args3);

        let count3 = 0;
        proc3.stdout.on('data', (data) => {
            count3 += data.length;
        });

        proc3.on('close', (code3) => {
            console.log(`Proc3 closed with code ${code3}. Total bytes: ${count3}`);
        });
    });
});
