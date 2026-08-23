# Containers and components

## Container view

```mermaid
flowchart LR
    wa["Container: WhatsApp adapter<br/>Node.js, CommonJS, whatsapp-web.js<br/>Default port 3002"]
    api["Container: Agent API<br/>Node.js, ESM, Express<br/>Default port 3001"]
    browser["Embedded runtime<br/>Chromium and LocalAuth profile"]
    db[("Supabase<br/>user_agents, chat_history")]
    responses["OpenAI Responses API<br/>gpt-4o-mini + web_search"]
    files["OpenAI Files and Vector Store<br/>single configured store"]
    web["WhatsApp Web"]

    wa <-->|SDK session and message events| web
    wa --- browser
    wa <-->|Supabase client with anon key| db
    wa -->|HTTP JSON and multipart| api
    api -->|responses.create| responses
    api -->|files.create and fileBatches.create| files
```

The Agent API has a Vercel routing manifest. No deployment manifest is observed for the stateful, long-running WhatsApp adapter.

## WhatsApp adapter components

```mermaid
flowchart TB
    events["whatsapp-web.js event handlers"]
    commands["Command parser<br/>help, agent, addtext, addpdf"]
    group["Group mention gate"]
    relay["Agent API relay"]
    history["History repository functions"]
    selection["Agent selection repository functions"]
    lifecycle["LocalAuth and Chromium lifecycle"]

    events --> commands
    events --> group
    commands --> selection
    commands --> relay
    group --> relay
    relay --> history
    lifecycle --> events
```

All components are functions and handlers in one `index.js`; the diagram separates responsibilities, not files or independently deployable units. An unused in-memory `userAgentMap` is declared, while persisted selection uses Supabase.

## Agent API components

```mermaid
flowchart TB
    express["Express route handlers"]
    prompt["Agent-name to instruction map"]
    definitions["OpenAI Agents SDK definitions<br/>PersonaPro and three specialists"]
    chat["Responses API client"]
    upload["Multer and temporary-file ingestion"]
    vector["Vector store attachment"]

    express --> prompt
    definitions -->|PersonaPro instructions only| prompt
    prompt --> chat
    express --> upload
    upload --> vector
```

The specialist Agents SDK tools are defined but are not executed by the HTTP chat route. The route selects a static instruction string and calls the Responses API directly.
