# Data Model: Hexagonal Architecture and OpenAPI Documentation

This feature primarily changes architecture documentation and generated
documentation; it introduces no persisted application entities or user data.

## Runtime Module Classification

Represents one maintained executable production module discovered under
`frontend/src`.

| Field | Description | Validation |
|---|---|---|
| `path` | Repository-relative module path | Unique; must identify a discovered production source module |
| `responsibility` | Domain, application use case, application port, inbound adapter, outbound adapter, or composition | Exactly one primary responsibility per module |
| `rationale` | Explanation for cross-cutting or non-obvious assignments | Required for composition and explicitly approved cross-cutting assignments |
| `isolatedTests` | Test scenarios covering a domain rule or application use case | Required for every domain rule and use case; tests run without browser, network, or browser persistence |

The discovered source set and the classification set are equal: missing
classifications and stale entries are validation failures. Tests, fixtures,
build tooling, configuration, generated docs, and non-executable assets are
outside this entity.

## Module Dependency

Represents a source dependency from one runtime module to another module or
explicitly classified external/build input.

| Field | Description | Validation |
|---|---|---|
| `source` | Importing module | Must be in the runtime inventory |
| `target` | Imported module, package, asset, fixture, or virtual module | Must resolve or have an explicit supported classification |
| `kind` | Static import, side-effect import, re-export, type-only edge, import type, or literal dynamic import | Must be found by AST analysis |
| `location` | Source line/column for the dependency | Included in actionable diagnostics |
| `path` | Resolved dependency chain used to explain transitive violations | Each code edge must resolve |

Dependency direction is inward: domain depends only on domain; application
depends on domain and application ports/use cases; adapters depend on inward
contracts and their infrastructure-local helpers; composition wires concrete
adapters to application entry points without becoming a general-purpose
exception. Any violation fails architecture validation.

## OpenAPI Source Contract

Represents the canonical transit contract at
`specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`.

Relevant content includes paths and operations, operation metadata,
parameters, request-body media types and schemas, response codes and schemas,
component schemas, local references, and extension fields. The source contract
remains canonical and its descriptions continue to distinguish the municipal
JSP boundary from a hosted application REST API.

Before validation, generation removes old files from both its public
intermediate and `dist`. Validation rejects missing/unreadable input, invalid
YAML/OpenAPI structure, unresolved local references, or rendering errors. Each
failure exits nonzero and reports the canonical source path, failure category,
and corrective guidance; both stale page files remain absent and deployment is
blocked.

## OpenAPI Documentation Page

Represents the deterministic static HTML rendering at
`dist/docs/openapi/index.html`.

| Field | Description | Validation |
|---|---|---|
| `source` | Canonical OpenAPI source contract | Fixed repository-relative path above |
| `applicationPath` | `/docs/openapi/` | Stable, directly addressable directory-index path |
| `deploymentBase` | Configured application base path | Same build-time base as Vite app assets; `/` by default |
| `renderedElements` | Visible content corresponding to contract fields | Complete, with stable source pointers and no uncontracted operations/schemas |
| `output` | Generated HTML file under `dist` | Written only after successful validation |

The page uses semantic, keyboard-operable HTML; no runtime contract fetch or
remote documentation resource is required.

## README Documentation Surface

Represents the project entry document and its primary information sections:
purpose, architecture and inventory, OpenAPI documentation, local setup and
validation, browser-side data flows, privacy/security boundaries, limitations,
service status, and licensing.

The README must link to the deployed HTML documentation page and preserve
existing operational content. Its findability check requires at least four of
five repository-unfamiliar, feature-uninvolved readers to find all five target
items within 60 seconds using only the README.

## Harness Verdict

Represents one assigned actor's review of one SDD phase.

| Field | Description | Validation |
|---|---|---|
| `actor` | Required project actor | Must match the phase gate's actor list |
| `phase` | G2, G3, G4, G5, or G6 | Must identify the reviewed phase |
| `verdict` | APPROVED or CHANGES REQUESTED | Only APPROVED closes an actor's portion of the gate |
| `findings` | Evidence or issues found | Required when changes are requested |
| `requiredActions` | Actions before approval | Resolved before gate closure |

All G3-required approvals and the Communicator's phase documentation gate are
recorded before this plan phase is reported as closed.
