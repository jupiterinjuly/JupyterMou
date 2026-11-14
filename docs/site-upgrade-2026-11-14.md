# JupyterMou site upgrade — 2026-11-14

## Sources and preserved features

- Personal baseline: `9ae7493549d2f2e42b5fdcb89ac408d1729b800f`.
- Official baseline: NotionNext `v4.11.1`, commit `60c640eb8b0a5496398a81c6f86488a2be62c0b9`.
- Incorporated the shared RSS builder and discovery changes from upstream `901178b4`.
- Preserved this repository's existing GitHub workflows; the official project's documentation deployment and maintainer automation are not needed to publish this blog.
- Site version: `4.11.1-jupytermou.1`; Node.js 22 for local validation and Node.js 24 selected by Vercel within the supported engine range; Next.js 15.5.27.
- Kept the Hexo layout, homepage image, profile, contact QR codes, favicon, registration details, GA4 summary/dashboard/globe, custom error pages, and isolated HTML replay viewer.
- Kept the local image retry behavior while integrating official Notion image mapping and zoom lifecycle fixes.

## Site fixes

- RSS uses all published, unprotected posts, ordered by publication date, independently of the six-entry recent-updates sidebar.
- On server deployments, `/rss/feed.xml`, `/rss/atom.xml`, and `/rss/feed.json` route to the live feed API before build-time files. Feed generation caches for ten minutes and preserves full-content support. Static exports still generate files.
- Article rendering uses up to three concurrent reads; an unavailable article falls back to its summary without hiding the rest of the feed.
- RSS discovery metadata points to the canonical production domain. The Notion `LINK` setting was corrected from `http://jupytermou.cn` to `https://www.jupytermou.cn`.
- Database row metadata is excluded from article and announcement bodies during rendering; embedded tables and galleries remain supported.
- The Notion configuration row `FONT_URL` now loads only `https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css`, preserving the site's WenKai typeface. Removed duplicate Bitter/Noto font downloads.
- Vercel uploads exclude the upstream documentation site, Cloudflare-only functions, tests, and development artifacts.

## Deployment and rollback

Project: `jupiterinjulys-projects-56c0e6e6/notion-next-qsuf`.

Create a production-environment deployment with `vercel deploy --prod --skip-domain`, verify its deployment URL, then use `vercel promote` to assign the existing production domains.

Previous production deployment, retained as the rollback target:

`https://notion-next-qsuf-fdt6otkcy-jupiterinjulys-projects-56c0e6e6.vercel.app`

The GA4 credentials and other deployment secrets remain in Vercel. Local environment files are ignored by Git; no credentials are recorded here.

Production deployment promoted to `https://www.jupytermou.cn`:

`dpl_9W6r2eG94a9XN8kUTAY41TMfd2EY` (Next.js build `7iMtpxUOcEICVrAkfSnzd`).

The temporary Vercel hostname could not be reached from the local network. The production deployment was verified through the custom domain immediately after promotion, with the previous deployment available for rollback.

## Validation

- 746 unit tests passed; one existing integration test was skipped. TypeScript and lint checks passed, with existing nonblocking lint warnings.
- Local production build and the final Vercel production build succeeded. After restoring the original image proportions, all 16 image component tests and the image lint check passed again.
- All 16 distinct desktop/mobile browser scenarios passed across the production run and focused reruns: personal layout, announcement, fonts, about page, Osaka gallery, repeated image zoom, full feeds, real analytics, and both isolated HTML replays. Two mobile scenarios were rerun after another Playwright process removed their trace files; the feed assertion was corrected to check JSON content type because Vercel consumes the server cache directive.
- The live feed contains 32 public articles, matching the Notion database's 36 published articles minus four password-protected articles. All feed URLs use the canonical HTTPS domain.
- GitHub CodeQL analysis completed successfully but its separate alert check reports 17 findings. These include existing password persistence/validation behavior, URL-matching heuristics, and upstream scripts or themes not used by the Hexo site; this upgrade does not claim a clean security audit. Legacy Netlify preview checks also report failures; the production host for this rollout is Vercel.
- The existing URL submission workflow fails because Python 3.8 is unavailable on the current Ubuntu runner. The current GitHub connection cannot modify workflow files. A validated YAML change to select Python `3.x` is provided in `docs/push-url-python.patch` for application after workflow write access is available; it has not been applied or run on GitHub.
