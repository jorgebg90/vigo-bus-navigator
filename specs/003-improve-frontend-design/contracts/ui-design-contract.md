# UI Design Baseline

**Date**: 2026-10-26
**Feature**: [spec.md](../spec.md)
**Status**: G3 design baseline for UX Designer approval and Frontend Developer agreement (FR-001, SC-008).

This is the single source for layout, light-theme tokens, components, navigation, panels, states, motion, and rider-facing copy boundaries. Research D8 points here instead of repeating tokens.

## 1. Navigation Model

- Four destinations: **Map** (initial), **Search**, **Lines**, **Saved** (tabs: Favorites, Recent). A globe button opens the language selector.
- Landmarks: one `header` (app name, utility menu), one `nav` labelled "Main" with links/buttons using `aria-current="page"` on the active destination, one `main` holding the active destination, and a `complementary` region for the contextual panel (stop or line details). One `h1` per destination.
- Destination change moves focus to that destination's `h1` (tabindex -1) and updates `document.title`. Browser Back returns to the previous destination and closes an open panel first; opening a panel creates one history entry.
- Language control: one globe icon button labelled "Language" (44 x 44 CSS px), opening Castellano (`es`), Galego (`gl`), and English (`en`). It is the only utility control in the header. There is no theme selector; the UI always uses the light appearance.
- Do not display a privacy page, privacy link, or copy describing internal request routing. Keep the required linked OpenStreetMap and CARTO attribution.

## 2. Layouts (CSS px)

```text
PHONE 320-599                TABLET PORTRAIT 768x1024        TABLET LANDSCAPE 1024x768     DESKTOP >=1280
+------------------+         +----------------------+        +--+------+-------------+     +----+--------+---------+
| Header   [Menu]  |         | Header         [Menu]|        |Nv| Panel|             |     |Nav | Panel  |  Map    |
+------------------+         +----------------------+        |  | 360  |    MAP      |     |rail| 340-400|         |
|       MAP        |         |         MAP          |        |  |scroll|             |     |    | scroll |         |
|  [sheet handle]  |         +----------------------+        +--+------+-------------+     +----+--------+---------+
| Stop sheet       |         | Sheet (max 50% h)    |
+------------------+         +----------------------+
| Map Srch Line Sav|         | Nav (bottom, 4 items)|
+------------------+         +----------------------+
```

- Phone: map fills the space between header and bottom navigation. Search, Lines, and Saved are full-screen views replacing the map region (map stays mounted and `inert`). Stop/line details open as a bottom sheet.
- Tablet portrait: bottom navigation; sheet limited to 50% of viewport height so navigation and map controls stay uncovered.
- Tablet landscape: navigation rail (icon + label), 360 px scrollable panel, map fills the rest.
- Desktop: rail with labels, 340-400 px panel, map fills the rest.
- Breakpoints: `<600` phone; `600-1023` tablet (bottom nav when height > width); `>=1024` rail layouts. All primary flows work at 320 x 700, 768 x 1024, 1024 x 768, 1280 x 900, and at 200% text without horizontal scroll.
- Bottom navigation labels wrap to two lines (`min-width: 0`, `overflow-wrap: anywhere`); items stay >= 44 x 44; labels are never truncated.
- The layout and token set are light-only.

## 3. Tokens

### 3.1 Colors (measured WCAG ratios)

| Token | Light | Notes |
| --- | --- | --- |
| `--canvas` | `#FFFFFF` | page background |
| `--surface-soft` | `#F8E6E3` | panels, selected rows |
| `--text` | `#332321` | 14.97 on canvas |
| `--text-secondary` | `#5A4947` | 7.03 on soft surface |
| `--accent` | `#9B2F3B` | 6.08 on soft surface |
| `--on-accent` | `#FFFFFF` | 7.33 on accent |
| `--border` | `#8A6F6B` | 4.60 on canvas, 3.81 on soft (non-text >= 3) |
| `--focus` | `#7D2230` | 9.80 on canvas |
| `--status-current` fg/bg | `#14532D` / `#E3F4E8` | 7.97 |
| `--status-stale` fg/bg | `#6B4300` / `#FFF0D2` | 7.68 |
| `--status-error` fg/bg | `#8A1B2B` / `#FDE6E9` | 7.78 |
| `--status-offline` fg/bg | `#3B4658` / `#E7ECF3` | 8.03 |
| `--disabled` fg/bg | `#6E5F5C` / `#F2ECEB` | 5.20 |
| Map stop / cluster fill | `#9B2F3B` | 7.33 against white halo |
| Map halo (outline) | `#FFFFFF` | stop outline |
| Map selection ring | `#7D2230` | 9.80 against white halo |

