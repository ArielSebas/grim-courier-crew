# Implementation Plan

- [x] 1. Project scaffolding
  - Next.js App Router, React 19, TypeScript strict, Tailwind v4, Vitest, fast-check, MCP SDK
  - _Requirements: 6, 7, 8_

- [x] 2. Domain core: types, constants, round2, ingestion
  - [x] 2.1 Implement `round2`, constants and lb to kg conversion
  - [x] 2.2 Implement cart validation and normalization (`schemas.ts`)
  - _Requirements: 1_

- [x] 3. Agent 1: Tariff Inquisitor
  - [x] 3.1 ARCSA and ARCOTEL detection
  - [x] 3.2 Commercial quantity alert (> 3 identical units)
  - _Requirements: 2_

- [x] 4. Threshold evaluation and tax engine
  - 4x4 flat fee and General Regime (FODINFA, Ad-Valorem, IVA)
  - _Requirements: 3_

- [x] 5. Agent 2: Split-Shipment Alchemist
  - [x] 5.1 First-Fit Decreasing bin-packing
  - [x] 5.2 Unsplittable handling and net savings
  - _Requirements: 4_

- [x] 6. Agent 3: Route Dispatcher and MCP Gateway
  - [x] 6.1 Courier comparison (Temu Direct, LaarBox, Upper)
  - [x] 6.2 Manifest export and PhantasmTrack deep link
  - [x] 6.3 MCP server tools in `mcp-server/index.ts`
  - [x] 6.4 Kiro Crew `app.json` manifest, 3 agents in `agents/`, 2 skills in `skills/`
  - [x] 6.5 API route `src/app/api/crew/route.ts` (GET summary, POST run)
  - [x] 6.6 Register MCP server in `.kiro/settings/mcp.json`
  - _Requirements: 5, 6_

- [x] 7. Command Center UI
  - [x] 7.1 ES/EN i18n and gothic theme
  - [x] 7.2 Preset carts and cart editor
  - [x] 7.3 Real-time execution trace and result panels
  - [x] 7.4 Kiro Crew bundle `ui/dist/index.mjs`, favicon `src/app/icon.svg`
  - _Requirements: 7_

- [x] 8. Property-Based Tests
  - [x] 8.1 P1 Conservation of mass and FOB
  - [x] 8.2 P2 4x4 threshold compliance
  - [x] 8.3 P3 Tax determinism, non-negativity, round2 precision
  - [x] 8.4 Example tests for restrictions and courier ordering
  - _Requirements: 8_

- [x] 9. Documentation
  - [x] 9.1 `README.md` for the Kiroween 2026 judges
  - [x] 9.2 MIT `LICENSE`
