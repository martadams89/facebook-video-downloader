import fs from 'node:fs';

// Pull the extractor straight out of the page so the test exercises the real code.
const html = fs.readFileSync(new URL('../src/page.html', import.meta.url),'utf8');
const script = html.split('<script>')[1].split('</scr'+'ipt>')[0];
const start = script.indexOf('var VIDEO_KEYS');
const end = script.indexOf('/* ---------- the bookmarklet');
const src = script.slice(start, end);
const mod = new Function(src + '; return {extract, videoId, decode, whole, idFromUrl};')();

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
https://video-lhr8-1.xx.fbcdn.net/o1/v/t2/f2/m69/AbCdEf?efg=xyz&_nc_oc=Q1&oh=00_Af&oe=68C0
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
// Source order is deliberate: variants of one clip stay adjacent, and SD
// (the Trello-sized one) comes first.
if (mod2[0] && mod2[0].quality !== 'SD') mFail.push('source order not preserved');
if (!mod2.some(f => f.quality === 'SD')) mFail.push('SD label lost');
if (mod2.some(f => f.url.includes('\\'))) mFail.push('escaped slashes left in URL');
if (!mod2.every(f => f.url.length > 400)) mFail.push('URL truncated');
console.log(mFail.length ? 'FAIL: ' + mFail.join('; ') : 'Modern-schema checks passed.');

// The generic sweep must not pile extra unlabelled rows on top of clean
// named-key results: one real post yields 20+ incidental matches.
const noisy = modern + '\n' + Array.from({length:9},(_,i)=>
  `https://scontent-lhr6-2.xx.fbcdn.net/o1/v/t2/f2/m69/extra${i}.mp4?oh=0&oe=1`).join('\n');
const noisyOut = mod.extract(noisy).filter(f => f.kind === 'Video');
console.log('\nnamed keys + 9 stray URLs ->', noisyOut.length, 'videos');
console.log(noisyOut.length === 2
  ? 'Fallback-only sweep passed.'
  : 'FAIL: generic sweep ran despite named-key hits (' + noisyOut.length + ' videos)');

// ...but it must still fire when the named keys find nothing.
const legacyOnly = mod.extract('x'.repeat(250) + ' https://video-lhr8-1.xx.fbcdn.net/v/t42.1790-2/only_n.mp4?oh=1 ');
console.log(legacyOnly.some(f => f.kind === 'Video')
  ? 'Fallback still fires when named keys miss.'
  : 'FAIL: fallback sweep did not fire');

// Every permalink shape Facebook uses, not just ?v=. Getting these wrong
// meant falling back to a timestamp for the filename.
const urlCases = [
  ['https://www.facebook.com/gerald.g/videos/1871225183860970/?idorvanity=242', '1871225183860970'],
  ['https://www.facebook.com/546179903/videos/pcb.2123718148220076/1835526377763709', '1835526377763709'],
  ['https://www.facebook.com/watch/?v=1835526377763709', '1835526377763709'],
  ['https://www.facebook.com/reel/987654321012345', '987654321012345'],
  ['https://www.facebook.com/groups/12345', null],
];
const urlFails = urlCases.filter(([u, want]) => mod.idFromUrl(u) !== want);
console.log('\npermalink shapes ->', urlCases.length - urlFails.length + '/' + urlCases.length, 'parsed');
console.log(urlFails.length
  ? 'FAIL: ' + urlFails.map(([u]) => u.slice(-34)).join('; ')
  : 'Permalink parsing passed.');

// Scoping: the id of the video a URL belongs to sits just before it, so the
// clip the page is about must be separable from the suggestion rail.
const TARGET = '1871225183860970';
const OTHER = '1120215580359026';
const sig2 = '?oh=00_Af&oe=68C0';
const feed = `
{"video_id":"${TARGET}","videoDeliveryResponseResult":{"progressive_urls":[
 {"progressive_url":"https:\\/\\/scontent-lhr6-2.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/WANTED${sig2}","failure_reason":null,"metadata":{"quality":"SD"}}]}}
${'.'.repeat(4000)}
{"video_id":"${OTHER}","videoDeliveryResponseResult":{"progressive_urls":[
 {"progressive_url":"https:\\/\\/scontent-lhr6-2.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/SUGGESTED${sig2}","failure_reason":null,"metadata":{"quality":"SD"}}]}}
`;
const scopedOut = mod.extract(feed, 'https://www.facebook.com/x/videos/' + TARGET + '/');
const primary = scopedOut.filter(f => f.primary);
console.log('\nfeed with 2 videos ->', scopedOut.length, 'found,', primary.length, 'marked as the opened video');
const sFail = [];
if (primary.length !== 1) sFail.push('expected exactly 1 primary, got ' + primary.length);
if (primary[0] && !primary[0].url.includes('WANTED')) sFail.push('marked the wrong video as primary');
if (scopedOut.some(f => f.primary && f.url.includes('SUGGESTED'))) sFail.push('suggestion marked primary');
// With no page URL there is nothing to scope by, so nothing may be primary.
if (mod.extract(feed, null).some(f => f.primary)) sFail.push('primary set without a page URL');
console.log(sFail.length ? 'FAIL: ' + sFail.join('; ') : 'Target-video scoping passed.');

