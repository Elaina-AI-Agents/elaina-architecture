# Observed gaps

This register separates stated product intent from behavior evidenced by the pinned source. It does not redesign the system or claim that an unobserved production control is absent outside the repositories.

| Area | Stated or implied capability | Observed implementation | Consequence |
| --- | --- | --- | --- |
| Multi-agent routing | PersonaPro delegates to specialist agents | Specialist Agent objects and tools are defined, but the chat route selects a static instruction string and directly calls the Responses API | Runtime behavior is persona prompt selection, not tool-based agent delegation |
| Model | Organization profile names GPT-4o | The chat route hard-codes `gpt-4o-mini` | Public model description differs from the observed runtime selection |
| Knowledge retrieval | User knowledge informs answers | Files are uploaded and attached to a vector store, while chat enables only `web_search` and no `file_search` tool | Uploaded knowledge is not used by the observed chat path |
| Per-user knowledge | Each user accesses only their own knowledge | One `VECTOR_STORE_ID` is used; `userId` is caller-provided metadata and no retrieval authorization exists | Tenant isolation is not enforced by the application boundary |
| Knowledge listing | Knowledge can be managed | The list endpoint always returns 501 | No observed list, inspect, or delete lifecycle |
| PDF command | Sending a PDF is sufficient | The handler also requires a specific `#addpdf` body pattern | Help text and matching behavior differ |
| Authentication | Internal-looking API boundary | Every endpoint is unauthenticated and trusts caller payloads | Identity, cost, and data boundaries cannot be enforced |
| Input controls | Text and PDF ingestion | Presence checks only; no API-side file type, size, text length, or history length bounds | Memory, token, storage, and cost usage are unbounded |
| Conversation identity | User-specific agent and history | A group JID is used as `user_id` for group messages | Agent selection and history are shared across a group |
| History context | Persistent contextual chat | The entire history is read, then the current message is appended again by the API | Increasing latency/cost and possible duplicate current input |
| Database contract | Setup references known tables | No migrations, types, RLS policies, indexes, or constraints are committed | Database behavior and isolation cannot be reproduced from source |
| Operations | Two services can be started | Only the Agent API has a Vercel manifest; no production runner, health route, monitoring, or recovery definition exists for WhatsApp | Deployment and recovery are operator-dependent |
| Quality gates | Not stated | Package test scripts intentionally fail and no CI workflows exist | Behavior is not continuously verified |
| Session hygiene | LocalAuth is runtime state | A LocalAuth/Chromium profile is present in public Git history while ignore rules are commented | Session material may be exposed and repository size is inflated |

## Evidence rules

- “Observed” means directly supported by the pinned repositories.
- “Unknown” means the repository does not provide enough evidence; it does not mean a control is definitely absent in every deployed environment.
- README claims are treated as stated intent until a runtime path supports them.
- Security priority and safe remediation guidance live in the [remediation backlog](../security/remediation-backlog.md).
