# Project Structure

```
grim-courier-crew/
├── src/
│   ├── domain/crew/     # Pure TypeScript agent logic and split-shipment optimizer
│   ├── __tests__/       # Vitest + fast-check PBT suites
│   └── app/             # Next.js interactive 3-agent command center UI
├── mcp-server/          # MCP server and Kiro Crew manifest
├── .kiro/
│   ├── steering/
│   ├── specs/split-shipment-crew/
│   └── hooks/
└── LICENSE
```

## Boundaries
- `src/domain/crew/`: pure functions, no I/O, no React, no Next.js, no MCP imports. Contains round2, constants, types, Tariff Inquisitor, Split-Shipment Alchemist, Route Dispatcher.
- `src/__tests__/`: tests import only from `src/domain/crew/`.
- `mcp-server/`: thin adapter exposing domain functions as MCP tools; holds the Kiro Crew manifest. Depends on the domain layer only.
- `src/app/`: UI consuming the domain layer; owns i18n (ES/EN), presets and execution trace rendering.

Dependency direction: app, mcp-server -> domain. Never the reverse.
