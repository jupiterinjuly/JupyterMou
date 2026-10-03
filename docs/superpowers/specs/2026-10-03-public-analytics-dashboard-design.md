# Public Analytics Dashboard Design

## Summary

Replace the unused demo dashboard with a public, read-only website analytics experience backed by the existing Google Analytics 4 property. Add a compact analytics card to the Hexo homepage sidebar and a full-width `/dashboard` page. Both surfaces use the same cached server endpoint and expose only aggregated statistics.

The feature must run within the free tiers already suitable for this personal blog. It must not collect, persist, or expose raw visitor IP addresses.

## Goals

- Show total page views, users in the last seven days, and page views in the last seven days on the homepage.
- Show a small animated visitor globe in the homepage sidebar.
- Link the homepage card to a full public analytics page at `/dashboard`.
- Show seven-day users, seven-day page views, all-time users, all-time page views, a seven-day trend, the top five pages in the last seven days, an all-time visitor globe, and the top visitor countries on `/dashboard`.
- Refresh the shared dataset at most once every 30 minutes.
- Keep Google credentials server-side and return only aggregated results to browsers.
- Match the existing Hexo theme, dark mode, responsive layout, and accessibility behavior.

## Non-goals

- Do not expose or store raw IP addresses.
- Do not attempt to identify individual visitors.
- Do not provide a private administrative analytics interface.
- Do not reproduce the complete Google Analytics interface.
- Do not add a second analytics tracker such as Umami.
- Do not preserve the demo balance, membership, order, affiliate, or user-profile dashboard modules.

## Existing State

- The production site already sends page views to Google Analytics using measurement ID `G-5ML6JEKVMJ`.
- The GA4 property ID is `514187741`.
- `/dashboard` resolves through `pages/dashboard/[[...index]].js` and asks the active theme for `LayoutDashboard`.
- The current Hexo theme does not export `LayoutDashboard`, which is why the production route renders without useful dashboard content.
- `DashboardItemHome` contains hard-coded demo statistics, and the dashboard menu contains unrelated demo account modules.
- The Hexo sidebar already contains a disabled `AnalyticsCard`, currently designed for article count and Busuanzi values.

## Selected Architecture

### Data source

Use the Google Analytics Data API with a read-only Google service account. The service account will be added as a Viewer on GA4 property `514187741`.

Use the official Node client library rather than implementing service-account JWT signing manually.

Required server-only environment variables:

- `GA_PROPERTY_ID=514187741`
- `GA_CLIENT_EMAIL`
- `GA_PRIVATE_KEY`

None of these variables may use the `NEXT_PUBLIC_` prefix.

### Server endpoint

Add a read-only endpoint at `/api/analytics/summary` that runs the required GA reports, normalizes their results, and returns one stable JSON response used by both UI surfaces.

The endpoint will request:

1. Last seven days summary:
   - Metrics: `activeUsers`, `screenPageViews`
   - Range: `6daysAgo` through `today` (seven calendar days including today)
2. All-time summary:
   - Metrics: `totalUsers`, `screenPageViews`
   - Range: `2020-01-01` through `today`
   - This means all data available since the site first enabled this GA property, not traffic before tracking began.
3. Seven-day daily trend:
   - Dimension: `date`
   - Metrics: `activeUsers`, `screenPageViews`
4. Seven-day popular pages:
   - Dimensions: `pagePath`, `pageTitle`
   - Metric: `screenPageViews`
   - Ordered descending and limited to five rows
5. All-time geography:
   - Dimensions: `countryId`, `country`
   - Metric: `totalUsers`
   - Exclude empty and `(not set)` rows

Google Analytics does not expose raw visitor IP addresses. Country IDs will be mapped to static country-centroid coordinates for visualization. The globe points therefore represent aggregated visitor countries, not exact visitor locations.

### Cache and refresh policy

Return public CDN cache headers with a 30-minute freshness window and a stale-while-revalidate window. The browser UI fetches on initial load and may refetch after 30 minutes while the page remains open.

The endpoint must not accept arbitrary dimensions, metrics, property IDs, or date ranges from the browser. This keeps the query surface fixed, limits quota use, and prevents the endpoint from becoming a general proxy to the GA property.

### Client data layer

Create a small shared analytics hook or fetch utility that provides:

- loading state
- normalized analytics data
- last-updated timestamp
- recoverable error state
- 30-minute client refetch behavior

The homepage card and full dashboard must use this shared layer rather than issuing different requests.

## API Response Shape

The public response will follow this conceptual shape:

```json
{
  "updatedAt": "2026-10-03T12:00:00.000Z",
  "summary": {
    "sevenDayUsers": 0,
    "sevenDayViews": 0,
    "allTimeUsers": 0,
    "allTimeViews": 0
  },
  "trend": [
    { "date": "2026-09-27", "users": 0, "views": 0 }
  ],
  "topPages": [
    { "path": "/article/example", "title": "Example", "views": 0 }
  ],
  "countries": [
    {
      "code": "CN",
      "name": "China",
      "users": 0,
      "latitude": 35.0,
      "longitude": 103.0
    }
  ]
}
```

