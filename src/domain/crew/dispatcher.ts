import { expandCartItems, optimizeSplitShipment } from './alchemist';
import { runTariffInquisitor } from './inquisitor';
import {
  round2,
  type BoxTaxBreakdown,
  type CartItem,
  type CourierQuote,
  type CrewExecutionReport,
} from './types';

const PHANTASM_TRACK_BASE_URL = 'https://phantasm-track-hazel.vercel.app/';

/** Agent 3: compares the three couriers for one box. Ties resolve by fixed courier order. */
export function compareCouriersForBox(box: BoxTaxBreakdown): {
  quotes: CourierQuote[];
  bestQuote: CourierQuote;
  phantasmTrackUrl: string;
} {
  const billableLb = Math.max(box.totalWeightLb, 1);
  const make = (
    courierId: CourierQuote['courierId'],
    courierName: string,
    freightUsd: number,
    estimatedDays: string,
  ): CourierQuote => ({
    courierId,
    courierName,
    freightUsd,
    customsTaxesUsd: box.totalTaxesUsd,
    totalLandedCostUsd: round2(freightUsd + box.totalTaxesUsd),
    estimatedDays,
    recommended: false,
  });

  const quotes: CourierQuote[] = [
    make('TEMU_DIRECT', 'Temu Direct', 0, '12-18 days'),
    make('LAARBOX', 'LaarBox', round2(billableLb * 6.5), '5-8 days'),
    make('UPPER', 'Upper', round2(billableLb * 5.9), '6-10 days'),
  ];

  let best = quotes[0];
  for (const q of quotes) {
    if (q.totalLandedCostUsd < best.totalLandedCostUsd) best = q;
  }
  best.recommended = true;

  const names = box.items.slice(0, 3).map((i) => i.name).join(', ');
  const params = new URLSearchParams({
    fromCrew: '1',
    boxIndex: String(box.boxIndex),
    weightKg: String(box.totalWeightKg),
    fobUsd: String(box.totalFobUsd),
    regime: box.regime,
    courier: best.courierId,
    missionName: `Crew Box #${box.boxIndex}: ${names}${box.items.length > 3 ? '...' : ''}`,
  });
  const phantasmTrackUrl = `${PHANTASM_TRACK_BASE_URL}?${params.toString()}`;
  return { quotes, bestQuote: best, phantasmTrackUrl };
}

/** Runs Agent 1, Agent 2 and Agent 3 in sequence and returns the combined report. */
export function runGrimCourierCrew(
  items: CartItem[],
  timestamp: string = '2026-11-13T00:00:00.000Z',
): CrewExecutionReport {
  const units = expandCartItems(items);
  const totalWeightKg = round2(units.reduce((s, u) => s + u.weightKg, 0));
  const totalFobUsd = round2(units.reduce((s, u) => s + u.priceUsd, 0));

  const alerts = runTariffInquisitor(items);
  const agent2Alchemist = optimizeSplitShipment(items);

  const boxRoutes = agent2Alchemist.optimizedBoxes.map((box) => ({
    boxIndex: box.boxIndex,
    ...compareCouriersForBox(box),
  }));
  const totalOptimalLandedCostUsd = round2(
    boxRoutes.reduce((s, r) => s + r.bestQuote.totalLandedCostUsd, 0),
  );

  return {
    timestamp,
    totalItemsCount: units.length,
    totalWeightKg,
    totalFobUsd,
    agent1Inquisitor: {
      status: alerts.length > 0 ? 'ALERTS_FOUND' : 'CLEAR',
      alerts,
      summaryEs:
        alerts.length > 0
          ? `El Inquisidor encontró ${alerts.length} alerta(s) SENAE.`
          : 'El Inquisidor no encontró restricciones.',
      summaryEn:
        alerts.length > 0
          ? `The Inquisitor found ${alerts.length} SENAE alert(s).`
          : 'The Inquisitor found no restrictions.',
    },
    agent2Alchemist,
    agent3Dispatcher: {
      boxRoutes,
      totalOptimalLandedCostUsd,
      summaryEs: `El Despachador planificó ${boxRoutes.length} caja(s). Costo total puesto en destino: $${totalOptimalLandedCostUsd.toFixed(2)}.`,
      summaryEn: `The Dispatcher routed ${boxRoutes.length} box(es). Total landed cost: $${totalOptimalLandedCostUsd.toFixed(2)}.`,
    },
  };
}

