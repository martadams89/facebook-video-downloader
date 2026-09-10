# Contributing

## Getting set up

```bash
npm install
npm run dev     # http://localhost:8787
```

The bookmarklet on the page is generated from `location.origin`, so the one
served by `npm run dev` points at localhost and needs no rebuilding between
local and production.

## Checks

```bash
npm test        # extractor fixture tests
npm run build   # Wrangler bundle (dry run) — catches a bad wrangler.jsonc
```

Both run in CI on every pull request as the required `ci` check.

## Commit messages — Conventional Commits (required)

Releases are fully automated: [release-please](https://github.com/googleapis/release-please)
reads commit messages off `main`, maintains a rolling release PR, and merging
it tags a version and writes `CHANGELOG.md`. **Your commit message becomes the
release notes**, so a lazy subject line becomes a lazy changelog entry.

```
feat: list every video found on a group feed page
fix: strip byte-range params from resource-timing URLs
docs: explain why a bare link cannot reach a private post
chore: bump wrangler to 4.131.0
```

| Prefix | Effect on the version |
| --- | --- |
| `fix:` | patch |
| `feat:` | minor |
| `feat!:` / `BREAKING CHANGE:` in the body | major |
| `docs:`, `chore:`, `perf:` | no bump, still in the changelog |

Anything else is ignored by release-please, so it will not appear in the notes.

## Things to keep true

A few properties are deliberate rather than incidental, and a change that
breaks one needs a good reason:

- **No credentials, ever.** The Worker only handles URLs that are already
  signed. It must never accept, store, or forward a Facebook password, cookie,
  or session token. If a change seems to need one, the design is wrong.
- **Not an open proxy.** `/dl` and `/probe` accept `*.fbcdn.net` over HTTPS
  only, and `/link` accepts `facebook.com` / `fb.watch` only. Widening those
  allowlists turns this into a general-purpose fetcher for anything, including
  addresses inside a private network.
- **Everything from the page is untrusted.** Pasted source and the
  bookmarklet's `postMessage` are attacker-controllable text. Keep it flowing
  through the extractor's `fbcdn.net` filter, keep using `textContent`, and
  never assign it as HTML.
- **Nothing is stored.** No KV, no D1, no R2, no logging of URLs. The page
  handles someone's private-group content, and the cheapest way to keep it safe
  is to not hold it.

## Pull requests

Keep the diff to one concern. Pure logic changes — anything in the extractor
especially — should come with a case added to `test/extract.test.mjs`.
