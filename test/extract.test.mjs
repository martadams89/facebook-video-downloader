import fs from 'node:fs';

// Pull the extractor straight out of the page so the test exercises the real code.
const html = fs.readFileSync(new URL('../src/page.html', import.meta.url),'utf8');
const script = html.split('<script>')[1].split('</scr'+'ipt>')[0];
const start = script.indexOf('var VIDEO_KEYS');
const end = script.indexOf('/* ---------- the bookmarklet');
const src = script.slice(start, end);
const mod = new Function(src + '; return {extract, videoId, decode, whole};')();

// Fixture shaped like a real /watch payload: JSON-escaped slashes, &amp; in the
// query, a feed with two videos, avatars and emoji that must NOT be picked up.
const sig = '?_nc_cat=1&amp;_nc_ohc=AbC123&amp;oh=00_AfDx&amp;oe=68C0FFEE';
const fixture = `
<html><head><title>(2) Video | Facebook</title></head><body>
<script type="application/json" data-sjs>
{"video_id":"1835526377763709",
 "playable_url":"https:\\/\\/video-lhr8-1.xx.fbcdn.net\\/v\\/t42.1790-2\\/aaa_n.mp4${sig}",
 "playable_url_quality_hd":"https:\\/\\/video-lhr8-1.xx.fbcdn.net\\/v\\/t42.1790-2\\/bbb_n.mp4${sig}",
 "preferred_thumbnail":{"image":{"uri":"https:\\/\\/scontent-lhr8-1.xx.fbcdn.net\\/v\\/t39.30808-6\\/thumb_n.jpg?stp=dst-jpg_s1080x1080"}}}
</scr`+`ipt>
<script type="application/json" data-sjs>
{"browser_native_sd_url":"https:\\/\\/video-lhr6-2.xx.fbcdn.net\\/v\\/t42.1790-2\\/second_n.mp4${sig}",
 "actor":{"profile_picture":{"uri":"https:\\/\\/scontent-lhr8-1.xx.fbcdn.net\\/v\\/t39.30808-1\\/avatar_n.jpg?stp=c0.0.32.32a_p32x32"}},
 "photo":{"image":{"uri":"https:\\/\\/scontent-lhr8-1.xx.fbcdn.net\\/v\\/t39.30808-6\\/bigphoto_n.jpg?stp=dst-jpg_p2048x2048"}}}
</scr`+`ipt>
<img src="https://static.xx.fbcdn.net/rsrc.php/y1/r/icon.png">
</body></html>
https://video-lhr8-1.xx.fbcdn.net/v/t42.1790-2/aaa_n.mp4?_nc_cat=1&oh=00_AfDx&oe=68C0FFEE&bytestart=0&byteend=524287
`;

const found = mod.extract(fixture);
console.log('video id ->', mod.videoId(fixture));
console.log('found', found.length, 'items:');
for (const f of found) console.log('  ', (f.kind+' '+f.quality).padEnd(10), f.url.slice(0,78));

const urls = found.map(f => f.url);
const fail = [];
if (!urls.some(u => u.includes('bbb_n.mp4'))) fail.push('missed HD video');
if (!urls.some(u => u.includes('aaa_n.mp4'))) fail.push('missed SD video');
if (!urls.some(u => u.includes('second_n.mp4'))) fail.push('missed 2nd feed video');
if (urls.some(u => u.includes('avatar_n.jpg'))) fail.push('picked up an avatar');
if (urls.some(u => u.includes('static.xx.fbcdn.net'))) fail.push('picked up a UI sprite');
if (urls.some(u => u.includes('bytestart'))) fail.push('left a byte-range on a URL');
if (urls.some(u => u.includes('&amp;'))) fail.push('left &amp; unescaped');
if (urls.some(u => u.includes('\\/'))) fail.push('left escaped slashes');
if (!urls.some(u => u.includes('bigphoto_n.jpg'))) fail.push('missed the full-size photo');
// The same file signed twice must collapse to one row.
if (urls.filter(u => u.includes('aaa_n.mp4')).length !== 1) fail.push('duplicate of aaa_n.mp4');
if (found[0].quality !== 'HD') fail.push('HD not sorted first');

console.log(fail.length ? '\nFAIL: ' + fail.join('; ') : '\nAll extractor checks passed.');
