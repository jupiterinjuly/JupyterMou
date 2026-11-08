# Notion HTML attachment embeds

Native HTML attachments use `attachment:<file-id>:<filename>` in Notion embed
blocks. Browsers cannot load that scheme. Notion's signed download endpoint also
serves HTML as an attachment with a script-blocking response policy, so replacing
the iframe URL with a signed URL alone is insufficient for interactive content.

`NotionPage` overrides only native `.html` / `.htm` attachment embeds. Other
website embeds keep react-notion-x's original renderer. The client retrieves HTML
from `/api/notion-html?blockId=<uuid>` and renders it with `srcDoc` in an iframe
using `sandbox="allow-scripts"` without `allow-same-origin`. Content cannot access
the blog's DOM, cookies, or local storage. An additional policy blocks network
requests and forms; this supports self-contained offline interactive documents.

The API resolves the source from the Notion block, not a caller-supplied URL.
Only native HTML attachment embed blocks are accepted. Downloads use Notion's
public signed endpoint without forwarding Notion auth cookies. HTML responses
are limited to 2 MiB, checked against both the header and streamed bytes, and
returned as private/no-store JSON rather than executable HTML on the blog origin.

The embed shows loading/error/retry states and retains its caption. Readers can
expand the frame, enter full screen, or download the original HTML. Attachments
using external JavaScript, external data requests or forms should instead use
an appropriate hosted app embed; the offline attachment policy is intentional.
