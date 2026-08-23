# ADR-0002: Record an as-is snapshot with future constraints

**Date**: 2026-08-23
**Status**: accepted
**Deciders**: Elaina AI Agents maintainers

## Context

The organization profile describes capabilities that are not fully represented in runtime paths. The immediate need is a trustworthy baseline, while the longer-term product direction is omnichannel with WhatsApp first.

## Decision

Document the pinned implementation as it exists, label unknowns and gaps explicitly, and record only non-prescriptive constraints for future omnichannel work. Do not present a target service topology or migration plan in this baseline.

## Alternatives considered

### Document the desired production system

- **Pros**: Gives implementers a destination architecture.
- **Cons**: Mixes unimplemented design with current operational truth.
- **Why not**: The agreed deliverable is an as-is architecture.

### Document only current files without future constraints

- **Pros**: Strictly descriptive and smaller.
- **Cons**: Loses the agreed channel-agnostic direction and allows future coupling to WhatsApp concepts.
- **Why not**: Omnichannel direction is a settled product constraint.

## Consequences

### Positive

- Readers can distinguish evidence from intent.
- Future design work starts with explicit boundaries without prematurely choosing technologies.

### Negative

- This repository does not tell an implementer how to build the production target.
- A separate target-architecture decision will still be required.

### Risks

- **Accidental idealization**: Link every material current-state claim to a pinned source line.
- **Constraints mistaken for design**: Keep undecided technology and topology choices explicit.
