/**
 * YouTube: Stream Download (Proxy)
 * Pipes the video content directly from ytdl-core to the client response.
 * This bypasses 403 errors and client-side IP restrictions.
 */
app.get('/api/youtube/stream-download', async (req, res) => {
    const { url, itag } = req.query;

    if (!url || !itag) {
        return res.status(400).send('URL and itag are required');
    }

    try {
        const ytdl = require('@distube/ytdl-core');
        console.log(`[YOUTUBE PROXY] Streaming itag: ${itag} for: ${url}`);

        // Set headers for download
        // We might not know the exact filename/size immediately, but we can guess ext
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        res.setHeader('Content-Type', 'video/mp4');

        // Stream directly from ytdl
        ytdl(url, {
            quality: itag,
            filter: format => format.itag == itag
        }).pipe(res);

    } catch (error) {
        console.error('[YOUTUBE PROXY ERROR]:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Proxy error: ' + error.message);
        }
    }
});
