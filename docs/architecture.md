# Runtime architecture

The application is a browser-first static PWA. Production behavior is divided
into domain rules, application use cases and ports, adapters, and a narrow
composition root. The maintained runtime-module inventory and its isolated
test mappings live in
[`frontend/tests/architecture/modules.json`](../frontend/tests/architecture/modules.json);
[`frontend/tests/unit/architecture.test.ts`](../frontend/tests/unit/architecture.test.ts)
checks that inventory and the dependency graph on every unit-test run.

## Module responsibilities

Every maintained executable module under `frontend/src` appears exactly once
in the inventory with one primary responsibility:

| Responsibility | Meaning |
| --- | --- |
| `domain` | Framework-independent entities, values, and business rules. |
| `application-use-case` | Coordinates domain behavior through application ports. |
| `application-port` | Platform-neutral interfaces owned by the application layer. |
| `inbound-adapter` | UI, browser event, localization-binding, or service-worker entry behavior. |
| `outbound-adapter` | Browser storage, municipal data, mapping, clock, and other platform integrations. |
| `presentation-localization` | User-facing translations and presentation-only localization helpers. |
| `composition` | Application entry-point wiring; not a place for business rules. |
| `service-worker` | PWA lifecycle and offline behavior. |

Modules assigned `composition`, `service-worker`, or
`presentation-localization` include a rationale in the manifest because those
roles are cross-cutting or intentionally isolated from ordinary layer rules.
If source code is added, moved, or removed, update the inventory and ensure
domain rules and application use cases retain isolated Node test mappings.

## Dependency directions

Dependencies point inward. Domain modules may depend only on domain modules.
Application use cases may depend on domain, other application use cases, and
application ports; ports may depend on domain and other ports. Neither core
layer may depend on platform adapters, browser APIs, network APIs, persistence,
or unclassified external packages.

Inbound and outbound adapters may use core modules and adapter-local helpers,
but may not depend on each other. Presentation localization may support
inbound presentation behavior, not domain or application logic. The service
worker may use its own modules and outbound integrations. Composition may
construct adapters and connect ports to use cases, but must delegate schedule
repository operations to application use cases. The AST guard rejects direct
or extracted references to schedule repository methods from the composition
root, including property and literal element access.

The architecture checker discovers executable TypeScript/JavaScript modules
independently of entry-point reachability, compares them with the manifest,
and parses imports, re-exports, type-only dependencies, and literal dynamic
imports using the TypeScript AST. It resolves relative and `@/` source aliases,
and reports unresolved local edges, undeclared external dependencies,
unclassified or stale manifest entries, prohibited layer edges, and forbidden
ambient browser/network/storage globals in domain and application modules.
Known non-code resources and Vite virtual imports are treated separately from
runtime source modules.

## Local validation

From the repository root:

```sh
npm test -- frontend/tests/unit/architecture.test.ts
npm test -- frontend/tests/unit
npm run typecheck
```

The architecture suite includes regression fixtures for inventory drift,
dependency syntax and resolution, layer violations, direct or extracted
repository-method references from composition, forbidden globals, and isolated
test mappings. Domain and application tests run in Vitest's Node environment
and use injected ports rather than browser persistence or live network
services.
