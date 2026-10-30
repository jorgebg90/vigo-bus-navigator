# Research: Improve Mobile Map Usability

**Date**: 2026-10-29
**Feature**: [spec.md](./spec.md)

## Existing Frontend Boundaries

**Decision**: Keep responsive UI state and rendering in the existing frontend
modules; do not add a new application service, map adapter, state store, or
domain entity.

**Rationale**: The app already keeps its persistent map in the shell, renders
location messages through `ui/map/location-status.ts`, renders line details
through `ui/line/frequency-view.ts`, and coordinates requests in `main.ts`.
The map engine is already behind the `StopMapPort`; the requested changes do
not require altering that port or transit data.

**Alternatives considered**:

- Add a new view-state store: rejected because the pending/detail states are
  local to the existing line-selection flow.
- Rebuild or remount the map when line details close: rejected because the map
  remains mounted and the existing destination navigation can restore its full
  viewport.
- Change map or municipal adapters: rejected because the requested behavior is
  presentation-only.

## Location Message Policy

**Decision**: On mobile, do not render notices that report unavailable or
out-of-coverage location. Preserve the existing no-nearby-stops notice when a
valid location has been applied. Preserve current location messaging on
non-mobile viewports.

**Rationale**: The current location state distinguishes `unavailable`,
`outside-coverage`, and `no-nearby-stops`. The first two mean the map cannot use
the position and correspond to the user's request; the third means location
worked but no stops are visible near it, so it remains useful information.
Suppressing only the failure states avoids hiding that distinction or
introducing a location retry.

**Alternatives considered**:

- Suppress every location-related message on mobile: rejected because
  no-nearby-stops is a successful location outcome and may help explain the map.
- Hide notices with CSS while leaving them in the accessibility tree: rejected
  because a screen reader could still announce a failure message that the
  mobile UI intentionally omits.
- Remove location feedback on all screen sizes: rejected because desktop
  behavior is outside the requested scope.

## Line Selection and Loading Transition

**Decision**: Immediately replace the line-list content with a compact,
localized, accessible pending state when a line is selected. Transition to
details as soon as the existing initial line-view load resolves, and expose
route-pending/unavailable outcomes when route acquisition completes. Retain the
existing request-version guard so stale responses cannot replace a newer
selection.

**Rationale**: `showLine` currently changes destination and awaits
`loadLineView` before rendering the selected line, leaving the previous content
on screen during that wait. It then renders an initial line view and may wait
again for online route data. Immediate feedback makes both asynchronous phases
perceivable without changing data ownership or claiming that route data is
already available. Existing localization and reduced-motion behavior can be
extended without a new dependency.

**Alternatives considered**:

- Leave the line list in place until the request resolves: rejected because it
  does not explain the pause.
- Show an indefinite spinner with no outcome: rejected because failures must
  have a terminal, understandable state.
- Animate map geometry or the entire shell as the primary feedback: rejected
  because it risks obscuring the map and cannot be relied on by users who
  request reduced motion.

## Closing Line Details and Restoring the Map

**Decision**: Give the selected-line detail view an explicit, localized close
control on mobile. Closing returns the shell to the map destination, clears
selected-line map presentation through the existing destination-change
lifecycle, and invalidates pending line results.

**Rationale**: The shell keeps the map mounted while line browsing occupies a
lower mobile region. Returning to the map destination naturally gives the map
its full viewport and reuses the established navigation lifecycle. Existing
line requests already use `RequestVersion`, so leaving line browsing prevents
late results from restoring a closed detail view.

**Alternatives considered**:

- Only collapse the line detail while remaining in line browsing: rejected
  because the user's requested outcome is the complete map.
- Reload or reconstruct the map to restore its viewport: rejected because it
  is unnecessary and could discard map state.
- Rely solely on the primary navigation control: rejected because the selected
  detail needs a direct, discoverable close action.

## Accessibility, Localization, and Motion

**Decision**: Localize all new labels and pending/outcome text in English,
Spanish, and Galician; expose pending work as a semantic status; ensure close
is keyboard-operable with a visible focus indicator; and use the existing
reduced-motion policy so state changes do not depend on animation.

**Rationale**: The project already tests translation key parity, accessible
status roles, touch target size, keyboard use, and reduced motion. Reusing these
conventions keeps the behavior understandable across supported languages and
input methods.

**Alternatives considered**:

- Add a new animation or icon dependency: rejected because existing icons,
  focus styling, and reduced-motion CSS are sufficient.
- Use only a visual loading indicator: rejected because it would not reliably
  announce the state to assistive technology.

## External Contracts and Dependencies

**Decision**: Do not add a public endpoint, municipal action, OpenAPI version,
runtime dependency, storage, or backend. Document the mobile UI behavior in an
internal interface contract.

**Rationale**: The feature changes only what the user sees and how the
existing browser UI transitions between states. The current transit source
and normalized contracts remain authoritative.

**Alternatives considered**:

- Add an API or persist view state: rejected because neither is needed for the
  transient UI behavior.
