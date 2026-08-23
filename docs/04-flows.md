# End-to-End Flows

Six flows cover the implemented user-facing behaviour. Each begins with
what is happening in plain language, then shows the observed sequence in
detail. The diagrams describe the pinned source; they do not add
authentication, retries, queues, validation, or isolation that the
applications do not implement.

---

## 1. Private Chat

A person who has already selected an agent sends the bot a direct
WhatsApp message. The adapter records that message, loads every stored
message for the same WhatsApp JID, and asks the Agent API for a reply.
The reply is sent back through WhatsApp and then recorded in the same
history.

```mermaid
sequenceDiagram
    autonumber
    actor U as WhatsApp user
    participant WA as WhatsApp Adapter
    participant DB as Supabase
    participant API as Agent API
    participant OAI as OpenAI Responses API

    U->>WA: send a direct message
    WA->>DB: select agent from user_agents by message.from
    DB-->>WA: selected agent or no row

    alt no selected agent
        WA-->>U: ask the user to run #agent
    else selected agent exists
        WA->>WA: relayToAgent(body, WhatsApp JID)
        WA->>DB: select agent again by WhatsApp JID
        WA->>DB: insert user_id, role=user, content=body
        WA->>DB: select role and content by user_id<br/>order by id ascending
        DB-->>WA: all matching history rows
        WA->>API: POST /api/v1/character/chat<br/>userId + message + agent + history
        API->>API: map agent name to one instruction string
        API->>API: history.concat(current user message)
        API->>OAI: responses.create<br/>gpt-4o-mini + web_search
        OAI-->>API: response output
        API-->>WA: { response }
        WA->>WA: append #help footer to string response
        WA-->>U: send WhatsApp reply
        WA->>DB: insert assistant reply with footer
    end
```

There are two important details in this otherwise synchronous path.
First, the adapter inserts the current user message before reading the
history, so that message is already present in `history`; the Agent API
then concatenates `message` onto that history again. The current content
can therefore reach OpenAI twice. Second, the history query has no
limit, conversation boundary, summary, or retention filter.

The API chooses a static instruction string from the requested agent
name. Although `agents.js` defines an Agents SDK orchestrator and three
sub-agents, this chat endpoint does not run that orchestration graph.
It calls the Responses API directly and enables `web_search`.

---

## 2. Group Mention

Inside a group, ordinary conversation is intended to reach Elaina only
when the bot is mentioned. Agent choice and chat history are keyed by
the group JID, not by the participant who sent the message, so everyone
in that group shares the same selected persona and history stream.

```mermaid
sequenceDiagram
    autonumber
    actor M as Group participant
    participant WA as WhatsApp Adapter
    participant DB as Supabase
    participant API as Agent API
    participant OAI as OpenAI Responses API

    M->>WA: send a group message
    WA->>WA: message.from ends with @g.us
    WA->>DB: select agent by group JID
    DB-->>WA: selected agent or no row

    alt no selected agent
        WA-->>M: ask the group to run #agent
    else bot is not in mentionedIds
        WA->>WA: return without relaying the message
    else bot is mentioned
        WA->>DB: insert user message under group JID
        WA->>DB: read all history under group JID
        WA->>API: POST /api/v1/character/chat<br/>userId is the group JID
        API->>OAI: responses.create with selected instructions
        OAI-->>API: generated output
        API-->>WA: { response }
        WA-->>M: send reply to the group
        WA->>DB: insert assistant reply under group JID
    end
```

The selected-agent lookup happens before the group mention gate. A
group with no stored agent can therefore receive the selection prompt
even when the incoming message did not mention the bot. Once an agent
exists, an unmentioned ordinary message is ignored after that lookup.

Command handling also precedes the ordinary group gate. Agent selection
and matching knowledge-upload commands are evaluated before the mention
check; `#help` has its own group-specific mention condition. These
ordering details are properties of the current single message handler,
not a general channel-policy layer.

---

## 3. Selecting an Agent

Before normal chat can proceed, a user or group chooses one of four
names compiled into the WhatsApp adapter: `PersonaPro_AI`,
`MarketMaven`, `ContentCrafter`, or `CareConnect`. Selection changes the
instruction string used by later calls; it does not start or bind a
separate agent process.

```mermaid
sequenceDiagram
    autonumber
    actor U as WhatsApp user or group participant
    participant WA as WhatsApp Adapter
    participant DB as Supabase user_agents

    U->>WA: #agent AgentName
    WA->>WA: trim and lowercase AgentName
    WA->>WA: case-insensitive lookup in AGENT_LIST

    alt name is not one of the four entries
        WA-->>U: agent not found plus available-agent list
    else name is recognized
        WA->>DB: upsert user_id and canonical agent name<br/>on conflict user_id
        DB-->>WA: operation completes
        WA-->>U: confirm the selected agent and description
    end
```

For a direct message, `user_id` is the sender's WhatsApp JID. For a
group message, it is the group JID. The code awaits the Supabase upsert
but does not inspect the returned error, so the confirmation is not
proof that persistence succeeded.

The source also declares an in-memory `userAgentMap`, described in a
comment as reset-on-restart state, but the implemented selection and
lookup paths do not use it. Supabase is the observed store used by the
runtime flow.

---

## 4. Assembling Chat History and Model Context

