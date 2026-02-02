const axios = require('axios');

async function testUserFlow() {
    const username = 'khaby.lame';
    const apiKey = 'a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267';
    const host = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';

    try {
        console.log(`--- Step 1: Get User ID for @${username} ---`);
        const userResp = await axios.get(`https://${host}/user/info`, {
            params: { username: username },
            headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
        });

        console.log('User Resp Status:', userResp.status);
        console.log('User Resp Keys:', Object.keys(userResp.data));

        if (userResp.data.data && userResp.data.data.user) {
            const userId = userResp.data.data.user.id;
            console.log(`✅ User ID Found: ${userId}`);

            console.log(`\n--- Step 2: Get Feed for User ${userId} ---`);
            const feedResp = await axios.get(`https://${host}/user/id/${userId}/feed`, {
                params: { offset: 0 },
                headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey }
            });

            console.log('Feed Resp Status:', feedResp.status);
            console.log('Feed Resp Keys:', Object.keys(feedResp.data));
            if (feedResp.data.data && feedResp.data.data.aweme_list) {
                console.log('✅ SUCCESS! Aweme List found with', feedResp.data.data.aweme_list.length, 'videos');
                // Check first video for download links
                const video = feedResp.data.data.aweme_list[0].video;
                if (video && video.play_addr) {
                    console.log('🚨 FOUND PLAY URL:', video.play_addr.url_list[0]);
                }
            }
        } else {
            console.log('❌ User data structure unknown or null');
            console.log('Full data keys:', Object.keys(userResp.data.data || {}));
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error.message} (${error.response ? error.response.status : 'No response'})`);
        if (error.response) console.log('Response:', JSON.stringify(error.response.data));
    }
}

testUserFlow();
