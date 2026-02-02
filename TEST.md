# YouTube Download Test Script

This is a simple test to verify the API is working correctly.

## Test URL
Try this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

## Expected Behavior
The API should try these methods in order:
1. Cobalt API (4 instances)
2. Invidious API (4 instances)  
3. Y2Mate API (free, no key needed)
4. RapidAPI (only if YOUTUBE_API_KEY is set)
5. Alternative RapidAPI (only if YOUTUBE_API_KEY is set)
6. Internal ytdl-core library

## How to Test Locally
```bash
# Test the API endpoint directly
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"video"}'
```

## How to Check Vercel Logs
1. Go to https://vercel.com/dashboard
2. Select your project "easy-dawnloader"
3. Click on "Deployments" tab
4. Click on the latest deployment
5. Click on "Logs" tab
6. Look for messages like:
   - `[YOUTUBE] Trying Cobalt Instance...`
   - `[YOUTUBE] Trying Y2Mate Free API...`
   - `[YOUTUBE] Skipping RapidAPI (no YOUTUBE_API_KEY set)`

This will show you exactly which method is failing and why.