Hover adds a 2 px `--accent` border/underline (never color alone). Pressed shifts the fill by 8% and keeps text pairs >= 4.5:1 (re-measured at G5). Status is always icon + text, never color alone. Ratios were computed with the WCAG relative-luminance formula.

**Contrast over map tiles**: a marker is fill + halo + ring so it keeps >= 3:1 against its own halo on any tile. G5 samples marker, cluster-count, and attribution contrast on Positron and Dark Matter at city, district, and street zoom and records results.

### 3.2 Other tokens

- Font: system UI stack. Base 16/24; small 14/20; h1 24/32; h2 20/28; minutes numerals 28/32 bold. Sizes in `rem`; layout survives 200% text.
- Spacing: 4, 8, 12, 16, 24, 32. Minimum gap between adjacent targets: 8.
- Radius: 8 (controls), 16 (sheet top), 999 (chips).
- Elevation: one level for sheet and menu (`0 2px 12px rgba(0,0,0,.18)`); no shadow-only affordances.
- Motion: 200 ms standard ease-out; replacements in section 8.

## 4. Components

Every interactive component has a >= 44 x 44 CSS px hit area, a visible `--focus` 3 px outline with 2 px offset, and an accessible name.

| Component | Role / semantics | States | Notes |
| --- | --- | --- | --- |
| Header + Language | `header`; globe button `aria-haspopup="menu"` "Language" | default, focus, expanded | `menuitemradio` for Castellano/Galego/English |
| Bottom nav / rail | `nav` "Main"; `aria-current="page"` | default, current (filled + bold + underline), focus | icon + text always visible |
| Search field | centered `search` landmark; `type="search"` "Search stops" | empty, typing, results, no-results, error | no result-count message |
| Stop result row | `li` with open button (name) and separate favorite toggle | default, favorite, no-map-position | no line badges in search; shows "No map position" when coordinates are null |
| Line card | button with badge and name | default, current, focus | badge text pair >= 4.5:1, fallback `--accent`/`--on-accent` |
| Frequency table | `table` with caption; day-type `tablist` (weekday, Saturday, Sunday/holiday) | published, unavailable | unavailable text "No published service for this day type" |
| Stop details panel | `aside` labelled by `h2` | loading, current, stale, empty, unavailable, offline | section 7 |
| Arrivals list | `ol`; line badge, destination, "N min" | per item | text unit, not color |
| Freshness indicator | `p` icon + text | current, stale, unavailable, offline | not a live region |
| Favorite toggle | stop-only button `aria-pressed`, name "Save <stop>" / "Remove <stop> from favorites" | off, on (filled star) | same control in details, route stops, search, Saved |
| Saved tabs | `tablist` Favorites / Recent; favorites are stops; Recent may include lines | empty, populated, unavailable target | unavailable stop stays removable |
| Map stop / cluster | not DOM-focusable; section 6 | stop, selected, cluster (count) | selected = ring + larger shape |
| Chooser | modal `dialog` | list, empty | section 6 |

## 5. Panel Behavior and Focus

- Stop and line panels: phone/tablet portrait = bottom sheet implemented as a non-modal `aside` (not `role="dialog"`); landscape/desktop = side `aside`.
- Sheet: two snap points (peek 96 px showing name, freshness, favorite; expanded 85% on phone, 50% on tablet portrait). A visible Expand/Collapse button toggles; dragging the handle is optional, never the only way. A visible 44 x 44 Close button is always present; Escape also closes.
- Opening (pointer or keyboard) moves focus to the panel `h2` (tabindex -1). Closing returns focus to the opener. If the opener is gone (cluster expanded, results re-rendered, favorite removed), focus goes to the destination `h1`, or on Map to the "Stops in view" button.
- Selecting another stop while open replaces content, moves focus to the new `h2`, and drops in-flight results of the previous stop.
- Side panels and sheets never trap focus. The chooser and settings menu trap focus until closed. Tab order: header, panel, main content, navigation.
- Map gestures and clicking empty map never close a panel; only Close, Escape, or another destination does.

## 6. Map and Dense Stops

