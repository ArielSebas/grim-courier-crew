export const KG_TO_LB = 2.20462;
export const SENAE_4X4_MAX_KG = 4.0;
export const SENAE_4X4_MAX_FOB = 400.0;
export const SENAE_4X4_FLAT_FEE = 20.0;
export const FODINFA_RATE = 0.005;
export const AD_VALOREM_RATE = 0.2;
export const IVA_RATE = 0.15;

/** IEEE-754 safe rounding to 2 decimals. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type ItemCategory =
  | 'general'
  | 'electronics_telecom'
  | 'cosmetics_supplements'
  | 'apparel'
  | 'home_goods';

export interface CartItem {
  id: string;
  name: string;
  unitWeightKg: number;
  unitPriceUsd: number;
  quantity: number;
  category: ItemCategory;
}

/** A single physical unit derived from a CartItem quantity, so units can be split across boxes. */
export interface ExpandedUnit {
  unitId: string;
  itemId: string;
  name: string;
  category: ItemCategory;
  weightKg: number;
  priceUsd: number;
}

export interface SenaeAlert {
  itemId: string;
  itemName: string;
  severity: 'WARNING' | 'CRITICAL';
  code: 'ARCSA_PERMIT' | 'ARCOTEL_HOMOLOGATION' | 'COMMERCIAL_QUANTITY' | 'UNIT_EXCEEDS_4X4';
  messageEs: string;
  messageEn: string;
}

export interface BoxTaxBreakdown {
  boxIndex: number;
  items: ExpandedUnit[];
  totalWeightKg: number;
  totalWeightLb: number;
  totalFobUsd: number;
  regime: '4X4_EXEMPT' | 'GENERAL_REGIME';
  flatFeeUsd: number;
  fodinfaUsd: number;
  adValoremUsd: number;
  ivaUsd: number;
  totalTaxesUsd: number;
}

export interface SplitOptimizationResult {
  singleBoxBaseline: BoxTaxBreakdown;
  optimizedBoxes: BoxTaxBreakdown[];
  totalOptimizedTaxesUsd: number;
  netSavingsUsd: number;
  recommendation: 'SPLIT_RECOMMENDED' | 'KEEP_SINGLE_BOX';
  explanationEs: string;
  explanationEn: string;
}

export interface CourierQuote {
  courierId: 'TEMU_DIRECT' | 'LAARBOX' | 'UPPER';
  courierName: string;
  freightUsd: number;
  customsTaxesUsd: number;
  totalLandedCostUsd: number;
  estimatedDays: string;
  recommended: boolean;
}

export interface CrewExecutionReport {
  timestamp: string;
  totalItemsCount: number;
  totalWeightKg: number;
  totalFobUsd: number;
  agent1Inquisitor: {
    status: 'CLEAR' | 'ALERTS_FOUND';
    alerts: SenaeAlert[];
    summaryEs: string;
    summaryEn: string;
  };
  agent2Alchemist: SplitOptimizationResult;
  agent3Dispatcher: {
    boxRoutes: {
      boxIndex: number;
      quotes: CourierQuote[];
      bestQuote: CourierQuote;
      phantasmTrackUrl: string;
    }[];
    totalOptimalLandedCostUsd: number;
    summaryEs: string;
    summaryEn: string;
  };
}
