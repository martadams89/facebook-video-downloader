## What & why

<!-- One or two sentences. Remember: your commit message becomes the release notes. -->

## Checklist

- [ ] Commit messages follow [Conventional Commits](../CONTRIBUTING.md#commit-messages--conventional-commits-required)
- [ ] `npm test && npm run build` passes
- [ ] Extractor changes have a case added to `test/extract.test.mjs`
- [ ] No credentials are accepted, stored or forwarded; the host allowlists are unchanged
- [ ] Content from pasted source or `postMessage` is still treated as untrusted text
