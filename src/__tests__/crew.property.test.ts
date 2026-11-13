import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { optimizeSplitShipment } from '@/domain/crew/alchemist';
import { PRESET_DEMO_CARTS, runGrimCourierCrew } from '@/domain/crew/dispatcher';
import { runTariffInquisitor } from '@/domain/crew/inquisitor';
import {
  round2,
  type CartItem,
  type ItemCategory,
} from '@/domain/crew/types';

const NUM_RUNS = 100;

const categoryArb = fc.constantFrom<ItemCategory>(
  'general',
  'electronics_telecom',
  'cosmetics_supplements',
  'apparel',
  'home_goods',
);

/** Builds a cart arbitrary. Weights and prices are generated in cents to stay on a 2-decimal grid. */
const cartArb = (maxWeightKg: number, maxPriceUsd: number) =>
  fc
    .array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 12 }),
        unitWeightKg: fc.integer({ min: 1, max: maxWeightKg * 100 }).map((n) => n / 100),
        unitPriceUsd: fc.integer({ min: 1, max: maxPriceUsd * 100 }).map((n) => n / 100),
        quantity: fc.integer({ min: 1, max: 5 }),
        category: categoryArb,
      }),
      { minLength: 1, maxLength: 8 },
    )
    .map((rows): CartItem[] => rows.map((r, i) => ({ id: `item-${i}`, ...r })));

/** Any cart, including units that exceed the 4x4 limits. */
const anyCartArb = cartArb(6, 700);
/** Carts where every individual unit fits a 4x4 box. */
const fittingCartArb = cartArb(4, 400);

describe('P1: conservation of mass and value', () => {
  it('weight and FOB across optimizedBoxes match the single-box baseline', () => {
    fc.assert(
      fc.property(anyCartArb, (items) => {
        const result = optimizeSplitShipment(items);
        const boxes = result.optimizedBoxes;
        const tolerance = 0.01 * boxes.length;
        const kg = boxes.reduce((s, b) => s + b.totalWeightKg, 0);
        const fob = boxes.reduce((s, b) => s + b.totalFobUsd, 0);
        expect(Math.abs(round2(kg) - result.singleBoxBaseline.totalWeightKg)).toBeLessThanOrEqual(tolerance);
        expect(Math.abs(round2(fob) - result.singleBoxBaseline.totalFobUsd)).toBeLessThanOrEqual(tolerance);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('no unit is lost or duplicated', () => {
    fc.assert(
      fc.property(anyCartArb, (items) => {
        const result = optimizeSplitShipment(items);
        const ids = result.optimizedBoxes.flatMap((b) => b.items.map((u) => u.unitId)).sort();
        const expected = result.singleBoxBaseline.items.map((u) => u.unitId).sort();
        expect(ids).toEqual(expected);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('P2: 4x4 exemption compliance', () => {
  it('every box of a recommended split is a valid 4x4 box when all units fit individually', () => {
    fc.assert(
      fc.property(fittingCartArb, (items) => {
        const result = optimizeSplitShipment(items);
        if (result.recommendation === 'SPLIT_RECOMMENDED') {
          for (const box of result.optimizedBoxes) {
            expect(box.totalWeightKg).toBeLessThanOrEqual(4.0);
            expect(box.totalFobUsd).toBeLessThanOrEqual(400.0);
            expect(box.regime).toBe('4X4_EXEMPT');
          }
        } else {
          // Splitting was not cheaper (e.g. heavy but low-value cart): the single box is kept as is.
          expect(result.optimizedBoxes).toEqual([result.singleBoxBaseline]);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('P3: non-negative savings invariant', () => {
  it('never reports negative savings or a plan costlier than the baseline', () => {
    fc.assert(
      fc.property(anyCartArb, (items) => {
        const result = optimizeSplitShipment(items);
        expect(result.netSavingsUsd).toBeGreaterThanOrEqual(0);
        expect(result.totalOptimizedTaxesUsd).toBeLessThanOrEqual(result.singleBoxBaseline.totalTaxesUsd);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('tax values are non-negative and already rounded to 2 decimals', () => {
    fc.assert(
      fc.property(anyCartArb, (items) => {
        const result = optimizeSplitShipment(items);
        for (const box of [result.singleBoxBaseline, ...result.optimizedBoxes]) {
          for (const v of [box.flatFeeUsd, box.fodinfaUsd, box.adValoremUsd, box.ivaUsd, box.totalTaxesUsd]) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(round2(v)).toBe(v);
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('PRESET_DEMO_CARTS', () => {
  it('oversized_haul splits into 2 exempt boxes and saves money', () => {
    const result = optimizeSplitShipment(PRESET_DEMO_CARTS.oversized_haul.items);

    expect(result.singleBoxBaseline.totalWeightKg).toBe(5.8);
    expect(result.singleBoxBaseline.totalFobUsd).toBe(460);
    expect(result.singleBoxBaseline.regime).toBe('GENERAL_REGIME');
    // 1 cent tolerance: IVA is 15% of 554.30 = 83.145, so rounding may land on 83.14 or 83.15.
    expect(result.singleBoxBaseline.totalTaxesUsd).toBeCloseTo(177.45, 1);

    expect(result.recommendation).toBe('SPLIT_RECOMMENDED');
    expect(result.optimizedBoxes).toHaveLength(2);
    for (const box of result.optimizedBoxes) {
      expect(box.regime).toBe('4X4_EXEMPT');
      expect(box.totalWeightKg).toBeLessThanOrEqual(4.0);
      expect(box.totalFobUsd).toBeLessThanOrEqual(400.0);
    }
    expect(result.totalOptimizedTaxesUsd).toBe(40);
    expect(result.netSavingsUsd).toBeCloseTo(137.45, 1);
  });

  it('restricted_tech triggers ARCSA, ARCOTEL and commercial quantity alerts', () => {
    const codes = runTariffInquisitor(PRESET_DEMO_CARTS.restricted_tech.items).map((a) => a.code);
    expect(codes).toContain('ARCSA_PERMIT');
    expect(codes).toContain('ARCOTEL_HOMOLOGATION');
    expect(codes).toContain('COMMERCIAL_QUANTITY');

    const report = runGrimCourierCrew(PRESET_DEMO_CARTS.restricted_tech.items);
    expect(report.agent1Inquisitor.status).toBe('ALERTS_FOUND');
  });

  it('safe_micro_haul stays in a single exempt box', () => {
    const result = optimizeSplitShipment(PRESET_DEMO_CARTS.safe_micro_haul.items);
    expect(result.singleBoxBaseline.totalWeightKg).toBe(1.8);
    expect(result.singleBoxBaseline.totalFobUsd).toBe(145);
    expect(result.recommendation).toBe('KEEP_SINGLE_BOX');
    expect(result.optimizedBoxes).toHaveLength(1);
    expect(result.optimizedBoxes[0].regime).toBe('4X4_EXEMPT');
    expect(result.netSavingsUsd).toBe(0);
    expect(runTariffInquisitor(PRESET_DEMO_CARTS.safe_micro_haul.items)).toHaveLength(0);
  });
});
