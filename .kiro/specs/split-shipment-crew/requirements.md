# Requirements Document

## Introduction

GrimCourier Crew is a 3-agent customs and split-shipment optimization crew for Ecuadorian imports under the SENAE Category B 4x4 rule, exposed through an MCP server and an interactive UI.

## Glossary

- **4x4 Box**: A shipment with weight <= 4.00 kg and FOB <= $400.00 USD.
- **General Regime**: 0.5% FODINFA + 20% Ad-Valorem + 15% IVA.
- **Crew**: Tariff Inquisitor, Split-Shipment Alchemist, Route Dispatcher.

## Requirements

### Requirement 1: Cart Item Ingestion & round2 Normalization

**User Story:** As an importer, I want my cart items normalized, so that all calculations are consistent.

#### Acceptance Criteria

1. WHEN a cart is submitted, THE Crew SHALL accept items with name, unit price (USD), weight, weight unit (kg or lb), quantity and category.
2. WHEN an item weight is given in lb, THE Crew SHALL convert it to kg using 1 kg = 2.20462 lb.
3. THE Crew SHALL apply `round2` (IEEE-754 safe rounding to 2 decimals) to every monetary and weight value it outputs.
4. IF an item has a non-positive or non-finite price, weight or quantity, THEN THE Crew SHALL reject the cart with a descriptive validation error.
5. IF the cart is empty, THEN THE Crew SHALL reject it with a validation error.

### Requirement 2: Agent 1 Tariff Inquisitor Restriction Detection

**User Story:** As an importer, I want restricted items flagged, so that I avoid seizure.

#### Acceptance Criteria

1. WHEN an item is in the cosmetics, supplements or medicine category, THE Tariff Inquisitor SHALL flag it as requiring an ARCSA permit.
2. WHEN an item is in the phones or routers category, THE Tariff Inquisitor SHALL flag it as requiring an ARCOTEL permit.
3. WHEN more than 3 identical units of an item exist in the cart, THE Tariff Inquisitor SHALL raise a commercial quantity alert.
4. WHEN exactly 3 or fewer identical units exist, THE Tariff Inquisitor SHALL NOT raise a commercial quantity alert.
5. THE Tariff Inquisitor SHALL return a list of findings, each with item reference, type (ARCSA, ARCOTEL, COMMERCIAL) and a bilingual message.

### Requirement 3: Single-Box vs 4x4 Threshold Evaluation

**User Story:** As an importer, I want to know the cost of shipping my cart as one box.

#### Acceptance Criteria

1. WHEN total weight <= 4.00 kg AND total FOB <= $400.00, THE Crew SHALL classify the cart as 4x4 eligible and charge a flat fee of $20.00 USD.
2. WHEN total weight > 4.00 kg OR total FOB > $400.00, THE Crew SHALL apply the General Regime.
3. WHILE the General Regime applies, THE Crew SHALL compute FODINFA as 0.5% of FOB, Ad-Valorem as 20% of FOB and IVA as 15% of (FOB + FODINFA + Ad-Valorem).
4. THE Crew SHALL return each tax component and the total, each passed through `round2`.
5. THE Crew SHALL never return a negative tax or fee value.

### Requirement 4: Agent 2 Split-Shipment Alchemist Bin-Packing

**User Story:** As an importer, I want my cart split into valid 4x4 boxes, so that I pay less tax.

#### Acceptance Criteria

1. WHEN a cart exceeds 4.00 kg or $400.00 FOB and every unit individually fits within 4x4 limits, THE Alchemist SHALL partition units into the minimal number of 4x4 boxes found by its heuristic.
2. THE Alchemist SHALL preserve total weight and total FOB across all boxes.
3. THE Alchemist SHALL ensure each box has weight <= 4.00 kg and FOB <= $400.00.
4. IF any single unit exceeds 4.00 kg or $400.00, THEN THE Alchemist SHALL report it as unsplittable and exclude it from 4x4 boxes.
5. THE Alchemist SHALL compute net savings as General Regime cost of the single box minus the sum of flat fees ($20.00 per box), after `round2`.
6. IF the split yields no savings, THEN THE Alchemist SHALL recommend the single shipment and report savings of 0.00.
7. WHEN the cart contains items flagged by the Tariff Inquisitor, THE Alchemist SHALL include the warnings in its output.

### Requirement 5: Agent 3 Route Dispatcher

**User Story:** As an importer, I want to compare couriers and export my manifest.

#### Acceptance Criteria

1. THE Dispatcher SHALL compare Temu Direct, LaarBox and Upper using a configurable rate table.
2. THE Dispatcher SHALL return, per courier, the total cost for the recommended boxes and mark the cheapest option.
3. WHEN couriers tie on cost, THE Dispatcher SHALL pick deterministically by fixed courier order.
4. THE Dispatcher SHALL export a manifest containing boxes, items, totals and chosen courier.
5. THE Dispatcher SHALL generate a PhantasmTrack deep link (https://phantasm-track-hazel.vercel.app) encoding the manifest as URL-safe query parameters.

### Requirement 6: MCP Server & Kiro Crew Integration

**User Story:** As a Kiro Crew user, I want the agents callable as MCP tools.

#### Acceptance Criteria

1. THE MCP server SHALL expose the tool `analyze_cart_senae`, running ingestion, Tariff Inquisitor and threshold evaluation.
2. THE MCP server SHALL expose the tool `optimize_split_shipment`, running the Alchemist.
3. THE MCP server SHALL expose the tool `compare_ecuador_couriers`, running the Dispatcher.
4. THE MCP server SHALL validate tool inputs with JSON schemas and return structured errors for invalid input.
5. THE MCP server SHALL communicate over stdio using `@modelcontextprotocol/sdk`.
6. THE repository SHALL include a Kiro Crew manifest in `mcp-server/` describing the three agents and tool bindings.

### Requirement 7: Interactive Gothic Multi-Agent Command Center UI

**User Story:** As a user, I want a visual command center to run the crew.

#### Acceptance Criteria

1. THE UI SHALL support Spanish and English with a language toggle.
2. THE UI SHALL provide 1-click preset demo carts that load into the cart editor.
3. WHEN the user runs the crew, THE UI SHALL display a real-time execution trace showing each agent's start, output and completion in order.
4. THE UI SHALL display restrictions, tax comparison, split boxes, net savings and courier comparison.
5. THE UI SHALL use a dark gothic theme matching PhantasmTrack with accessible contrast and keyboard-operable controls.
6. THE UI SHALL provide an export button opening the PhantasmTrack deep link.

### Requirement 8: Property-Based Testing Invariants

**User Story:** As a maintainer, I want invariants verified automatically.

#### Acceptance Criteria

1. THE test suite SHALL use `fast-check` with Vitest.
2. THE suite SHALL verify P1: total weight and FOB are conserved across split boxes.
3. THE suite SHALL verify P2: each split box satisfies weight <= 4.00 kg and FOB <= $400.00 when items are individually within limits.
4. THE suite SHALL verify P3: taxes are non-negative, deterministic, and have at most 2 decimal places.
5. THE suite SHALL verify that net savings is never negative in the recommended plan.
6. THE suite SHALL run on `npx vitest run` with at least 100 runs per property.
