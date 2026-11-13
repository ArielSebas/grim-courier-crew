# Tech Stack

- Next.js (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4, dark gothic theme matching PhantasmTrack
- Vitest + `fast-check` for Property-Based Testing
- `@modelcontextprotocol/sdk` for the MCP Server and Kiro Crew configuration

## Numeric Rules

### round2 (strict)
All monetary and weight outputs pass through a single `round2` helper for IEEE-754 safe rounding to 2 decimals:

```ts
export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;
```

- Never round intermediate values twice differently; round at each reported tax component and at totals.
- Never use raw `toFixed` for calculations.

### Weight conversion
```ts
export const LB_PER_KG = 2.20462; // 1 kg = 2.20462 lb
```
Convert lb to kg by dividing by `LB_PER_KG`, then apply `round2`.

## Constants
- 4x4 limits: 4.00 kg, $400.00 USD FOB, flat fee $20.00
- General Regime: FODINFA 0.5%, Ad-Valorem 20%, IVA 15%

## Testing
- Domain logic is covered by Vitest unit tests and fast-check properties.
- Run with `npx vitest run`.
