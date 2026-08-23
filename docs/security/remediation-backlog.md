# Security remediation backlog

This backlog is advisory and intentionally does not modify the pinned source repositories. Priorities express risk order, not an approved implementation design.

## P0 — contain before further public or production use

| Item | Required outcome | Verification evidence |
| --- | --- | --- |
| Revoke exposed WhatsApp session state | Terminate linked-device sessions associated with committed LocalAuth data, relink from a clean runtime, and confirm old material cannot authenticate | WhatsApp linked-device readback and clean runtime login |
| Remove session artifacts from source and history | Ignore all LocalAuth/cache paths, remove tracked artifacts, rewrite public history using an approved coordinated process, and invalidate cached clones where practical | Secret/session scanner plus repository tree and history inspection |
| Authenticate the Agent API | Every chat and knowledge request has a verifiable caller identity; body `userId` is never accepted as proof of identity | Negative authentication and cross-identity authorization tests |
| Establish tenant-scoped knowledge | Ingestion, retrieval, listing, and deletion enforce tenant ownership; a shared store cannot return another tenant's content | Cross-tenant isolation integration tests |

## P1 — production safety gates

| Item | Required outcome | Verification evidence |
| --- | --- | --- |
| Validate and bound inputs | Schema validation, PDF signature/type checks, file and text size limits, bounded history, request timeouts, and safe temporary cleanup | Boundary and malicious-input tests |
| Enforce cost and abuse controls | Per-identity and per-tenant quotas, endpoint rate limits, concurrency bounds, and model/search budgets | Rate-limit and quota tests plus usage dashboards |
| Make Supabase policy reproducible | Versioned migrations, constraints, indexes, RLS policies, and least-privilege credentials | Clean database bootstrap and RLS isolation tests |
| Restore browser isolation | Run Chromium with an appropriate sandbox or isolate the browser workload in a hardened runtime | Runtime security configuration evidence |
| Define data lifecycle | Retention, deletion, export, backup, and recovery policies for messages and knowledge | Lifecycle integration tests and restore exercise |

## P2 — reliability and governance

| Item | Required outcome | Verification evidence |
| --- | --- | --- |
| Add observability | Correlation IDs, structured redacted logs, health checks, latency/error metrics, alerts, and ownership | Synthetic flow and alert-delivery test |
| Establish delivery gates | Unit, integration, and critical-flow tests; dependency and secret scans; reviewed releases | Passing CI with agreed coverage and security thresholds |
| Reconcile public capability claims | README and command help describe only verified behavior | Traceability review against a released commit |
| Add incident runbooks | Session compromise, provider outage, database failure, runaway cost, and rollback procedures | Tabletop exercise and runbook review |

## Disclosure hygiene

Do not place active credentials, session databases, cookies, QR data, private logs, or raw incident evidence in public issues or pull requests. Coordinate sensitive remediation through an approved private channel.
