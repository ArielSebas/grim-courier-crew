# Implementation Plan

- [ ] 1. Project scaffolding
  - Next.js App Router, React 19, TypeScript strict, Tailwind v4, Vitest, fast-check, MCP SDK
  - _Requirements: 6, 7, 8_

- [x] 2. Domain core: types, constants, round2, ingestion
  - [x] 2.1 Implement `round2`, constants and lb to kg conversion
  - [x] 2.2 Implement cart validation and normalization
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

- [ ] 6. Agent 3: Route Dispatcher and MCP Gateway
  - [x] 6.1 Courier comparison (Temu Direct, LaarBox, Upper)
  - [x] 6.2 Manifest export and PhantasmTrack deep link
  - [ ] 6.3 MCP server tools and Kiro Crew manifest in `mcp-server/`
  - _Requirements: 5, 6_

- [ ] 7. Command Center UI
  - [ ] 7.1 ES/EN i18n and gothic theme
  - [ ] 7.2 Preset carts and cart editor
  - [ ] 7.3 Real-time execution trace and result panels
  - _Requirements: 7_

- [x] 8. Property-Based Tests
  - [x] 8.1 P1 Conservation of mass and FOB
  - [x] 8.2 P2 4x4 threshold compliance
  - [x] 8.3 P3 Tax determinism, non-negativity, round2 precision
  - [x] 8.4 Example tests for restrictions and courier ordering
  - _Requirements: 8_
