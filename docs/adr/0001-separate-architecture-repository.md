# ADR-0001: Use a separate architecture repository

**Date**: 2026-08-23
**Status**: accepted
**Deciders**: Elaina AI Agents maintainers

## Context

Elaina is split across two runtime repositories and an organization profile. Cross-system diagrams, contracts, risks, and decisions have no neutral home, while placing duplicate architecture documents in each runtime repository would create competing sources of truth.

## Decision

Use `Elaina-AI-Agents/elaina-architecture` as a public docs-as-code repository for cross-system architecture, contracts, evidence links, and ADRs. Runtime code and migrations remain in their owning repositories.

## Alternatives considered

### Store architecture in `ai-agents`

- **Pros**: No additional repository.
- **Cons**: Makes the API repository appear to own the WhatsApp and organization-wide architecture.
- **Why not**: The architecture spans more than the Agent API.

### Duplicate documents in both runtime repositories

- **Pros**: Documentation is close to each application.
- **Cons**: Cross-system diagrams and decisions can diverge.
- **Why not**: There would be no authoritative cross-repository baseline.

## Consequences

### Positive

- Architecture can be reviewed and validated independently of runtime releases.
- Cross-repository evidence and decisions have one discoverable location.

### Negative

- Source changes can make the separate documentation stale.
- Contributors must update another repository when boundaries change.

### Risks

- **Drift**: Pin source commits and run an automated default-branch drift check.
- **Ownership ambiguity**: State that runtime implementation remains owned by source repositories.
