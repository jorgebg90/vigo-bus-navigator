# Data Model: Repository Cleanup and Normalization

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

This feature does not change application data. The following conceptual model
governs the one-time repository inventory and cleanup decisions.

## Entities

### Repository Artifact

A tracked or intentionally maintained file, directory, dependency, generated
input, workflow, contract, or documentation item.

| Attribute | Meaning | Validation |
| --- | --- | --- |
| `path` | Repository-relative artifact location or stable artifact identifier | Unique within the inventory |
| `kind` | Source, test, config, workflow, dependency, contract, documentation, generated input, or historical record | Must use a consistent category |
| `purpose` | What supported project capability or record it serves | Must be stated before removal |
| `lifecycle` | Active, generated, historical, duplicate, obsolete, or unresolved | Exactly one current classification |
| `evidence` | Imports, scripts, CI, deployment, docs, generation, governance, or history references checked | Must be recorded for removal/consolidation candidates |
| `decision` | Retain, remove, consolidate, relocate, ignore, or unresolved | Must follow evidence and preservation rules |
| `replacement` | Canonical destination or equivalent capability, when applicable | Required for relocation/consolidation and migrated checks |

### Supported Workflow

A documented or automated contributor activity that must remain reproducible.

| Attribute | Meaning | Validation |
| --- | --- | --- |
| `name` | Setup, development, test, accessibility, contract, build, deploy, or data-generation activity | Must correspond to documented or automated project use |
| `entrypoint` | Command or workflow trigger | Must resolve to a maintained resource |
| `inputs` | Required files, environment, or fixtures | Must be available in a clean checkout or clearly documented |
| `outputs` | Generated artifact or externally visible result | Must be unchanged unless explicitly authorized |
| `verification` | Existing checks proving expected behavior | Must pass after cleanup |

### Historical Evidence

A completed specification, accepted decision, contract, review, or gate record
kept for traceability.

| Attribute | Meaning | Validation |
| --- | --- | --- |
| `path` | Stable location of the record | Must remain resolvable if referenced |
| `decision_date` | Date or session when decision was accepted, if known | Preserve source metadata |
| `status` | Historical, superseded, or current | Historical content must not be presented as current guidance |
| `superseded_by` | Current authoritative record, when applicable | Link must resolve |
| `unique_evidence` | Decisions or rationale not repeated elsewhere | Must be retained during consolidation |

### Cleanup Decision

A proposed action applied to a repository artifact.

| Attribute | Meaning | Validation |
| --- | --- | --- |
| `artifact` | Candidate artifact | Must exist in the baseline inventory |
| `action` | Retain, remove, consolidate, relocate, ignore, or defer | Must be explicit |
| `rationale` | Why the action meets the feature requirements | Required for all non-retain actions |
| `checked_references` | Supported workflows and consumers examined | Required before remove/consolidate |
| `approval_needed` | Whether the action changes architecture, behavior, licensing, or protected history | If true, stop for explicit review |
| `validation_result` | Checks run after the action | Required before completion |

## Relationships

- A repository artifact may support zero or more supported workflows.
- A supported workflow consumes zero or more artifacts and may produce generated
  artifacts.
- A historical evidence item may be superseded by one current canonical source
  but remains independently traceable.
- A cleanup decision applies to exactly one candidate artifact; a grouped
  change may record multiple decisions only if each candidate retains its own
  evidence and validation.

## Lifecycle and Decision Rules

1. Inventory the baseline and identify the artifact's purpose.
2. Trace imports, dynamic references, package/workspace configuration, scripts,
   tests, CI/deployment, generation, documentation, governance, and historical
   links.
3. If any supported use or unique historical value remains, retain or migrate
   the use before considering removal.
4. If ownership, usage, or value is uncertain, classify as unresolved and
   retain pending maintainer review.
5. Apply an action only after the replacement path (if any) is ready.
6. Run affected checks and then the full required verification gate.
7. Record the resulting current canonical source and preserve historical
   provenance.

## Data Integrity Constraints

- No application persistence, API schema, or public data changes are in scope.
- No unique accepted decision or material gate evidence may be lost.
- Generated local output is not treated as maintained source unless a supported
  workflow intentionally checks it in or consumes it as a reproducibility input.
- At baseline, the migration-era `worker/` directory was classified by
  individual responsibilities; it was not removed until active CI, typecheck,
  catalog, and snapshot-generation dependencies were migrated or retired.
