---
name: split-shipment-optimizer
description: Splits an oversized cart into several SENAE 4x4 boxes using First-Fit Decreasing bin packing to cut customs taxes.
triggers: [split, box, optimize, dividir, cajas, ahorro, fodinfa]
always: false
---

# Split-Shipment Optimizer

## Why splitting saves money

One box over 4 kg or $400 pays the General Regime (about 38.6% of FOB). Several boxes that each stay within 4x4 pay only $20 each. Splitting wins when `boxes * $20` is lower than the single-box tax.

## Algorithm: First-Fit Decreasing (2 dimensions)

1. Expand each item into individual units (quantity 3 becomes 3 units).
2. Units that alone exceed 4 kg or $400 get their own General Regime box.
3. Sort the rest by `max(weight / 4, price / 400)`, largest first.
4. Put each unit into the first box where weight stays <= 4.00 kg and FOB stays <= $400.00. Open a new box if none fits.
5. Compute each box's tax and the net savings versus the single box.
6. If splitting is not cheaper, keep the single box with savings of 0.

## Example

8 items, 5.8 kg, $460 FOB. One box pays about $177.45. Two 4x4 boxes pay $40. Net savings are about $137.45.

## How to work

1. Call the `optimize_split_shipment` MCP tool. Do not do the arithmetic by hand.
2. Show each box, the total optimized tax and the net savings.
3. Heavy, low-value carts may not benefit: many boxes can cost more than the General Regime tax.
4. FFD is a heuristic. It is not guaranteed to find the minimum number of boxes.
5. Hand off to the route-dispatcher agent for courier comparison.
