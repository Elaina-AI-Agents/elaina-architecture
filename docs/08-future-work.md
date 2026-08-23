# Future Work

Elaina has a working WhatsApp-to-agent path and a documented set of gaps. This
document records constraints that future work must satisfy, ordered by leverage
rather than by estimated effort. It is not a target architecture: it does not
choose a framework, queue, cloud, database, vector-store layout, or service
topology.

---

## 1. Contain Source-Controlled Runtime Authority

The WhatsApp repository contains a LocalAuth/Chromium profile in the pinned
public tree while the matching ignore rules are commented out. That profile is
runtime authority, not source code. It must be treated as potentially exposed
without copying or inspecting its contents in public remediation work.

The first constraint is a clean custody boundary: linked-device state, browser
profiles, caches, QR material, credentials, and private logs must never enter
source control. Remediation needs both sides of the lifecycle. The tracked
artifacts and coordinated history must be removed, and the linked-device
authority associated with them must be revoked and replaced. Either action by
itself is incomplete.

This is first because every architectural improvement still depends on the
integrity of the WhatsApp account at the system edge.

## 2. Canonical Identity and Authenticated Service Calls

Today a WhatsApp JID becomes `userId`, and the Agent API accepts that field as
ordinary request data. Direct and group chats give it different meanings: a
direct JID approximates an actor, while a group JID identifies a shared
conversation. The system has no canonical tenant, actor, conversation, channel,
or message identifiers.

Future flows must keep those dimensions distinct. A channel adapter should
produce a canonical envelope that binds, at minimum, tenant, channel, actor,
conversation, message, and source-event identity. The mapping back to a
channel-native identifier remains adapter-owned.

Every service call must authenticate its caller, and authorization must be
derived from that verified identity rather than from a body field. The specific
protocol and tenant-provisioning model remain undecided. The invariant is that
changing a JSON field cannot cross an identity boundary.

This item is the prerequisite for tenant-scoped knowledge, meaningful quotas,
auditable operations, and additional channels.

## 3. Tenant-Scoped Knowledge Through Its Full Lifecycle

Both knowledge endpoints currently attach files to one configured vector store.
The supplied `user_id` is metadata, the list route returns `501`, and chat does
not enable file search. Uploaded knowledge therefore exists without an observed
retrieval or management lifecycle.

Before retrieval is introduced, ingestion, indexing, retrieval, listing,
deletion, retention, and audit must enforce the same tenant boundary. A design
may use separate stores, filtered indexes, or another storage model; this
document does not select one. Whichever approach is chosen must make a
cross-tenant read impossible at the enforcement layer, not merely unlikely by
prompt or metadata convention.

The current absence of retrieval is an opportunity to establish that boundary
before knowledge begins influencing answers.

## 4. Bounded Conversation Context and Data Lifecycle

The WhatsApp adapter appends the current user message, reads all history for the
JID, and sends it to the Agent API. The API then appends the current message
again. There is no pagination, token budget, summarization boundary, retention,
or deletion path.

Future context construction must select a bounded, deterministic window and
prevent the current input from being duplicated. Retention, deletion, export,
and summarization need explicit ownership and testable behavior. Stored history
must be scoped to a canonical conversation while preserving the individual
actor in group messages.

This changes both what the system can promise about privacy and whether latency
and model cost remain stable as a conversation grows.

## 5. Cost and Abuse Controls at Every Expensive Boundary

Chat can invoke model inference and web search. Knowledge ingestion can consume
memory, file storage, vector indexing, and network bandwidth. The observed API
has no request authentication, rate limit, application-configured size limit,
timeout, concurrency bound, or usage attribution.

Future deployments must apply limits by verified service, tenant, and actor as
appropriate. Text and file sizes, context tokens, concurrent work, request
duration, retry policy, model/search use, and storage growth all need explicit
budgets. Limits must fail predictably and expose enough telemetry to distinguish
abuse, provider failure, and legitimate growth.

