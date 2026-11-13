# 🦅 GrimCourier Crew

Multi-agent customs intelligence crew, MCP server and interactive dashboard for Ecuadorian imports under the SENAE Category B "4x4" rule. Built for the Kiroween 2026 Hackathon (Best Kiro Crew App).

## Overview

GrimCourier Crew is the companion to [PhantasmTrack · GrimCourier](https://phantasm-track-hazel.vercel.app). PhantasmTrack tracks your packages and quota. GrimCourier Crew answers the question before you buy: should this cart ship in one box, or several?

Each box that stays within the 4x4 limits pays a flat $20.00. One box that goes over pays the General Regime. The crew finds the split that costs the least and sends each box to PhantasmTrack through a deep link.

## The 4x4 Split-Shipment Problem

| Condition | Regime | Tax |
| --- | --- | --- |
| Weight <= 4.00 kg and FOB <= $400.00 | 4x4 exempt | $20.00 flat |
| Weight > 4.00 kg or FOB > $400.00 | General Regime | 0.5% FODINFA + 20% Ad-Valorem + 15% IVA (about 38.6% of FOB) |

Example (preset `oversized_haul`): 8 items, 5.8 kg, $460 FOB.
- One box pays about $177.45.
- Two 4x4 boxes pay $40.00.
- Net savings are about $137.45. The app computes the exact value, so it may differ by a cent from this README because of rounding.

This is a 2-dimensional bin-packing problem (weight and value). The Alchemist solves it with First-Fit Decreasing, which is a heuristic and is not guaranteed to find the minimum number of boxes. When splitting does not lower the tax (for example, heavy low-value carts), it keeps the single box and reports $0.00 savings.

## The 3 Agents

| Agent | Id | Job |
| --- | --- | --- |
| 🕵️‍♂️ The Tariff Inquisitor | `tariff-inquisitor` | Flags ARCSA permits (cosmetics, supplements), ARCOTEL homologation (phones, telecom), commercial quantity (more than 3 identical units) and units over 4x4 limits. |
| ⚖️ The Split-Shipment Alchemist | `split-shipment-alchemist` | Packs units into 4x4 boxes with First-Fit Decreasing and computes exact net USD savings. |
| 🦅 The Route Dispatcher | `route-dispatcher` | Compares Temu Direct, LaarBox and Upper per box, and builds PhantasmTrack deep links. |

## Kiro Crew App Kit Architecture

```
app.json                  Manifest: agents, skills, mcpServers, crons, ui, contributes, permissions
agents/*.json             The 3 agent definitions
skills/*/SKILL.md         senae-4x4-customs, split-shipment-optimizer
ui/src/App.tsx            Kiro Crew dashboard source
ui/dist/index.mjs         Pre-built ESM bundle (react and @kirocrew/app-sdk are host externals)
mcp-server/index.ts       MCP server (stdio)
src/domain/crew/          Pure TypeScript engine (no I/O)
src/app/                  Next.js command center UI and /api/crew
```

- `crons`: `quota-mana-audit` runs weekdays at 09:00 through the Alchemist.
- `contributes.commands`: `optimize-4x4-cart` ("Optimize SENAE 4x4 Cart Split"), available from the command palette.
- `permissions`: MCP tools, storage and cron are allowed. Network is off.

## MCP Server

Server name: `grim-courier-mcp` (stdio, `npx tsx mcp-server/index.ts`).

| Tool | Description |
| --- | --- |
| `analyze_cart_senae` | Agent 1 alerts and the single-box tax. |
| `optimize_split_shipment` | Agent 2 split plan and net savings. |
| `compare_ecuador_couriers` | Agent 3 courier comparison and PhantasmTrack links per box. |
| `run_grim_courier_crew` | Full pipeline. Accepts `items` or a `presetId`. |

Inputs are validated with zod (up to 50 items, quantity up to 100).

## Web Command Center

```
npm install
npm run dev
```

Open http://localhost:3000. You get an ES/EN toggle, three one-click demo carts, a cart editor, the three agent cards with an execution trace, and a Kiro Crew and MCP inspector. The page runs the domain engine in the browser. `GET /api/crew` returns the app summary and `POST /api/crew` accepts `{ "presetId": "oversized_haul" }` or `{ "items": [...] }`.

## Development with Kiro

```
.kiro/
├── specs/split-shipment-crew/   requirements.md (EARS), design.md, tasks.md
├── steering/                    product.md, tech.md, structure.md
├── hooks/crew-pbt-check.json    Runs the tests on domain edits (disabled by default on Windows)
└── settings/mcp.json            Registers grim-courier-mcp with the 4 tools auto-approved
```

## Property-Based Testing

Vitest and fast-check (100 runs per property) verify:
- P1: weight and FOB are conserved across split boxes, and no unit is lost.
- P2: every box of a recommended split is a valid 4x4 box.
- P3: savings are never negative, and taxes are non-negative and rounded to 2 decimals.

```
npx vitest run
```

## License

MIT, see [LICENSE](./LICENSE). Copyright (c) 2026 Ariel Sebastian Cuenca Paillacho (ArielSebas).

This tool gives informational estimates, not legal or customs-broker advice. Confirm current rules with SENAE.