- Only stops with a finite in-bounds coordinate pair reach the map. One domain mapper (`toMapStops`) drops stops with a null pair and converts to `[lon, lat]` once; map code never sees null.
- Rendering: MapLibre GeoJSON source with `cluster: true`, `clusterRadius: 50`, `clusterMaxZoom: 16`; circle and symbol layers for clusters (with count) and stops; a selection ring layer. No deck.gl and no synthetic route line.
- **44 x 44 hit target**: pointer events are resolved with `queryRenderedFeatures` over a 44 x 44 px box around the pointer, plus an invisible hit circle layer with `circle-radius: 22`. Visual markers may be smaller. No per-stop DOM marker buttons.
- **Cluster activation**: use `getClusterExpansionZoom`; if the result exceeds `clusterMaxZoom` or `getClusterLeaves` returns coincident coordinates, open the chooser instead of zooming.
- **Chooser**: modal `dialog` "Stops here (N)" listing leaves as buttons sorted by distance to the click (ties by name), each showing name, stop code, and serving lines. Max height 60% of viewport, scrolls inside, rows >= 44 high. Escape/Close returns focus to the map region's "Stops in view" button. Choosing a row closes it and calls `selectStop`.
- **Keyboard and assistive access**: the map canvas is `aria-hidden`; the equivalent is the **Stops in view** toolbar button opening the same chooser component with up to 50 visible stops nearest the map center, plus the Search and Lines destinations. The old per-stop button strip is removed.
- Toolbar (zoom in, zoom out, Stops in view, Recenter): 44 x 44 buttons with text names. Recenter fits the stops' bounds; geolocation is never requested.
- Attribution strip always visible and links only to CARTO and OpenStreetMap credits.

## 7. States, Copy Intent, Next Actions, Announcements

Copy is localized (es/gl/en); wording states intent and is finalized in i18n.

| State | Where | Display | Next action | Announcement |
| --- | --- | --- | --- | --- |
| Loading arrivals | stop panel | skeleton rows + "Loading arrivals" | none | none; polite "Still loading" once after 3 s |
| Current | stop panel | arrivals + "Updated N s ago" | none | none on unchanged refresh; polite only when the first arrival changes |
| Stale (30-299 s after upstream failure) | stop panel | arrivals + icon + "Last known N s ago; could not refresh" | "Try again" | polite once on entering stale |
| Empty | stop panel | "No upcoming buses at this stop" | link to lines serving the stop | polite once |
| Unavailable (>= 300 s or none) | stop panel | "Arrivals unavailable right now" | "Try again" | polite once |
| Stop without live id | stop panel | "Live arrivals are not available for this stop" (no request made) | link to line frequencies | polite once |
| Offline | panel, header strip | "You are offline" | "Try again" when online | polite once; clears when online |
| No results | search | "No stops match '<query>'" | clear field | polite count |
| Tile error | map | banner "The map could not load" | "Retry", "Use search" | polite once |
| Missing coordinates | search rows, stop panel | "No map position" (coordinates never printed) | none | none |
| Storage unavailable | on first save | banner "Favorites cannot be saved on this device" | Dismiss | polite once |
| Catalog error | any list | "Could not load stops" | "Try again" | polite once |

Focus never moves because of a refresh or status change. Two live regions: polite `role="status"` for panel status, and one for search counts.

## 8. Reduced Motion

Honor `prefers-reduced-motion: reduce` in CSS and MapLibre.

| Animation | Default | Reduced motion |
| --- | --- | --- |
| Sheet open/close/snap | 200 ms translate | instant |
| Cluster expand, recenter | `easeTo` 300 ms | `jumpTo` |
| Selection ring | one 200 ms scale | appears instantly |
| Skeleton shimmer | animated gradient | static placeholder |
| Panel content fade | 150 ms opacity | none |

Information and functionality are identical in both modes.

## 9. Rider-Facing Copy Boundary

- Do not render a privacy page, privacy link, About view, or text explaining internal request routing.
- The map attribution strip retains linked `© OpenStreetMap contributors` and `© CARTO` credits as required by the providers. These credits are not links to a privacy destination.
- Network data-minimization requirements are defined by FR-021 and verified through tests, not explained in rider-facing copy.

## 10. Coordinates Rule

Mapper and map accept only a finite pair inside the API bounds (latitude 42.10-42.32, longitude -8.85 to -8.60). The v4 contract makes the pair nullable without widening bounds. The narrower hard-coded frontend filter is removed; the Worker is the single validator.

## 11. Sign-Offs

- UX Designer approves this baseline; WCAG 2.2 AA evidence at G5.
- Frontend Developer records agreement before implementation.
- Architect and Backend review the v4 contract before frontend nullable-coordinate work starts (both APPROVED at G3).