Numeric GA values must be parsed to numbers before returning them. Missing report rows must produce empty arrays or zero values rather than malformed output.

## Homepage Experience

### Placement

Show the card only on the homepage in the Hexo right sidebar, in this exact order:

1. Latest posts
2. Site analytics card
3. Announcement

Article pages and other archive/list pages will not show this analytics card.

### Content

The card title is `站点足迹`. It contains:

- `累计访问` using all-time page views
- `近7天用户`
- `近7天浏览`
- A compact rotating globe, approximately 180px in diameter
- A `查看完整数据 →` affordance

The whole card links to `/dashboard`. It should use the existing Hexo `Card` appearance and spacing.

While loading, preserve card dimensions with skeleton placeholders. If the API is not configured or temporarily fails, show a quiet `统计数据暂不可用` state and keep the rest of the homepage functional.

## Dashboard Experience

### Layout integration

Add a Hexo `LayoutDashboard` export so the existing dashboard route is supported by the active theme. The dashboard layout will retain the normal site header, footer, global background, dark mode, and responsive behavior while suppressing the normal blog sidebar.

Replace the demo dashboard body with a full-width analytics page. Remove the demo account-navigation sidebar and do not render the unused balance, membership, order, affiliate, or user-profile content.

### Desktop layout

1. Page heading: `站点数据`
2. Secondary label: last data update time and the 30-minute refresh policy
3. Four KPI cards:
   - Last seven days users
   - Last seven days views
   - All-time users
   - All-time views
4. Main visualization row:
   - Seven-day users/views trend occupying roughly two thirds
   - Animated visitor globe occupying roughly one third
5. Detail row:
   - Top five pages in the last seven days
   - Top visitor countries

### Mobile layout

- Use a single-column layout.
- Render KPI cards in a two-column grid where space permits and one column on narrow screens.
- Place the trend before the globe, followed by the two ranked lists.
- Avoid horizontal scrolling for normal content.

### Visualizations

- Use `cobe` for the animated globe. It is small, open source, and requires no paid map tiles.
- Scale point size by country visitor count using a logarithmic or bounded scale so one dominant country does not hide all other markers.
- Pause globe animation when the user requests reduced motion.
- Implement the seven-day trend as a lightweight accessible SVG chart to avoid adding a large charting dependency for two seven-point series.
- Provide textual values and labels so the charts are not the only way to understand the data.

## Privacy and Security

- The Google service-account private key and email remain server-only.
- The public endpoint returns only aggregate counts, page titles/paths, country names/codes, and fixed country-centroid coordinates.
- Do not return IP addresses, client IDs, user IDs, session identifiers, or city-level coordinates.
- Do not log credentials or full upstream GA responses.
- Use a read-only GA Viewer service account.
- GA privacy thresholding may omit low-volume geographic rows; the UI must treat this as expected rather than as an error.

## Failure Handling

- Missing server credentials: return a controlled configuration error without exposing which credential value is missing.
- GA authorization or upstream failure: return a generic service-unavailable response and log a sanitized server-side error.
- Empty analytics history: return valid zero/empty data and render an empty-state message.
- Client fetch failure: show the compact unavailable state on the homepage and an explanatory retry state on `/dashboard`.
- Globe/WebGL unavailable: show the country ranking and a static fallback message instead of blocking the page.

## Cost Model

- Google Analytics Data API: use the standard property quota with a fixed query set and a 30-minute shared cache.
- Vercel: use the existing deployment and serverless/CDN facilities.
- `cobe`: MIT-licensed and self-rendered in WebGL, with no map API key or tile usage.
- No database, paid analytics service, or paid map provider is required.

## Testing and Validation

### Automated tests

- Unit-test GA response normalization, including missing and malformed rows.
- Unit-test country-code coordinate mapping and marker-size scaling.
- Component-test homepage loading, success, zero-data, and failure states.
- Component-test dashboard KPI and ranking rendering.
- Verify the analytics endpoint never returns credential fields.

### Build and static checks

- Run lint/type checks applicable to touched files.
- Run the production build.
- Confirm existing article pages and the Giscus comment area remain unaffected.

### Production validation

- Confirm the homepage card appears between latest posts and announcement.
- Confirm the card links to `/dashboard`.
- Confirm `/dashboard` renders the full-width Hexo layout without the blog sidebar.
- Compare headline metrics and popular-page ordering with the GA interface for the same date range.
- Confirm cache headers are present and repeated requests do not continuously call GA.
- Confirm dark mode, mobile layout, reduced-motion behavior, and the no-WebGL fallback.

## Rollout

1. Implement the endpoint, normalization, shared client data layer, homepage card, and dashboard layout behind configuration-aware error states.
2. Create a Google Cloud service account, enable Google Analytics Data API, and grant the service account Viewer access to GA property `514187741`.
3. Add server-only GA environment variables in Vercel for Production and Preview.
4. Deploy and validate against the live GA property.
5. Keep the feature visible only when the endpoint is configured successfully; otherwise render the quiet unavailable state without disrupting the site.
