# Spec 000: Base System Architecture & Tech Stack

> **Status in this repository**: EXAMPLE / REFERENCE MATERIAL — NON-NORMATIVE.
> This document originated outside the Spec-Driven Development workflow as an
> external example. Its decisions have been absorbed into the project
> constitution (`.specify/memory/constitution.md`), which is the sole governing
> document. Where this example and the constitution diverge (e.g. mapping
> engine), the constitution supersedes it. Kept for provenance and blog
> narrative purposes.

- **Status**: APPROVED
- **Author**: Product Owner Agent
- **Target Component**: System Architecture / Infrastructure

---

## 1. Executive Summary

This specification establishes the architectural foundation for the Open Source VigoBus Progressive Web App (PWA). The system enables real-time public bus tracking for Vigo, Spain, operating completely within zero-cost, serverless infrastructure.

---

## 2. Technology Stack Definition

| Component | Selected Technology | Rationale | Cost Level |
| :--- | :--- | :--- | :--- |
| **Frontend Hosting** | GitHub Pages | Static PWA hosting with HTTPS support. | 0.00 € |
| **Mapping Engine** | Leaflet.js / MapLibre GL | Lightweight open-source map renderers. | 0.00 € |
| **Map Base Layers** | CartoDB (Positron & Dark Matter) | High-contrast, clean minimal tiles. | 0.00 € |
| **Proxy / Middleware** | Cloudflare Workers | Edge execution (V8), handles REST-to-SOAP translation & CORS. | 0.00 € (100k/day) |
| **Client Persistence** | Browser `localStorage` | Favorite stops, recent history, offline app settings. | Local |
| **CI/CD Platform** | Harness + GitHub Actions | Automated build, test, and edge deployment orchestration. | 0.00 € |

---

## 3. System Architecture & Topology

```
+-----------------------------------------------------------------------+
|                    CLIENT (PWA / GITHUB PAGES)                        |
|                                                                       |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | User Interface     |  | Map Engine         |  | Optimization    |  |
|  | (HTML/CSS/JS)      |  | (Leaflet/MapLibre) |  | (Visibility API)|  |
|  +---------+----------+  +---------+----------+  +--------+--------+  |
|            |                       |                      |           |
|            +-----------------------+----------------------+           |
|                                    |                                  |
|                                    v                                  |
|                         `localStorage` Cache                          |
+------------------------------------+----------------------------------+
                                     |
                                     | 1. REST Request (JSON)
                                     v
+-----------------------------------------------------------------------+
|                    CLOUDFLARE WORKER (EDGE PROXY)                     |
|                                                                       |
|  • REST to SOAP Payload Transformation                                |
|  • Automatic CORS Injections (`Access-Control-Allow-Origin: *`)       |
|  • Edge Cache (30s TTL per stop query)                                |
+------------------------------------+----------------------------------+
                                     |
                                     | 2. Encapsulated SOAP/XML POST
                                     v
+-----------------------------------------------------------------------+
|                   LEGACY TRANSPORT ENDPOINT (SOAP)                    |
|                                                                       |
|  Vigo Public Transport Telemetry Backend / Server XML Stream          |
+-----------------------------------------------------------------------+
```

---

## 4. Subsystem Details

### 4.1 Edge Proxy Worker (`/worker`)
* Exposes a clean REST API: `GET /?stop_id={id}`.
* Translates incoming JSON GET requests into outbound SOAP/XML POST requests targeting legacy transport endpoints.
* Parses SOAP XML responses into clean, lightweight JSON objects.
* Enforces HTTP headers:
  * `Content-Type: application/json`
  * `Access-Control-Allow-Origin: *`
  * `Cache-Control: public, max-age=30`

### 4.2 Frontend PWA (`/frontend`)
* Single Page PWA served via GitHub Pages.
* Offline capability via Service Worker caching static assets.
* Implements the `visibilitychange` API to pause real-time fetching when the application is backgrounded.

---

## 5. Acceptance Criteria

- [ ] **AC-001**: Cloudflare Worker successfully translates incoming REST query parameters to legacy SOAP XML structures.
- [ ] **AC-002**: Responses from Cloudflare Workers include valid CORS headers allowing fetch requests from any origin.
- [ ] **AC-003**: Frontend renders stops using CartoDB tile layers without standard OpenStreetMap clutter.
- [ ] **AC-004**: CI/CD pipeline deploys `/worker` changes to Cloudflare and `/frontend` changes to GitHub Pages on every push to `main`.