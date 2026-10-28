# From Stop Page to Stable Arrivals

**Feature**: 002-realtime-bus-api  
**Date**: 2026-10-26  
**Status**: Implementation draft; G5 review is pending

The owner selected the Vitrasa InfoBus stop page because it visibly provides line, destination, and wait-minute estimates. This changes the source adapter, not the public API, and does not imply that the earlier JSON source is broken. The browser-facing contract remains API v3.0.0.

The Worker now treats the page as a bounded WebForms exchange rather than a general HTML scrape: it constructs one fixed HTTPS URL from a validated numeric stop ID, checks stop identity and table structure, follows sequential pager state, updates lookup-scoped cookies, and rejects redirects or partial results. Response sizes, page count, row count, field lengths, and the aggregate eight-second deadline are enforced before cache writes. Source state is not returned, logged, or stored.

The frontend carries `vitrasaId` separately from its internal and municipal stop identifiers. A missing Vitrasa ID short-circuits the lookup. When a lookup is available, the localized notice names Cloudflare and Vitrasa, explains that connection metadata may be processed, and makes no anonymity claim. Polling pauses while the page is hidden; the arrivals view retains distinct loading, current, stale, empty, and unavailable announcements.

Local validation stays offline through sanitized HTML fixtures, including the three-page 5/5/2 sample. The Node/DOM suite passed 75 tests, the Worker contract suite passed 53, the fixture-only 600-request load target completed at 10 requests per second with zero source calls, and the Playwright matrix passed 27 scenarios. OpenAPI regression checks preserve the API version and schema; aggregate gzip usage measured 562.2 KiB JavaScript and 10.8 KiB CSS.

Two operational claims remain deliberately open. Preview and production Wrangler configurations pass dry runs, but no remote deployment or preview smoke was attempted. The actual Cloudflare EdgeCache TTL and retention behavior also remains unverified; its credentialed smoke task is not implemented. G5 therefore remains pending QA Tester re-review and Stakeholder acceptance, plus the required remote evidence. No Vitrasa request was made during this implementation validation.
