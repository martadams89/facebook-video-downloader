# facebook-video-downloader

[![CI](https://github.com/martadams89/facebook-video-downloader/actions/workflows/ci.yml/badge.svg)](https://github.com/martadams89/facebook-video-downloader/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/martadams89/facebook-video-downloader?sort=semver)](https://github.com/martadams89/facebook-video-downloader/releases)
[![License: GPL v3](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

A small Cloudflare Worker serving a single plain page that saves the video or
photo from a Facebook post — including posts in **private groups the viewer
belongs to** — as a file with a sensible name, sized up front so you know
whether it will fit wherever it is going (a Trello card, for instance).

Built for people who are not going to open developer tools: one page, no
branding, no sign-in, no analytics, nothing stored.

**It holds no Facebook credentials and cannot be given any** — see below for
why that is a design property rather than a limitation.

## Why it is built this way

Facebook serves its media as **pre-signed `fbcdn.net` URLs** that are fetchable
without any login for a few hours after they are issued. That single fact
decides the whole architecture:

- The Worker **never needs, asks for, or holds Facebook credentials.** It only
  ever receives a signed URL that the logged-in browser already had.
- Conversely, the Worker **cannot fetch a private post from a bare link.** When
  it requests `facebook.com/watch/?v=…` server-side it arrives as an anonymous
  visitor and gets the login wall. There is no way round that without an
  authenticated session, so a link on its own only works for *public* posts.

So the signed URL has to be lifted from the page **inside the logged-in
browser**, and handed to the Worker. The front end offers three ways to do that
(see *Getting the URL* below).

## Why the download is proxied

`/dl` streams the file back through the Worker rather than linking straight to
`fbcdn.net`, for two reasons:

1. Browsers ignore the `download` attribute on cross-origin links, so a direct
   link would just play the video instead of saving it.
2. It is the only place a sensible filename can be set.

Range requests are passed through, so seeking and resumed downloads work.

## Getting the URL

**Bookmarklet** (built, no install): dragged to the bookmarks bar once. Clicking
it on a Facebook page reads `document.documentElement.outerHTML` plus any
`.mp4` URLs in the Resource Timing entries (which catches videos loaded by XHR
after page load), and `postMessage`s them to this page, which extracts and
lists them. Self-contained on purpose — Facebook's CSP blocks a `<script src>`
from a third-party origin, but a bookmarklet's own code runs as a user action.

**Paste page source** (fallback): right-click → View page source → select all →
paste. Runs the identical extractor.

**Paste a link** (public posts only): `POST /link` fetches the page server-side
and hands the HTML back for the same extractor. Private posts return a login
wall, and the page says so.

## Trello attachment limits

The page probes each file's size and badges it, because the limit bites:

| Plan | Max per attachment |
| --- | --- |
| Free | 10 MB |
| Standard / Premium / Enterprise | 250 MB |

Where the HD version is over the free limit and an SD version was found, the
page points at the SD one — that is usually enough for a short clip. In-browser
re-encoding was tried and removed: a 32 MB wasm download plus minutes of
single-threaded x264 per clip is the wrong trade. If SD is not small enough in
practice, the right fix is Cloudflare **Media Transformations**
(`/cdn-cgi/media/…`), which resizes server-side, needs Transformations enabled
on the zone, and caps input at 40 MB.

## Endpoints

| Route | Purpose |
| --- | --- |
| `GET /` | the page |
| `GET /probe?u=` | `{ok, status, size, type}` for one media URL |
| `GET /dl?u=&name=` | streams the file as an attachment (`&inline=1` to preview) |
| `POST /link` | `{url}` → `{html}` for a public post |
| `GET /robots.txt` | disallow all |

## Security notes

- `/dl` and `/probe` accept **`*.fbcdn.net` over HTTPS only**; `/link` accepts
  **`facebook.com` / `fb.watch` only**. Without those allowlists this would be
  an open proxy pointable at anything, including internal addresses.
- The bookmarklet's `postMessage` is accepted only from a `facebook.com`
  origin, and its contents are treated as untrusted text throughout: only
  `fbcdn.net` URLs survive extraction, the Worker refuses to fetch anything
  else, and nothing is ever assigned as HTML.
- CSP is `default-src 'none'` with no third-party origins at all.
- `noindex` plus a disallow-all `robots.txt`.
- Nothing is logged or persisted — no KV, no D1, no R2.

Because the page is public, consider putting it on an unguessable hostname, or
behind Cloudflare Access to restrict it to named people.

## Develop

```bash
npm install
npm run dev
```

Then open `http://localhost:8787`. The bookmarklet is generated from
`location.origin`, so the one served locally points at localhost and the one on
the deployed page points at the real host — nothing to rebuild between them.

```bash
npm test        # extractor fixture tests
npm run build   # Wrangler bundle (dry run), no credentials needed
```

The fixture tests cover HD/SD/multi-video feeds, avatar and UI-sprite
rejection, byte-range stripping, escape decoding and de-duplication. Both
commands run in CI as the required `ci` check.

## Deploy

Set the hostname in the commented `routes` block in `wrangler.jsonc`, then:

```bash
npm run deploy
```

Releases are automated with [release-please](https://github.com/googleapis/release-please)
from Conventional Commits, and dependencies by self-hosted Renovate. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Only save what you are allowed to keep

The tool does not bypass access control — it only reaches media the signed-in
person could already see, and it holds no credentials. Whether a copy may be
kept or re-shared is a separate question, and Facebook's terms restrict
automated collection. Intended use is saving a group's own material for that
group's records.

## Licence

[GPL-3.0-or-later](LICENSE).
