import {
  SENAE_4X4_MAX_FOB,
  SENAE_4X4_MAX_KG,
  type CartItem,
  type SenaeAlert,
} from './types';

/** Agent 1: The Tariff Inquisitor. Detects SENAE restrictions and risk flags. */
export function runTariffInquisitor(items: CartItem[]): SenaeAlert[] {
  const alerts: SenaeAlert[] = [];

  for (const item of items) {
    const base = { itemId: item.id, itemName: item.name };

    if (item.category === 'cosmetics_supplements') {
      alerts.push({
        ...base,
        severity: 'WARNING',
        code: 'ARCSA_PERMIT',
        messageEs: `"${item.name}" requiere notificación sanitaria ARCSA en Ecuador si se importa en volumen.`,
        messageEn: `"${item.name}" requires ARCSA sanitary notification in Ecuador if imported in bulk.`,
      });
    }

    if (item.category === 'electronics_telecom') {
      alerts.push({
        ...base,
        severity: 'WARNING',
        code: 'ARCOTEL_HOMOLOGATION',
        messageEs: `"${item.name}" es equipo de telecomunicaciones: requiere verificación ARCOTEL y máximo 1 unidad nueva por año bajo las reglas de courier.`,
        messageEn: `"${item.name}" is telecom equipment: requires ARCOTEL check and max 1 new unit per year under courier rules.`,
      });
    }

    if (item.quantity > 3) {
      alerts.push({
        ...base,
        severity: 'WARNING',
        code: 'COMMERCIAL_QUANTITY',
        messageEs: `Más de 3 unidades idénticas de "${item.name}" (${item.quantity}) pueden ser consideradas importación comercial por el SENAE.`,
        messageEn: `More than 3 identical units of "${item.name}" (${item.quantity}) may be flagged by SENAE as a commercial import.`,
      });
    }

    if (item.unitWeightKg > SENAE_4X4_MAX_KG || item.unitPriceUsd > SENAE_4X4_MAX_FOB) {
      alerts.push({
        ...base,
        severity: 'CRITICAL',
        code: 'UNIT_EXCEEDS_4X4',
        messageEs: `Una sola unidad de "${item.name}" excede los límites 4x4 (4 kg / $400) y fuerza el Régimen General.`,
        messageEn: `A single indivisible unit of "${item.name}" exceeds the 4x4 limits (4 kg / $400) and forces the General Regime.`,
      });
    }
  }

  return alerts;
}