export const PRESET_DEMO_CARTS: Record<
  'oversized_haul' | 'restricted_tech' | 'safe_micro_haul',
  { labelEs: string; labelEn: string; items: CartItem[] }
> = {
  // 8 items, 5.8 kg, $460 FOB. One box triggers the General Regime; FFD splits it into 2 valid 4x4 boxes.
  oversized_haul: {
    labelEs: 'El botín sobredimensionado ($460 / 5.8 kg)',
    labelEn: 'The Oversized Haul ($460 / 5.8 kg)',
    items: [
      { id: 'sneakers', name: 'Sneakers', unitWeightKg: 1.1, unitPriceUsd: 85, quantity: 1, category: 'apparel' },
      { id: 'jacket', name: 'Winter Jacket', unitWeightKg: 1.3, unitPriceUsd: 95, quantity: 1, category: 'apparel' },
      { id: 'backpack', name: 'Backpack', unitWeightKg: 0.9, unitPriceUsd: 60, quantity: 1, category: 'general' },
      { id: 'headphones', name: 'Headphones', unitWeightKg: 0.5, unitPriceUsd: 70, quantity: 1, category: 'general' },
      { id: 'watch', name: 'Wrist Watch', unitWeightKg: 0.3, unitPriceUsd: 55, quantity: 1, category: 'general' },
      { id: 'hoodie', name: 'Hoodie', unitWeightKg: 0.8, unitPriceUsd: 45, quantity: 1, category: 'apparel' },
      { id: 'jeans', name: 'Jeans', unitWeightKg: 0.6, unitPriceUsd: 30, quantity: 1, category: 'apparel' },
      { id: 'cap', name: 'Cap', unitWeightKg: 0.3, unitPriceUsd: 20, quantity: 1, category: 'apparel' },
    ],
  },
  // Triggers ARCSA (cosmetics), ARCOTEL (smartphone) and COMMERCIAL_QUANTITY (4 cables).
  restricted_tech: {
    labelEs: 'Tecnología restringida',
    labelEn: 'Restricted Tech Mix',
    items: [
      { id: 'serum', name: 'Vitamin C Serum', unitWeightKg: 0.2, unitPriceUsd: 28, quantity: 1, category: 'cosmetics_supplements' },
      { id: 'phone', name: 'Smartphone', unitWeightKg: 0.5, unitPriceUsd: 180, quantity: 1, category: 'electronics_telecom' },
      { id: 'cable', name: 'USB-C Cable', unitWeightKg: 0.1, unitPriceUsd: 6, quantity: 4, category: 'general' },
    ],
  },
  // 1.8 kg, $145 FOB. Fits a single 4x4 box.
  safe_micro_haul: {
    labelEs: 'Micro envío seguro ($145 / 1.8 kg)',
    labelEn: 'Safe Micro Haul ($145 / 1.8 kg)',
    items: [
      { id: 'shoes', name: 'Running Shoes', unitWeightKg: 0.9, unitPriceUsd: 65, quantity: 1, category: 'apparel' },
      { id: 'shirt', name: 'T-Shirt', unitWeightKg: 0.4, unitPriceUsd: 30, quantity: 1, category: 'apparel' },
      { id: 'wallet', name: 'Wallet', unitWeightKg: 0.2, unitPriceUsd: 20, quantity: 1, category: 'general' },
      { id: 'sunglasses', name: 'Sunglasses', unitWeightKg: 0.3, unitPriceUsd: 30, quantity: 1, category: 'general' },
    ],
  },
};
