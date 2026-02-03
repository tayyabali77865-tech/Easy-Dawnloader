# How to View Expanded Logs in Vercel

## Step-by-Step:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project: **easy-dawnloader**
3. Click on **Deployments** tab
4. Click on the **latest deployment** (top one)
5. Click on **Logs** or **Runtime Logs** tab
6. Find this line:
   ```
   POST /api/youtube/download - 25 messages
   ```
7. **CLICK ON THAT LINE** (it's clickable!)
8. It will expand and show all 25 messages like:
   ```
   [YOUTUBE DOWNLOAD] Processing: https://...
   [YOUTUBE] Trying Cobalt Instance: ...
   [YOUTUBE] Cobalt failed: ...
   [YOUTUBE] Trying Invidious Instance: ...
   etc.
   ```
9. Copy ALL those expanded messages and send them to me

## Alternative: Use Vercel CLI

If the web interface doesn't work, you can use the command line:

```bash
vercel logs easy-dawnloader --follow
```

Then try downloading a video and you'll see live logs.

---

**I need the EXPANDED logs to see why each method is failing!**