Canonical identity from item 2 makes those budgets enforceable; observability in
item 8 makes them operable.

## 6. Channel Adapters as Replaceable Edges

The current application mixes WhatsApp SDK objects, JIDs, command parsing,
LocalAuth state, Supabase persistence, and Agent API calls in one process. That
is sufficient for the observed channel but would make each additional channel
reimplement core behavior or leak channel-specific concepts inward.

A future channel boundary must translate native events into the canonical
identity/message envelope from item 2 and translate replies back. Session
custody, media download, mention semantics, delivery acknowledgement, retries,
and channel commands remain adapter concerns. Agent selection, context policy,
knowledge authorization, and provider invocation must not depend on
`whatsapp-web.js` objects or JID formats.

This constraint permits another channel without requiring a premature decision
between a monolith, independently deployed services, synchronous calls, or a
message broker.

## 7. Explicit Provider Ports and Capability Contracts

The chat route directly constructs an OpenAI Responses request with
`gpt-4o-mini` and web search. Knowledge routes directly call OpenAI Files and
one vector store. Meanwhile, separate specialist Agent definitions exist but
are not used by the chat route, and the organization profile describes GPT-4o
and retrieval behavior that the runtime does not implement.

Future code should depend on explicit contracts for model inference, tool use,
web search, file storage, vector indexing/retrieval, channel transport, and
persistence. A provider port does not require multiple providers on day one; it
requires the selected provider, model, tools, timeouts, failure semantics, and
cost attribution to be visible and testable at one boundary.

Versioned capability documentation must follow released behavior. Agent
orchestration and knowledge retrieval should be treated as deliberate runtime
capabilities, not inferred from definitions or uploaded artifacts that the chat
path never invokes.

## 8. Observability, Recovery, and Delivery Evidence

The pinned source has console logging but no health routes, correlation IDs,
structured redaction, latency/error metrics, alerts, backup policy, or recovery
objectives. Both package test scripts intentionally fail, and only the Agent API
has a deployment manifest.

Every channel-to-agent flow must carry a correlation identifier across adapter,
storage, API, and provider calls without logging message bodies, credentials, or
session material by default. Health signals must distinguish the HTTP process,
WhatsApp readiness, Supabase access, and provider availability. Metrics and
alerts need clear ownership, especially for failed delivery, growing context,
provider cost, and authentication failures.

Versioned migrations, unit and integration tests, authorization and isolation
tests, dependency and secret scans, and a reviewed release process are the
evidence that these constraints continue to hold. Recovery exercises must cover
linked-session replacement, database restore, provider outage, and rollback.

---

## How These Relate

Item 1 is immediate containment. It protects the authority at the current
channel edge and should not wait for broader redesign.

Item 2 is the architectural hinge. Canonical identity and authenticated service
calls make item 3's tenant knowledge boundary, item 5's quotas, item 6's channel
adapters, and item 8's audit trail enforceable rather than conventional.

Items 3 and 4 define the two durable data boundaries: what knowledge a tenant
may use and what conversation context a request may carry. Provider
abstractions in item 7 must preserve both boundaries instead of bypassing them.

Items 5 and 8 turn correctness into an operable service. Limits without
telemetry are hard to tune; telemetry without enforced limits can only report
runaway behavior after it occurs.

Item 6 enables omnichannel growth only after the identity semantics are clear.
It does not imply a queue, event bus, microservice split, or vendor change. Those
remain target-architecture decisions for a later ADR.

## Explicitly Undecided

- Monolith versus independently deployed services
- Synchronous calls versus a queue or event stream
- Database and vector-store products and partitioning strategy
- Agent framework, orchestration strategy, and model providers
- Cloud, container, process supervisor, and regional topology
- Authentication protocol and tenant-provisioning workflow
- Retention periods, service-level objectives, and budget thresholds

These choices require operating requirements that are not available in the
pinned repositories. This as-is baseline records the constraints they must
satisfy, not the design that will satisfy them.
