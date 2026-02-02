const tiktok = require('@tobyg74/tiktok-api-dl');
console.log('Keys in tiktok library:', Object.keys(tiktok));
if (tiktok.Tiktok) console.log('Tiktok found (PascalCase)');
if (tiktok.tiktok) console.log('tiktok found (lowercase)');
if (tiktok.TikTok) console.log('TikTok found (mixed)');
