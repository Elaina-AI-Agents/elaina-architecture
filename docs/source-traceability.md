# Source Traceability

This appendix preserves the evidence discipline behind the numbered architecture narrative. Every link below targets an immutable commit. Line anchors are evidence pointers, not ownership boundaries. Ranges use one-based physical lines and were checked against the pinned source snapshots on 2026-08-23.

## WhatsApp adapter

| Architecture claim | Pinned source evidence |
| --- | --- |
| LocalAuth and Chromium are embedded in the adapter | [`whatsapp/index.js` lines 52–59](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L52-L59) |
| QR linking and ready lifecycle | [`whatsapp/index.js` lines 61–71](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L61-L71) |
| Agent selection persists in `user_agents` | [`whatsapp/index.js` lines 94–108](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L94-L108) |
| History persists in `chat_history` and is read without a limit | [`whatsapp/index.js` lines 109–123](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L109-L123) |
| Four selectable agent names are hard-coded | [`whatsapp/index.js` lines 128–145](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L128-L145) |
| Text knowledge command relays caller identity and content | [`whatsapp/index.js` lines 191–211](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L191-L211) |
| PDF matching, MIME check, buffering, and multipart relay | [`whatsapp/index.js` lines 213–240](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L213-L240) |
| Group messages require a bot mention | [`whatsapp/index.js` lines 280–289](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L280-L289) |
| Relay stores and retrieves unbounded history | [`whatsapp/index.js` lines 295–321](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/index.js#L295-L321) |
| Supabase uses URL and anon key environment variables | [`whatsapp/db.js` lines 6–9](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/db.js#L6-L9) |
| A LocalAuth directory is present in the pinned tree while ignore rules are commented | [Repository tree at the pinned commit](https://github.com/Elaina-AI-Agents/whatsapp/tree/cd2f34ae6fe09217d47556b4fec18d429847eb85) and [`.gitignore` lines 42–47](https://github.com/Elaina-AI-Agents/whatsapp/blob/cd2f34ae6fe09217d47556b4fec18d429847eb85/.gitignore#L42-L47) |

## Agent API

| Architecture claim | Pinned source evidence |
| --- | --- |
| Text ingestion uses a temporary file and one vector store | [`ai-agents/index.js` lines 15–39](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L15-L39) |
| PDF ingestion uses in-memory Multer and one vector store | [`ai-agents/index.js` lines 41–72](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L41-L72) |
| Knowledge listing always returns 501 | [`ai-agents/index.js` lines 74–78](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L74-L78) |
| Agent names map to static instructions | [`ai-agents/index.js` lines 80–91](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L80-L91) |
| Chat directly calls `gpt-4o-mini` with web search | [`ai-agents/index.js` lines 93–119](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L93-L119) |
| PersonaPro and specialist Agent tools are definitions only | [`ai-agents/agents.js` lines 7–66](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/agents.js#L7-L66) |
| Vercel routes all paths to `index.js` | [`ai-agents/vercel.json` lines 1–5](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/vercel.json#L1-L5) |

## Stated product intent

| Claim source | Pinned evidence |
| --- | --- |
| Organization-level feature and architecture description | [`.github/profile/README.md`](https://github.com/Elaina-AI-Agents/.github/blob/5689f02df71f517041a0759840daef7da0dc0581/profile/README.md) |
| Organization profile names GPT-4o while runtime selects `gpt-4o-mini` | [Profile model claim on lines 3–10](https://github.com/Elaina-AI-Agents/.github/blob/5689f02df71f517041a0759840daef7da0dc0581/profile/README.md#L3-L10) and [`ai-agents/index.js` lines 106–111](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L106-L111) |

## Machine-readable contract mapping

| OpenAPI operation | Implementation evidence |
| --- | --- |
| `createCharacterChatResponse` | [`ai-agents/index.js` lines 93–119](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L93-L119) |
| `addCharacterTextKnowledge` | [`ai-agents/index.js` lines 15–39](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L15-L39) |
| `addCharacterPdfKnowledge` | [`ai-agents/index.js` lines 41–72](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L41-L72) |
| `listCharacterKnowledge` | [`ai-agents/index.js` lines 74–78](https://github.com/Elaina-AI-Agents/ai-agents/blob/0597bf2ff8e75d09c403f7992a03fe08cba5e0da/index.js#L74-L78) |

---

Start again at [01-context.md](01-context.md), or inspect the observed
[OpenAPI contract](../contracts/openapi.yaml).
