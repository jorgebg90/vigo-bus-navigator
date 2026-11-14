# Data Model: Holistic Menu Experience

This feature changes presentation and transient navigation state. It introduces no persistent domain entity, external data model, local-storage schema, or user account.

## Existing Entities Reused

### Primary destination

The existing shell destination is one of `map`, `search`, `journeys`, `lines`, or `saved`. It identifies the current primary section and drives its heading, selected navigation state, and rendered view.

### Stop and line

Search results reuse existing `NetworkStop` and `NetworkLineSummary` catalog records. A stop may be handed into journey planning only when it has valid coordinates. A line remains a line result; the rider selects one of its route stops before using that stop as a trip endpoint.

### Address suggestion and journey endpoint

Address results reuse the existing `AddressSuggestion` and `JourneyPoint` models. A selected address is copied into the existing in-memory origin or destination state and does not create a new persisted record.

### Favorite and recent view

Favorites and recent views reuse existing `Favorite` and `RecentView` values and storage behavior. This feature adds no history category or retention behavior.

## Transient UI Concepts

### Search session

| Field | Meaning | Validation / lifecycle |
|---|---|---|
| `query` | Current rider-entered search text | Blank input issues no address request; never stored in localStorage, URL, logs, or a new cache. |
| `category` | `all`, `stops`, `lines`, or `addresses` | Optional view filter; changing it does not change underlying catalog entities. |
| `status` | `idle`, `loading`, `results`, `empty`, `error`, or `offline` | Stale asynchronous suggestions are cancelled or discarded. |
| `results` | Matching existing stops, lines, or approved address suggestions | Keep source identity, provenance, and only supported actions; never fabricate results or geometry. |

### Navigation handoff

| Field | Meaning | Validation / lifecycle |
|---|---|---|
| `returnDestination` | Section the rider came from | In-memory only; return is available while the handoff is active. |
| `targetKind` | `stop`, `line`, or `address` | Must reference an existing result from its approved source. |
| `targetId` / `targetPoint` | Selected source identifier or validated point | Stop endpoints require valid coordinates; address points pass existing Vigo-coverage validation. |
| `journeyEndpoint` | `origin` or `destination` when handed into planning | Required for stop/address-to-planner actions; line details hand off through an explicitly selected stop. |

The handoff ends when the rider dismisses it, clears the selected context, or begins a different task. It is not serialized to browser history except for existing non-sensitive primary-destination behavior.

### Content presentation state

Sections and panels present one of `loading`, `ready`, `empty`, `error`, or `offline`. Error states retain their existing source reason where available and expose a retry or alternative action only when supported by the underlying operation.

## Relationships and State Flow

```text
SearchSession -> Stop | Line | AddressSuggestion
Stop -> Map details | Favorite | Journey origin/destination (with coordinates)
Line -> Line details/map | Favorite | Route Stop -> Journey origin/destination
AddressSuggestion -> Journey origin/destination
ContentPresentationState -> SearchSession or section/panel content
```

No persisted migration or external schema change is required.
