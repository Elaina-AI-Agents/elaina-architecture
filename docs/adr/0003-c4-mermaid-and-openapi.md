# ADR-0003: Use C4-style Mermaid and OpenAPI

**Date**: 2026-08-23
**Status**: accepted
**Deciders**: Elaina AI Agents maintainers

## Context

Architecture diagrams must remain reviewable in Git, and the observed HTTP boundary needs a machine-readable contract. The repository should not depend on a proprietary diagram editor or require a runtime application.

## Decision

Use C4-style context, container, and component views expressed as embedded Mermaid, plus OpenAPI 3.1 for the observed Agent API. Render Mermaid and lint OpenAPI in CI.

## Alternatives considered

### Binary diagram files and prose-only API documentation

- **Pros**: Easy to create with desktop tools.
- **Cons**: Diffs are opaque and API shapes cannot be validated automatically.
- **Why not**: The repository is intended to be docs-as-code.

### Structurizr DSL and AsyncAPI

- **Pros**: Stronger dedicated C4 modeling and event-contract tooling.
- **Cons**: Adds a second modeling tool, while no stable internal event bus is observed.
- **Why not**: Mermaid and OpenAPI cover the evidenced architecture with less tooling.

## Consequences

### Positive

- Diagrams and contracts receive normal code review and automated validation.
- GitHub renders Mermaid directly in Markdown.

### Negative

- C4 semantics rely on naming and documentation discipline rather than a dedicated C4 compiler.
- OpenAPI records weak as-is validation and must not be read as a recommended secure contract.

### Risks

- **Diagram syntax regressions**: Render every Mermaid block in CI.
- **Contract idealization**: Keep required fields and responses aligned with observed route behavior.
