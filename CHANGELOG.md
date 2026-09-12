# Changelog

## [0.2.11](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.10...v0.2.11) (2026-09-12)


### 🧹 Maintenance

* **deps:** update dependency wrangler to ^4.131.1 ([#15](https://github.com/martadams89/facebook-video-downloader/issues/15)) ([d1e30e8](https://github.com/martadams89/facebook-video-downloader/commit/d1e30e8460ec79398809fa3521463e450fc90f80))

## [0.2.10](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.9...v0.2.10) (2026-09-12)


### 🧹 Maintenance

* **deps:** update renovatebot/github-action action to v46.3.0 ([#16](https://github.com/martadams89/facebook-video-downloader/issues/16)) ([6b49973](https://github.com/martadams89/facebook-video-downloader/commit/6b49973b08719f2f518016be20a267147a58e812))

## [0.2.9](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.8...v0.2.9) (2026-09-11)


### 🧹 Maintenance

* **deps:** update dependency wrangler to ^4.131.0 ([#13](https://github.com/martadams89/facebook-video-downloader/issues/13)) ([39438dd](https://github.com/martadams89/facebook-video-downloader/commit/39438ddda023137bc80b3d381eb48026fefd8e74))

## [0.2.8](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.7...v0.2.8) (2026-09-11)


### 🧹 Maintenance

* **deps:** update renovatebot/github-action action to v46.2.6 ([#4](https://github.com/martadams89/facebook-video-downloader/issues/4)) ([12d7ff4](https://github.com/martadams89/facebook-video-downloader/commit/12d7ff4534966c7b2e9f7f973ab8cfdc58a5c314))

## [0.2.7](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.6...v0.2.7) (2026-09-10)


### 🐛 Bug Fixes

* reload the post when Facebook never delivered its video ([6e911f8](https://github.com/martadams89/facebook-video-downloader/commit/6e911f8ca651fa0f8962071470d24efe349e4ef1))

## [0.2.6](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.5...v0.2.6) (2026-09-10)


### 🐛 Bug Fixes

* stop truncating the payload past the media, and never wait silently ([f7aa015](https://github.com/martadams89/facebook-video-downloader/commit/f7aa015d62ed824cc86aea8effb88365caabf9f9))

## [0.2.5](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.4...v0.2.5) (2026-09-10)


### 🐛 Bug Fixes

* open the tab on the click, and recover when Facebook publishes nothing ([e4f0955](https://github.com/martadams89/facebook-video-downloader/commit/e4f0955c88701f338b671737d03e65b298c65944))

## [0.2.4](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.3...v0.2.4) (2026-09-10)


### 🐛 Bug Fixes

* never hand over the previously viewed post's video ([9791997](https://github.com/martadams89/facebook-video-downloader/commit/97919975263f0c5634aca828f50b1551cf185f82))

## [0.2.3](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.2...v0.2.3) (2026-09-10)


### 🧹 Maintenance

* **deps:** update dependency node to v24.21.0 ([#5](https://github.com/martadams89/facebook-video-downloader/issues/5)) ([7bcc007](https://github.com/martadams89/facebook-video-downloader/commit/7bcc007dd75f64ccf6fc06e78935ba8c199b064d))

## [0.2.2](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.1...v0.2.2) (2026-09-10)


### 🐛 Bug Fixes

* wait for the video before handing over, not after ([4dd3b3a](https://github.com/martadams89/facebook-video-downloader/commit/4dd3b3af8da12a8e3a57d75ca6936695a2ffd361))

## [0.2.1](https://github.com/martadams89/facebook-video-downloader/compare/v0.2.0...v0.2.1) (2026-09-10)


### 🐛 Bug Fixes

* show the video the page is actually about ([999f3c1](https://github.com/martadams89/facebook-video-downloader/commit/999f3c1a0b6c4aaa0518244d3f44b6ee2a33d146))

## [0.2.0](https://github.com/martadams89/facebook-video-downloader/compare/v0.1.0...v0.2.0) (2026-09-10)


### ✨ Features

* save Facebook videos and photos as downloadable files ([3e01305](https://github.com/martadams89/facebook-video-downloader/commit/3e0130545c15e7085fbf5a24e0fdfb411bdd1f58))


### 🐛 Bug Fixes

* detect video URLs that have no .mp4 extension ([07b6f0f](https://github.com/martadams89/facebook-video-downloader/commit/07b6f0f13dc5774c9471f996b13640f5d1ac3a52))
* make a page full of videos usable, and stop logging signed URLs ([62b6a58](https://github.com/martadams89/facebook-video-downloader/commit/62b6a583ab4c9f81263a1c1516cd8c8f965b771b))
* only sweep for stray media URLs when named keys find nothing ([0fefe33](https://github.com/martadams89/facebook-video-downloader/commit/0fefe3301a139f95ef3dc4be62342847d81a2bf5))
* read the current Facebook video schema ([2a22ad5](https://github.com/martadams89/facebook-video-downloader/commit/2a22ad5238db45d2c144bf1487b9f345ab192856))
