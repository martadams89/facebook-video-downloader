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

// Regression: progressive video with no .mp4 in the URL at all. Facebook
// serves these off video*.fbcdn.net under /o1/v/* and /v/t42.*, and a
// filter keyed on the extension loses them silently.
const noExt = `
{"playable_url":"https:\\/\\/video-lhr8-1.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/AbCdEf?efg=xyz&_nc_oc=Q1&oh=00_Af&oe=68C0"}
https://video-lhr6-2.xx.fbcdn.net/v/t42.1790-2/nakedpath?_nc_ohc=Zz&oh=00_Ag&oe=68C1
https://static.xx.fbcdn.net/rsrc.php/v4/y1/r/someuiasset
`.padEnd(300,' ');
const nx = mod.extract(noExt).map(f => f.kind + ' ' + f.url);
console.log('\nextension-less URLs ->', nx.length, 'found');
for (const u of nx) console.log('  ', u.slice(0, 84));
const nxFail = [];
if (!nx.some(u => u.includes('/o1/v/t2/'))) nxFail.push('missed /o1/v/ progressive video');
if (!nx.some(u => u.includes('nakedpath'))) nxFail.push('missed extension-less /v/t42. video');
if (nx.some(u => u.includes('rsrc.php'))) nxFail.push('picked up a static UI asset');
if (nx.some(u => u.startsWith('Photo'))) nxFail.push('classified a video as a photo');
console.log(nxFail.length ? 'FAIL: ' + nxFail.join('; ') : 'Extension-less video checks passed.');

// Current Facebook schema: progressive_urls[] with the quality label in a
// metadata sibling AFTER the URL. The URLs are ~700-1100 chars, so a
// lookahead measured from the match start never reaches the label.
const longSig = '?stp=dst-mp4&_nc_cat=1&_nc_oc=' + 'Q1aBcD'.repeat(60) + '&oh=00_AfD&oe=68C0FFEE';
const modern = `
{"videoDeliveryResponseResult":{"progressive_urls":[
 {"progressive_url":"https:\\/\\/scontent-lhr6-2.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/LOWER${longSig}","failure_reason":null,"metadata":{"quality":"SD"}},
 {"progressive_url":"https:\\/\\/scontent-lhr6-2.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/HIGHER${longSig}","failure_reason":null,"metadata":{"quality":"HD"}}],
 "dash_manifests":[{"manifest_xml":"\\u003C?xml version=\\"1.0\\"?>"}]},
 "videoDeliveryLegacyFields":null}
`.padEnd(300,' ');
const mod2 = mod.extract(modern);
console.log('\nmodern schema ->', mod2.length, 'found:', mod2.map(f => f.quality || '(unlabelled)').join(', '));
const mFail = [];
if (mod2.length !== 2) mFail.push('expected 2 videos, got ' + mod2.length);
if (!mod2.every(f => f.kind === 'Video')) mFail.push('not all classified as video');
if (mod2[0] && mod2[0].quality !== 'HD') mFail.push('HD did not sort first');
if (!mod2.some(f => f.quality === 'SD')) mFail.push('SD label lost');
if (mod2.some(f => f.url.includes('\\'))) mFail.push('escaped slashes left in URL');
if (!mod2.every(f => f.url.length > 400)) mFail.push('URL truncated');
console.log(mFail.length ? 'FAIL: ' + mFail.join('; ') : 'Modern-schema checks passed.');

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
