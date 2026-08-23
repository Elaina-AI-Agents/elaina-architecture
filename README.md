# Elaina Architecture

This repository is the evidence-linked, as-is architecture record for the Elaina AI Agents prototype. It documents what the pinned source implements, where the public product description differs from runtime behavior, and which constraints should govern future omnichannel work.

It is not a target architecture, deployable service, database migration, or claim that the prototype is production-ready.

## Snapshot

The architecture was inspected on 2026-08-23 and is pinned to:

| Source | Commit | Role |
| --- | --- | --- |
| [`Elaina-AI-Agents/ai-agents`](https://github.com/Elaina-AI-Agents/ai-agents/tree/0597bf2ff8e75d09c403f7992a03fe08cba5e0da) | `0597bf2ff8e75d09c403f7992a03fe08cba5e0da` | Express Agent API and agent definitions |
| [`Elaina-AI-Agents/whatsapp`](https://github.com/Elaina-AI-Agents/whatsapp/tree/cd2f34ae6fe09217d47556b4fec18d429847eb85) | `cd2f34ae6fe09217d47556b4fec18d429847eb85` | WhatsApp adapter and Supabase history client |
| [`Elaina-AI-Agents/.github`](https://github.com/Elaina-AI-Agents/.github/tree/5689f02df71f517041a0759840daef7da0dc0581) | `5689f02df71f517041a0759840daef7da0dc0581` | Stated product intent |

The machine-readable snapshot is in [`contracts/source-snapshots.json`](contracts/source-snapshots.json). A scheduled check fails when a pinned repository's default branch advances; it does not update this repository automatically.

## Architecture map

- [Architecture index](docs/architecture/README.md)
- [System context](docs/architecture/system-context.md)
- [Containers and components](docs/architecture/containers-and-components.md)
- [Runtime flows](docs/architecture/runtime-flows.md)
- [Data and deployment](docs/architecture/data-and-deployment.md)
- [Observed gaps](docs/architecture/observed-gaps.md)
- [Future constraints](docs/architecture/future-constraints.md)
- [Source traceability](docs/architecture/traceability.md)
- [Threat model](docs/security/threat-model.md)
- [Remediation backlog](docs/security/remediation-backlog.md)
- [Observed OpenAPI contract](contracts/openapi.yaml)
- [Architecture Decision Records](docs/adr/README.md)

## Local validation

Requirements: Node.js 24 and npm.

```sh
npm ci
npm run validate
```

Validation covers Markdown, OpenAPI, Mermaid rendering, links, source drift, and the drift checker's 80% line/function/branch coverage gates. GitHub Actions also runs a repository secret scan.

## Scope and safety

No authentication material, WhatsApp session content, cookies, API credentials, or database contents are copied into this repository. Security findings describe exposure classes and mitigations without publishing exploit instructions.

The source repositories are not modified by this architecture baseline.

## License

[MIT](LICENSE)
