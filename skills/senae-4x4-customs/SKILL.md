---
name: senae-4x4-customs
description: Ecuador SENAE Category B (4x4) courier rules versus the General Regime, with restricted-item checks for ARCSA and ARCOTEL.
triggers: [senae, 4x4, customs, aduana, arcsa, arcotel, temu, laarbox]
always: false
---

# SENAE Category B (4x4) Customs

## The rule

A courier shipment is Category B ("4x4") when both hold:
- Weight <= 4.00 kg
- FOB value <= $400.00 USD

An eligible shipment pays a flat fee of $20.00 USD.

## General Regime

If either limit is exceeded, the whole box pays:
- FODINFA: 0.5% of FOB
- Ad-Valorem: 20% of FOB
- IVA: 15% of (FOB + FODINFA + Ad-Valorem)

Combined, that is about 38.6% of FOB. Example: $460 FOB pays about $177.45.

## Restrictions to flag

- ARCSA: cosmetics, supplements and medicine may need sanitary notification when imported in bulk.
- ARCOTEL: phones and telecom equipment need a homologation check. Courier rules allow about 1 new unit per year.
- Commercial quantity: more than 3 identical units may be treated as a commercial import.
- Indivisible unit: a single unit over 4 kg or $400 forces the General Regime for its box.

## How to work

1. Use the `analyze_cart_senae` MCP tool. Do not compute taxes by hand.
2. Report alerts by code, then the single-box regime and tax.
3. If the cart exceeds 4x4, suggest the split-shipment-optimizer skill.
4. All money is rounded to 2 decimals with `round2`.

This is informational guidance, not legal or customs-broker advice. Confirm current rules with SENAE.
