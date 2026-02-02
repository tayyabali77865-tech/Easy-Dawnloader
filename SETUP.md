# Easy Downloader - Setup Guide

## Quick Start (No API Keys Required)
Your downloader works out-of-the-box with free public APIs! Just deploy to Vercel and it will work.

## Optional: Add Premium API Keys for Better Reliability

If you want even more reliable downloads, you can add your own RapidAPI keys:

### Step 1: Get Your Free RapidAPI Key
1. Go to [RapidAPI.com](https://rapidapi.com/) and create a free account
2. Subscribe to these FREE APIs:
   - [Social Media Video Downloader](https://rapidapi.com/social-media-video-downloader/api/social-media-video-downloader)
   - [YouTube v3](https://rapidapi.com/ytdlfree/api/youtube-v31)

3. After subscribing, go to any API page and look for **"X-RapidAPI-Key"** in the code snippets
4. Copy your key (it looks like: `a30165b88amsh484b669fb808d67p186fd9jsn565d1f2fc267`)

### Step 2: Add Keys to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`easy-dawnloader`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value |
|------|-------|
| `YOUTUBE_API_KEY` | Your RapidAPI key from Step 1 |
| `RAPIDAPI_KEY` | Same key (as backup) |

5. Click **Save**
6. Go to **Deployments** tab and click **Redeploy** on the latest deployment

### Step 3: Verify It's Working
1. Wait 30 seconds for deployment to complete
2. Try downloading a YouTube video
3. If you still see errors, check the **Logs** tab in Vercel for specific error codes

## Troubleshooting

### Error: "All 5 fallback layers failed"
**Solution**: Your API key might be invalid or you haven't set it yet. The downloader will still work with free methods, but adding a valid key improves reliability.

### Error: "401 Unauthorized" in Vercel Logs
**Solution**: Your RapidAPI key is invalid. Double-check you copied it correctly.

### Error: "429 Too Many Requests" in Vercel Logs
**Solution**: You've hit the free tier limit. Wait an hour or upgrade your RapidAPI plan.

## How It Works
The downloader tries multiple methods in order:
1. **Cobalt API** (4 free instances)
2. **Invidious API** (4 free instances)  
3. **Y2Mate API** (free, no key needed)
4. **YT1s API** (free, no key needed)
5. **RapidAPI** (only if you set `YOUTUBE_API_KEY`)
6. **Internal Library** (last resort)

Even without any API keys, you have 10+ free methods!