History is not a separate request that a user triggers, but it is a
distinct data flow on every accepted chat message. The adapter owns
persistence; the Agent API owns the final transformation into OpenAI
input.

```mermaid
sequenceDiagram
    autonumber
    participant WA as WhatsApp Adapter
    participant DB as Supabase chat_history
    participant API as Agent API
    participant OAI as OpenAI Responses API

    WA->>DB: insert { user_id, role: user, content: body }
    WA->>DB: select role, content<br/>where user_id equals JID<br/>order by id ascending
    DB-->>WA: rows or an empty array
    WA->>API: history plus the same current message

    alt history is a non-empty array
        API->>API: history.concat([{ role: user,<br/>content: message }])
    else no usable history array
        API->>API: input = message
    end

    API->>OAI: responses.create(input, instructions, web_search)
    OAI-->>API: output array
    API->>API: find first item with type=message<br/>read first content item's text
    API-->>WA: text or fallback sentence
    WA->>WA: append command footer
    WA->>DB: insert { user_id, role: assistant,<br/>content: reply with footer }
```

The only fields read back from `chat_history` are `role` and `content`;
`id` is used solely to define ascending order. No code validates stored
roles before forwarding them, checks database errors, bounds the row
count, calculates a token budget, or separates multiple conversations
under the same JID.

Because the command footer becomes part of the persisted assistant
content, it is included in future model context. If the Agent API call
fails, the adapter sends an error message to WhatsApp but does not add
an assistant history row for that failure.

---

## 5. Uploading Text Knowledge

A user supplies a title on the `#addtext` line and text on the following
line or lines. The WhatsApp adapter forwards both to the Agent API,
which turns the text into a temporary file, uploads it to OpenAI Files,
and attaches the resulting file to one configured vector store.

```mermaid
sequenceDiagram
    autonumber
    actor U as WhatsApp user or group participant
    participant WA as WhatsApp Adapter
    participant API as Agent API
    participant FS as Agent API filesystem
    participant Files as OpenAI Files
    participant VS as Configured vector store

    U->>WA: #addtext Title followed by newline and text
    WA->>WA: regular expression extracts title and text
    WA->>API: POST /api/v1/character/add-knowledge/text<br/>{ userId: JID, title, text }
    API->>API: require truthy userId and text

    alt required value is missing
        API-->>WA: 400 with error
        WA-->>U: upload failed message
    else values are present
        API->>FS: write tmp_timestamp.txt in process directory
        API->>Files: create file for assistants<br/>metadata: user_id, title, type=text
        Files-->>API: file including generated ID
        API->>FS: unlink temporary file
        API->>VS: create file batch with that file ID
        VS-->>API: batch request completes
        API-->>WA: { success: true, file_id }
        WA-->>U: upload succeeded message
    end
```

The temporary file is deleted only after the file upload succeeds. It
is not protected by a `finally` block, so a failure before deletion can
leave process-local data behind. The pinned Agent API is declared as an
ES module while this route calls `require("fs")`; that is an observed
runtime compatibility risk rather than a documented success guarantee.

The `user_id` is metadata on the OpenAI file, but every upload is
attached to the same environment-selected `VECTOR_STORE_ID`. The chat
request enables web search only; it does not enable file search or
reference this vector store. Uploading knowledge therefore does not
make it part of the observed chat context.

---

## 6. Uploading PDF Knowledge

PDF upload starts with a WhatsApp media message that also matches the
adapter's `#addpdf` command pattern. The adapter downloads the media,
accepts it when WhatsApp reports `application/pdf`, and sends it to the
Agent API as an in-memory multipart upload.

```mermaid
sequenceDiagram
    autonumber
    actor U as WhatsApp user or group participant
    participant WA as WhatsApp Adapter
    participant API as Agent API
    participant Memory as Process memory
    participant Files as OpenAI Files
    participant VS as Configured vector store

    U->>WA: media message matching #addpdf title<br/>plus newline and body
    WA->>WA: downloadMedia()
    WA->>WA: require media.mimetype = application/pdf
    WA->>Memory: decode base64 media into Buffer
    WA->>API: multipart userId + file<br/>and optional message.caption as title
    API->>Memory: Multer buffers single file field
    API->>API: require truthy userId and req.file

    alt required value is missing
        API-->>WA: 400 with error
        WA-->>U: upload failed message
    else values are present
        API->>Files: create file for assistants<br/>filename + buffer + metadata
        Files-->>API: file including generated ID
        API->>VS: create file batch with that file ID
        VS-->>API: batch request completes
        API-->>WA: { success: true, file_id }
        WA-->>U: upload succeeded message
    end
```

The help text says a PDF can be sent directly with an optional caption,
but the handler requires both media and a body matching `#addpdf`, with
a title and content separated by a newline. The command-derived title
is not placed in the multipart form; `message.caption`, when present,
is used instead. Otherwise the API falls back to the original filename
for file metadata.

The adapter performs the MIME comparison. The Agent API itself does not
independently validate MIME type, file signature, or upload size, and
Multer is configured without an observed limit. As with text, the file
is attached to the one configured vector store and is not consumed by
the chat path.

---

Next: [05-data-model.md](05-data-model.md) - where the state created by
these flows lives and which parts of its schema remain unknown.