// Avatars and UI chrome must not appear as photos.
const avatars = `
https://scontent-lhr6-2.xx.fbcdn.net/v/t39.30808-1/avatar_n.jpg?stp=c0.0.32.32a_p32x32
https://scontent-lhr6-2.xx.fbcdn.net/v/t1.30497-1/silhouette_n.jpg?stp=p64x64
https://scontent-lhr6-2.xx.fbcdn.net/v/t39.30808-6/icon_n.jpg?stp=dst-jpg_s48x48
https://scontent-lhr6-2.xx.fbcdn.net/v/t39.30808-6/realphoto_n.jpg?stp=dst-jpg_p2048x2048
`.padEnd(300, ' ');
const photos = mod.extract(avatars, null).filter(f => f.kind === 'Photo');
console.log('\navatar filtering ->', photos.length, 'photo(s) kept');
const aFail = [];
if (!photos.some(f => f.url.includes('realphoto'))) aFail.push('dropped the real photo');
['avatar_n', 'silhouette_n', 'icon_n'].forEach(bad => {
  if (photos.some(f => f.url.includes(bad))) aFail.push('kept ' + bad);
});
console.log(aFail.length ? 'FAIL: ' + aFail.join('; ') : 'Avatar filtering passed.');

// Facebook's SPA keeps the previous post's payload in the DOM. Arriving at a
// new video, the page therefore contains other posts' media and none of its
// own - the exact state measured on a real tab (6 URLs, 0 belonging to the
// post on screen). Offering those is how the wrong video gets downloaded.
const STALE_A = '2222222222222222', STALE_B = '3333333333333333';
const NOW = '1371563121002274';
const staleSig = '?oh=00_Af&oe=68C0';
const stalePayload = `
{"video_id":"${STALE_A}","videoDeliveryResponseResult":{"progressive_urls":[
 {"progressive_url":"https:\\/\\/scontent-lhr6-2.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/OLDPOST${staleSig}","failure_reason":null,"metadata":{"quality":"SD"}}]}}
${'.'.repeat(4000)}
{"video_id":"${STALE_B}","videoDeliveryResponseResult":{"progressive_urls":[
 {"progressive_url":"https:\\/\\/scontent-lhr6-2.xx.fbcdn.net\\/o1\\/v\\/t2\\/f2\\/m69\\/OLDER${staleSig}","failure_reason":null,"metadata":{"quality":"SD"}}]}}
https://scontent-lhr6-2.xx.fbcdn.net/v/t39.30808-6/thispost_n.jpg?stp=dst-jpg_p2048x2048
`;
const staleOut = mod.extract(stalePayload, 'https://www.facebook.com/x/videos/pcb.999/' + NOW + '/');
const staleVideos = staleOut.filter(f => f.kind === 'Video');
console.log('\nstale SPA payload ->', staleVideos.length, 'videos present,',
  staleVideos.filter(f => f.primary).length, 'claimed as this post');
const stFail = [];
if (!staleOut.targetKnown) stFail.push('targetKnown not set, so the page cannot tell it is missing');
if (staleVideos.filter(f => f.primary).length !== 0) stFail.push('another post\u2019s video marked as this one');
if (staleVideos.length !== 2) stFail.push('expected the 2 stale videos to still be listed as others');
if (!staleOut.some(f => f.kind === 'Photo')) stFail.push('lost this post\u2019s photo');
// And when the id IS present, it must still be found.
const fresh = stalePayload.replace(STALE_A, NOW);
const freshPrimary = mod.extract(fresh, 'https://www.facebook.com/x/videos/' + NOW + '/')
  .filter(f => f.kind === 'Video' && f.primary);
if (freshPrimary.length !== 1) stFail.push('failed to match the video when it IS this post');
console.log(stFail.length ? 'FAIL: ' + stFail.join('; ') : 'Stale-SPA payload checks passed.');

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
if (found[0].kind !== 'Video') fail.push('videos not sorted before photos');

console.log(fail.length ? '\nFAIL: ' + fail.join('; ') : '\nAll extractor checks passed.');
