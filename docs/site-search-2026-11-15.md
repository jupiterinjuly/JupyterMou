# JupyterMou Algolia search

The site indexes published, unprotected posts as small UTF-8 records. It walks only the article's rendered content tree, respects section boundaries, and does not traverse linked pages, database rows or executable HTML artifacts. Long paragraphs split near punctuation/whitespace where possible. Each record retains its article ID, heading title and original heading anchor; JSON records stay below the free plan's per-record limit.

The search popup displays the article title, section and matching snippet. Algolia `attributeForDistinct: postId` groups chunks from the same article into one result. The browser uses only the search key; write credentials remain server-side.

## Configuration

Production browser configuration:

- `NEXT_PUBLIC_ALGOLIA_APP_ID`
- `NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_APP_KEY`
- `NEXT_PUBLIC_ALGOLIA_INDEX` (`jupytermou_posts`)

Server configuration:

- `ALGOLIA_ADMIN_APP_KEY`: the Algolia Write API key; never add a `NEXT_PUBLIC_` prefix.
- `CRON_SECRET`: random secret used to authorize scheduled/manual snapshot updates.

The non-public `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_ONLY_APP_KEY`, and `ALGOLIA_INDEX` variables allow building the initial server index before enabling the public popup. They are fallbacks for the browser configuration, not additional write keys.

## Synchronization

- When a public article is processed for rendering, its full-content hash is checked and changed chunks are uploaded; extra chunks from a shortened article are removed. Older cached revisions cannot overwrite newer indexed revisions.
- A complete snapshot runs daily at 20:00 UTC (04:00 Asia/Shanghai). It removes deleted, unpublished and protected posts, including every chunk. This is eventual synchronization, not a Notion webhook.
- `POST /api/search/reindex` can trigger the same snapshot using `Authorization: Bearer <CRON_SECRET>`. Scheduled GET requests also require authorization. Neither endpoint returns credentials or article contents.
- The snapshot fetches all eligible article bodies before calling Algolia's atomic `replaceAllObjects`; source fetch failures do not replace the current index. Failed indexing tasks should be retried and verified.

References: [Algolia long-document indexing](https://www.algolia.com/doc/guides/sending-and-managing-data/prepare-your-data/how-to/indexing-long-documents), [record size limits](https://support.algolia.com/hc/en-us/articles/4406981897617-Is-there-a-size-limit-for-my-index-records).

## Initial verification

The authenticated snapshot completed with 31 public articles and 786 records. Its article URL set exactly matched the live RSS feed, with no missing or extra articles. The largest stored JSON record was 3,279 UTF-8 bytes. Searching `四级合成退化参数` matched chunk 54 of the ICLR 2026 translation and returned its original heading anchor. Searching `不确定性` returned eight distinct articles. Unauthenticated indexing requests returned HTTP 401. Run the production browser smoke test with `PLAYWRIGHT_ALGOLIA_ENABLED=1` and `PLAYWRIGHT_BASE_URL=https://www.jupytermou.cn`.
