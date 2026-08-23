# Future omnichannel constraints

This is not a target architecture. It records constraints that a future architecture must satisfy if Elaina expands beyond WhatsApp, without selecting services, frameworks, queues, or deployment vendors.

## Required boundaries

1. **Channel adapters remain replaceable.** WhatsApp-specific SDK objects, JIDs, commands, media decoding, and session state must not become core agent interfaces.
2. **Identity is canonical and scoped.** Tenant, channel, actor, conversation, and message identifiers must be distinct. A group identifier must not silently substitute for an individual actor.
3. **Service calls are authenticated.** The Agent API must derive authorization from a verifiable service or user identity rather than trusting a request-body `userId`.
4. **Knowledge is tenant-scoped end to end.** Ingestion, retrieval, listing, deletion, and audit paths must enforce the same tenant boundary.
5. **Conversation context is bounded.** Context selection must have retention, pagination, token-budget, summarization, and deletion policies.
6. **Provider integrations have explicit ports.** LLM, web search, file storage, vector retrieval, channel transport, and persistence must be replaceable behind documented contracts.
7. **Cost and abuse controls are architecture concerns.** Expensive model, web search, and file operations require quotas, rate limits, size limits, timeouts, and attribution.
8. **Operations are observable.** Every channel-to-agent flow needs correlation IDs, structured redacted logs, health signals, latency/error metrics, and actionable failure ownership.
9. **Delivery is migration-safe.** New channels must be introduced without rewriting or silently changing the observed WhatsApp contract.

## Explicitly undecided

- Monolith versus independently deployed services
- Synchronous calls versus queues or event streaming
- Database and vector-store vendor choices
- Agent framework and model-provider choices
- Cloud and container platform
- Authentication protocol and tenant provisioning workflow

Those choices require a target-architecture decision and are intentionally outside this as-is baseline.
