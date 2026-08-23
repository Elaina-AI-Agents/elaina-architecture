# System context

## Scope

Elaina is observed as a WhatsApp bot that delegates response generation and knowledge ingestion to an HTTP Agent API. Supabase stores selected agents and chat history. OpenAI provides response generation, web search, file storage, and a configured vector store.

```mermaid
flowchart LR
    user["Person<br/>WhatsApp user or group participant"]
    operator["Operator<br/>Runs and links the WhatsApp client"]
    elaina["Software System<br/>Elaina AI Agents"]
    whatsapp["External System<br/>WhatsApp Web"]
    supabase["External System<br/>Supabase"]
    openai["External System<br/>OpenAI"]

    user -->|Sends commands, messages, and PDF media| whatsapp
    operator -->|Scans QR and operates runtime| elaina
    whatsapp <-->|WhatsApp Web session and events| elaina
    elaina -->|Reads and writes agent choice and history| supabase
    elaina -->|Responses API, web search, files, vector store| openai
    elaina -->|Sends replies| whatsapp
```

## People and responsibilities

| Actor | Observed interaction |
| --- | --- |
| WhatsApp user | Chooses an agent, chats, asks for help, and submits text or PDF knowledge. |
| Group participant | Triggers chat only when the bot is mentioned; commands have separate matching behavior. |
| Operator | Starts the long-running WhatsApp process, completes QR linking, configures environment variables, and handles session-lock recovery. |

## System boundary

The Elaina boundary contains two separately packaged Node.js applications. WhatsApp, Supabase, and OpenAI are external managed systems. No web UI, admin UI, event broker, queue, or separate identity provider is observed in the pinned source.
