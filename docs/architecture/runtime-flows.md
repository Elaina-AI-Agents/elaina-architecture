# Runtime flows

These sequences describe observed control flow. They do not add authentication, retries, queues, or validation that the pinned applications do not implement.

## Private chat

```mermaid
sequenceDiagram
    actor User
    participant WA as WhatsApp adapter
    participant DB as Supabase
    participant API as Agent API
    participant OAI as OpenAI Responses API

    User->>WA: Direct message
    WA->>DB: Read selected agent by WhatsApp JID
    alt no selected agent
        WA-->>User: Ask user to run #agent
    else selected agent exists
        WA->>DB: Insert user history item
        WA->>DB: Read all history ordered by id
        WA->>API: POST /chat with JID, message, agent, history
        API->>OAI: responses.create with instructions and web_search
        OAI-->>API: Response output
        API-->>WA: JSON response
        WA-->>User: Response plus #help footer
        WA->>DB: Insert assistant history item
    end
```

The history query is not bounded. The just-inserted user message is included in `history`, and the Agent API appends the current `message` again before calling OpenAI, so the current user content may be duplicated.

## Group mention

```mermaid
sequenceDiagram
    actor Member as Group participant
    participant WA as WhatsApp adapter
    participant DB as Supabase
    participant API as Agent API

    Member->>WA: Group message
    WA->>DB: Read selected agent using group JID
    alt no agent stored for group JID
        WA-->>Member: Ask group to select an agent
    else bot not mentioned
        WA-->>WA: Ignore message
    else bot mentioned
        WA->>DB: Store and read history using group JID
        WA->>API: Relay message using group JID as userId
        API-->>WA: Generated response
        WA-->>Member: Send response to group
    end
```

The group JID, not the individual sender JID, is used for agent choice and history. The resulting state is shared at group level.

## Agent selection

```mermaid
sequenceDiagram
    actor User
    participant WA as WhatsApp adapter
    participant DB as Supabase user_agents

    User->>WA: #agent AgentName
    WA->>WA: Case-insensitive lookup in four-entry list
    alt unknown agent
        WA-->>User: Return available agent list
    else known agent
        WA->>DB: Upsert user_id and agent on user_id conflict
        DB-->>WA: Completion is awaited, result is not inspected
        WA-->>User: Confirm selected agent
    end
```

## Chat history

```mermaid
sequenceDiagram
    participant WA as WhatsApp adapter
    participant DB as Supabase chat_history
    participant API as Agent API
    participant OAI as OpenAI Responses API

    WA->>DB: Insert role=user, content=message
    WA->>DB: Select role, content for user_id ordered by id ascending
    DB-->>WA: Entire observed conversation
    WA->>API: history plus current message
    API->>API: Concatenate history and current message
    API->>OAI: Unbounded input array
    OAI-->>API: Generated response
    API-->>WA: response
    WA->>DB: Insert role=assistant, content=response plus help footer
```

Database errors are not checked in the helper functions. No retention, pagination, summarization, token budget, or conversation boundary is observed.

## Text knowledge upload

```mermaid
sequenceDiagram
    actor User
    participant WA as WhatsApp adapter
    participant API as Agent API
    participant FS as Agent API filesystem
    participant Files as OpenAI Files
    participant VS as Configured vector store

    User->>WA: #addtext Title plus newline plus text
    WA->>API: POST /add-knowledge/text with userId, title, text
    API->>API: Check userId and text are truthy
    API->>FS: Write timestamped temporary text file
    API->>Files: Upload file with user metadata
    API->>FS: Delete temporary file
    API->>VS: Attach file ID to VECTOR_STORE_ID
    API-->>WA: success and file_id
    WA-->>User: Upload success message
```

The pinned Agent API is an ES module but calls `require` in this route. That is a runtime compatibility risk. Cleanup also occurs only on the success path.

## PDF knowledge upload

```mermaid
sequenceDiagram
    actor User
    participant WA as WhatsApp adapter
    participant API as Agent API
    participant Files as OpenAI Files
    participant VS as Configured vector store

    User->>WA: Media message matching #addpdf command pattern
    WA->>WA: Download base64 media and check application/pdf
    WA->>API: Multipart userId, file, optional title
    API->>API: Multer buffers file in memory, then checks userId and file
    API->>Files: Upload file with user metadata
    API->>VS: Attach file ID to VECTOR_STORE_ID
    API-->>WA: success and file_id
    WA-->>User: Upload success message
```

The help text says a PDF can be sent directly, but the handler additionally requires the message body to match the `#addpdf` title-and-body regular expression. The adapter checks the media MIME type; the API does not independently enforce MIME type or size.
