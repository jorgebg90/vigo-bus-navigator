# Vigo Bus Navigator

> Check bus frequencies in Vigo, Spain — fast, private, and offline-friendly.
> A pure frontend web app, hosted on GitHub Pages, where your data never
> leaves your browser.

## What is this?

**Vigo Bus Navigator** is a static web application to consult urban bus
frequencies in Vigo. Find your line, see frequencies by day type
(weekday / Saturday / Sunday & holidays), save your favorite lines and
stops, and pick up where you left off — all persisted in your browser's
`localStorage`. No accounts, no tracking, no backend.

- 🚌 **Bus frequencies** by line, stop, and day type.
- 📱 **Mobile-first**, accessible UI for people on the move.
- 🔒 **Private by design**: user state lives only in `localStorage`.
- ⚡ **Pure frontend**: plain static hosting on GitHub Pages.

## How it is built: Spec-Driven Development + Harness Paradigm

This repository is an experiment in **Spec-Driven Development (SDD)** with
[GitHub Spec Kit](https://github.com/github/spec-kit): specifications come
first, and code is generated from reviewed, versioned specs.

On top of SDD, the project applies the **harness paradigm**: a fixed cast of
AI actors validates every phase through explicit quality gates.

| Actor | Validates |
| --- | --- |
| 🧭 Project Lead | Orchestration and gate discipline |
| 🏛️ Software Architect | Design, boundaries, pure-frontend architecture |
| 🔌 Backend Developer | Data contracts and `localStorage` persistence |
| 🧪 QA Tester | Testability, coverage, quality gates |
| 🧑‍🤝‍🧑 Stakeholder | User value, scope, acceptance sign-off |
| ✍️ Communicator | Blog-ready documentation of the whole journey |

Read the full setup in the [Harness Charter](docs/harness-charter.md).

## SDD workflow

The project follows the Spec Kit cycle, each step guarded by a harness gate:

```text
/speckit-constitution   → G1: all actors ratify
/speckit-specify        → G2: Stakeholder + QA
/speckit-clarify        → (optional) de-risk ambiguities
/speckit-plan           → G3: Architect + Backend Developer
/speckit-tasks          → G4: QA testability review
/speckit-analyze        → (optional) cross-artifact consistency
/speckit-implement      → G5: QA quality + Stakeholder acceptance
/speckit-converge       → G6: Communicator story gate
```

## Repository layout

```text
.specify/           Spec Kit engine: templates, scripts, memory (constitution)
.github/agents/     Harness actors as VS Code custom agents
.github/skills/     Spec Kit skills (/speckit-* commands)
docs/               Harness charter and the blog series (docs/blog/)
specs/              Feature specifications, plans, tasks, and actor verdicts
```

## Status

🚧 **Phase 0 — Repository initialized.** Next step: define the project
constitution (`/speckit-constitution`).

## License

MIT — see [LICENSE](LICENSE) (to be added).
