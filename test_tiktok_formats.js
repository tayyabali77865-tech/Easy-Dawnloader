const { exec } = require('child_process');
const path = require('path');

const testUrl = 'https://www.tiktok.com/@khaby.lame/video/7137423965982412038'; // Popular TikTok

const binaryPath = path.join(__dirname, 'yt-dlp.exe');

console.log('Testing TikTok download with different format options...\n');

// Test 1: Simple best format
console.log('Test 1: Using -f best');
exec(`"${binaryPath}" "${testUrl}" -f best --print "%(format_id)s %(ext)s %(vcodec)s %(acodec)s %(resolution)s"`,
    { timeout: 15000 },
    (err, stdout, stderr) => {
        if (err) {
            console.log('❌ Failed:', err.message);
        } else {
            console.log('✅ Format info:', stdout.trim());
        }

        // Test 2: Best video+audio merge
        console.log('\nTest 2: Using bestvideo+bestaudio merge');
        exec(`"${binaryPath}" "${testUrl}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --print "%(format_id)s %(ext)s %(vcodec)s %(acodec)s"`,
            { timeout: 15000 },
            (err2, stdout2, stderr2) => {
                if (err2) {
                    console.log('❌ Failed:', err2.message);
                } else {
                    console.log('✅ Format info:', stdout2.trim());
                }

                // Test 3: List all available formats
                console.log('\nTest 3: Listing all available formats');
                exec(`"${binaryPath}" "${testUrl}" -F`,
                    { timeout: 15000 },
                    (err3, stdout3, stderr3) => {
                        if (err3) {
                            console.log('❌ Failed:', err3.message);
                        } else {
                            console.log('Available formats:\n', stdout3);
                        }
                    }
                );
            }
        );
    }
);
