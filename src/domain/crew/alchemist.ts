import {
  AD_VALOREM_RATE,
  FODINFA_RATE,
  IVA_RATE,
  KG_TO_LB,
  SENAE_4X4_FLAT_FEE,
  SENAE_4X4_MAX_FOB,
  SENAE_4X4_MAX_KG,
  round2,
  type BoxTaxBreakdown,
  type CartItem,
  type ExpandedUnit,
  type SplitOptimizationResult,
} from './types';

/** Taxes for one box. Exempt 4x4 box pays a flat fee, otherwise the General Regime applies. */
export function calculateBoxTaxes(units: ExpandedUnit[], boxIndex: number): BoxTaxBreakdown {
  const totalWeightKg = round2(units.reduce((sum, u) => sum + u.weightKg, 0));
  const totalWeightLb = round2(totalWeightKg * KG_TO_LB);
  const totalFobUsd = round2(units.reduce((sum, u) => sum + u.priceUsd, 0));

  const base = { boxIndex, items: units, totalWeightKg, totalWeightLb, totalFobUsd };

  if (units.length === 0) {
    return {
      ...base,
      regime: '4X4_EXEMPT',
      flatFeeUsd: 0,
      fodinfaUsd: 0,
      adValoremUsd: 0,
      ivaUsd: 0,
      totalTaxesUsd: 0,
    };
  }

  if (totalWeightKg <= SENAE_4X4_MAX_KG && totalFobUsd <= SENAE_4X4_MAX_FOB) {
    return {
      ...base,
      regime: '4X4_EXEMPT',
      flatFeeUsd: SENAE_4X4_FLAT_FEE,
      fodinfaUsd: 0,
      adValoremUsd: 0,
      ivaUsd: 0,
      totalTaxesUsd: SENAE_4X4_FLAT_FEE,
    };
  }

  const fodinfaUsd = round2(totalFobUsd * FODINFA_RATE);
  const adValoremUsd = round2(totalFobUsd * AD_VALOREM_RATE);
  const ivaUsd = round2((totalFobUsd + fodinfaUsd + adValoremUsd) * IVA_RATE);
  return {
    ...base,
    regime: 'GENERAL_REGIME',
    flatFeeUsd: 0,
    fodinfaUsd,
    adValoremUsd,
    ivaUsd,
    totalTaxesUsd: round2(fodinfaUsd + adValoremUsd + ivaUsd),
  };
}

/** Expands each item into individual units so they can be distributed across boxes. */
export function expandCartItems(items: CartItem[]): ExpandedUnit[] {
  const units: ExpandedUnit[] = [];
  for (const item of items) {
    const count = Math.max(1, Math.floor(item.quantity));
    for (let i = 0; i < count; i++) {
      units.push({
        unitId: `${item.id}#${i + 1}`,
        itemId: item.id,
        name: item.name,
        category: item.category,
        weightKg: item.unitWeightKg,
        priceUsd: item.unitPriceUsd,
      });
    }
  }
  return units;
}

const fitScore = (u: ExpandedUnit): number =>
  Math.max(u.weightKg / SENAE_4X4_MAX_KG, u.priceUsd / SENAE_4X4_MAX_FOB);

const exceeds4x4 = (u: ExpandedUnit): boolean =>
  u.weightKg > SENAE_4X4_MAX_KG || u.priceUsd > SENAE_4X4_MAX_FOB;

/** Agent 2: First-Fit Decreasing bin packing into 4x4 boxes, compared against a single box. */
export function optimizeSplitShipment(items: CartItem[]): SplitOptimizationResult {
  const units = expandCartItems(items);
  const singleBoxBaseline = calculateBoxTaxes(units, 1);

  const oversize = units.filter(exceeds4x4);
  const packable = units.filter((u) => !exceeds4x4(u)).sort((a, b) => fitScore(b) - fitScore(a));

  const bins: { units: ExpandedUnit[]; kg: number; fob: number }[] = [];
  for (const unit of packable) {
    const bin = bins.find(
      (b) =>
        round2(b.kg + unit.weightKg) <= SENAE_4X4_MAX_KG &&
        round2(b.fob + unit.priceUsd) <= SENAE_4X4_MAX_FOB,
    );
    if (bin) {
      bin.units.push(unit);
      bin.kg = round2(bin.kg + unit.weightKg);
      bin.fob = round2(bin.fob + unit.priceUsd);
    } else {
      bins.push({ units: [unit], kg: unit.weightKg, fob: unit.priceUsd });
    }
  }

  const groups = [...bins.map((b) => b.units), ...oversize.map((u) => [u])];
  const splitBoxes = groups.map((g, i) => calculateBoxTaxes(g, i + 1));
  const totalOptimizedTaxesUsd = round2(splitBoxes.reduce((s, b) => s + b.totalTaxesUsd, 0));

  if (totalOptimizedTaxesUsd < singleBoxBaseline.totalTaxesUsd) {
    const netSavingsUsd = round2(singleBoxBaseline.totalTaxesUsd - totalOptimizedTaxesUsd);
    return {
      singleBoxBaseline,
      optimizedBoxes: splitBoxes,
      totalOptimizedTaxesUsd,
      netSavingsUsd,
      recommendation: 'SPLIT_RECOMMENDED',
      explanationEs: `Dividir en ${splitBoxes.length} cajas reduce los impuestos de $${singleBoxBaseline.totalTaxesUsd.toFixed(2)} a $${totalOptimizedTaxesUsd.toFixed(2)}. Ahorro neto: $${netSavingsUsd.toFixed(2)}.`,
      explanationEn: `Splitting into ${splitBoxes.length} boxes cuts taxes from $${singleBoxBaseline.totalTaxesUsd.toFixed(2)} to $${totalOptimizedTaxesUsd.toFixed(2)}. Net savings: $${netSavingsUsd.toFixed(2)}.`,
    };
  }

  return {
    singleBoxBaseline,
    optimizedBoxes: [singleBoxBaseline],
    totalOptimizedTaxesUsd: singleBoxBaseline.totalTaxesUsd,
    netSavingsUsd: 0,
    recommendation: 'KEEP_SINGLE_BOX',
    explanationEs: 'Dividir no reduce los impuestos. Se recomienda mantener una sola caja.',
    explanationEn: 'Splitting does not reduce taxes. Keeping a single box is recommended.',
  };
}
