# Architecture index

The documentation follows a C4-style progression from system context to containers and components, then records runtime behavior, data, deployment, gaps, constraints, and evidence.

| Document | Question answered |
| --- | --- |
| [System context](system-context.md) | Who uses Elaina, and which external systems does it depend on? |
| [Containers and components](containers-and-components.md) | Which runtime units and internal responsibilities exist? |
| [Runtime flows](runtime-flows.md) | What happens for each observed WhatsApp command and chat path? |
| [Data and deployment](data-and-deployment.md) | Which data is observed, and where can each container run? |
| [Observed gaps](observed-gaps.md) | Where do stated capabilities differ from implementation? |
| [Future constraints](future-constraints.md) | Which requirements should constrain later omnichannel design? |
| [Traceability](traceability.md) | Which pinned source lines support each architecture claim? |

All diagrams are Mermaid source embedded in Markdown and rendered during CI. Component names describe observed responsibilities rather than proposed services.
