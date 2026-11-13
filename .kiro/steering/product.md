# Product: GrimCourier Crew

GrimCourier Crew is a 3-agent customs and split-shipment optimization crew for Ecuadorian imports. It is the Multi-Agent Customs & Split-Shipment Intelligence Crew and MCP Server companion to the main app PhantasmTrack · GrimCourier (https://phantasm-track-hazel.vercel.app). Built for the Kiroween 2026 Hackathon (Best Kiro Crew App).

## SENAE Category B "4x4" Rule

- Eligible when weight <= 4.00 kg AND FOB value <= $400.00 USD.
- Eligible shipments pay a flat fee of $20.00 USD.
- Exceeding either limit triggers the General Regime:
  - 0.5% FODINFA
  - 20% Ad-Valorem
  - 15% IVA

## Agents

### Agent 1: The Tariff Inquisitor
Inspects every cart item and detects:
- Restricted items requiring ARCSA permits (cosmetics, supplements, medicine) or ARCOTEL permits (phones, routers).
- Commercial quantity alerts when more than 3 identical units are present.

### Agent 2: The Split-Shipment Alchemist
Mathematically partitions oversized carts into optimal 4x4 sub-shipments to avoid the General Regime tax penalty, and calculates the exact net USD savings versus the single-box General Regime cost.

### Agent 3: The Route Dispatcher & MCP Gateway
- Compares Temu Direct vs. LaarBox vs. Upper courier rates.
- Exports manifests to PhantasmTrack via deep link.
- Exposes the crew as MCP tools for Kiro Crew.

## Principles
- Deterministic, auditable money math (see tech.md rounding rule).
- Bilingual UX (ES/EN) with a dark gothic theme matching PhantasmTrack.
