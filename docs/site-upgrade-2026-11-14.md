# JupyterMou site upgrade — 2026-11-14

## Sources and preserved features

- Personal baseline: `9ae7493549d2f2e42b5fdcb89ac408d1729b800f`.
- Official baseline: NotionNext `v4.11.1`, commit `60c640eb8b0a5496398a81c6f86488a2be62c0b9`.
- Incorporated the shared RSS builder and discovery changes from upstream `901178b4`.
- Preserved this repository's existing GitHub workflows; the official project's documentation deployment and maintainer automation are not needed to publish this blog.
- Site version: `4.11.1-jupytermou.1`; Node.js 22; Next.js 15.5.27.
- Kept the Hexo layout, homepage image, profile, contact QR codes, favicon, registration details, GA4 summary/dashboard/globe, custom error pages, and isolated HTML replay viewer.
- Kept the local image retry behavior while integrating official Notion image mapping and zoom lifecycle fixes.

## Site fixes

- RSS uses all published, unprotected posts, ordered by publication date, independently of the six-entry recent-updates sidebar.
- On server deployments, `/rss/feed.xml`, `/rss/atom.xml`, and `/rss/feed.json` route to the live feed API before build-time files. Feed generation caches for ten minutes and preserves full-content support. Static exports still generate files.
- Article rendering uses up to three concurrent reads; an unavailable article falls back to its summary without hiding the rest of the feed.
- RSS discovery metadata points to the canonical production domain.
- Database row metadata is excluded from article and announcement bodies during rendering; embedded tables and galleries remain supported.
- The Notion configuration row `FONT_URL` now loads only `https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css`, preserving the site's WenKai typeface. Removed duplicate Bitter/Noto font downloads.
- Vercel uploads exclude the upstream documentation site, Cloudflare-only functions, tests, and development artifacts.

## Deployment and rollback

Project: `jupiterinjulys-projects-56c0e6e6/notion-next-qsuf`.

Create a production-environment deployment with `vercel deploy --prod --skip-domain`, verify its deployment URL, then use `vercel promote` to assign the existing production domains.

Previous production deployment, retained as the rollback target:

`https://notion-next-qsuf-fdt6otkcy-jupiterinjulys-projects-56c0e6e6.vercel.app`

The GA4 credentials and other deployment secrets remain in Vercel. Local environment files are ignored by Git; no credentials are recorded here.
