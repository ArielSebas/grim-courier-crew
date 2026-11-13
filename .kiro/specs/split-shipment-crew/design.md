# Design Document

## Overview

A pure-TypeScript pipeline of three agents, consumed by a Next.js UI and an MCP server.

```
Cart -> normalize (round2, lb->kg)
     -> Agent 1 Tariff Inquisitor  -> findings
     -> threshold evaluation       -> single-box cost
     -> Agent 2 Split Alchemist    -> boxes + net savings
     -> Agent 3 Route Dispatcher   -> courier comparison + manifest + deep link
```

Each agent emits trace events (`start`, `output`, `done`) used by the UI execution trace.

## Data Models

```ts
type Category = 'cosmetics' | 'supplements' | 'medicine' | 'phones' | 'routers' | 'general';

interface CartItem {
  id: string; name: string; category: Category;
  unitPriceUsd: number; weight: number; weightUnit: 'kg' | 'lb'; quantity: number;
}

interface Unit { itemId: string; name: string; weightKg: number; fobUsd: number; }

interface Finding { itemId: string; type: 'ARCSA' | 'ARCOTEL' | 'COMMERCIAL'; messageEs: string; messageEn: string; }

interface TaxBreakdown {
  regime: '4x4' | 'GENERAL';
  fobUsd: number; weightKg: number;
  flatFeeUsd: number; fodinfaUsd: number; adValoremUsd: number; ivaUsd: number; totalUsd: number;
}

interface Box { units: Unit[]; weightKg: number; fobUsd: number; tax: TaxBreakdown; }

interface SplitResult {
  boxes: Box[]; unsplittable: Unit[];
  singleBoxCostUsd: number; splitCostUsd: number; netSavingsUsd: number;
  recommendation: 'SPLIT' | 'SINGLE';
}

interface CourierQuote { courier: 'temu' | 'laarbox' | 'upper'; totalUsd: number; cheapest: boolean; }
```

## Tax Computation

- 4x4 eligible: total = 20.00.
- General: fodinfa = round2(0.005 * fob); adValorem = round2(0.20 * fob); iva = round2(0.15 * (fob + fodinfa + adValorem)); total = round2(sum of components).

## Bin-Packing Heuristic

Two-dimensional (weight, FOB) bin packing, solved with First-Fit Decreasing:
1. Expand items into unit-level entries (quantity -> units).
2. Units exceeding 4.00 kg or $400 go to `unsplittable`.
3. Sort remaining units by max(weight/4, fob/400) descending.
4. Place each unit in the first box where both limits still hold; otherwise open a new box.
5. Compute fees; net savings = single-box cost - split cost. If savings <= 0, recommend SINGLE with savings 0.00.

Comparison is done on rounded integers of cents to avoid float drift in limit checks.

## MCP Protocol Bindings

Server over stdio using `@modelcontextprotocol/sdk`. Tools (JSON Schema inputs, structured JSON outputs):
- `analyze_cart_senae` { items } -> normalized totals, findings, single-box tax
- `optimize_split_shipment` { items } -> SplitResult plus findings
- `compare_ecuador_couriers` { items, rates? } -> CourierQuote[] and deep link

Invalid input returns `isError: true` with a descriptive message. `mcp-server/crew-manifest.json` describes the three agents and maps them to tools.

## UI

Next.js App Router page with a language toggle (ES/EN), preset carts, cart editor, execution trace panel and result cards in a dark gothic Tailwind v4 theme.

## Correctness Properties

- P1 Conservation: for any cart, the sum of box weights and FOB values (plus unsplittable units) equals the cart totals within round2 tolerance.
- P2 Threshold compliance: when every unit is individually <= 4 kg and <= $400, every box has weight <= 4.00 kg and FOB <= $400.00.
- P3 Tax determinism: tax components are non-negative, identical for identical inputs, and equal to their own round2.

Additional: net savings in the recommended plan is >= 0.

## Testing Strategy

Vitest with fast-check arbitraries for carts (prices, weights in kg/lb, quantities), at least 100 runs per property, plus example tests for restrictions and courier ordering.
