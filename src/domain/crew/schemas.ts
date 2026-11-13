import { z } from 'zod';

/** Input limits. They bound the work the bin-packing step can be asked to do. */
export const LIMITS = {
  maxNameLength: 100,
  maxUnitWeightKg: 500,
  maxUnitPriceUsd: 50_000,
  maxQuantityPerItem: 100,
  maxItems: 50,
  maxTotalUnits: 100,
} as const;

// C0 and C1 control characters (includes \n, \r, \t, NUL and DEL).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

/** Removes control characters, then trims. Used by the schema and safe to reuse in the UI. */
export function sanitizeName(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').trim();
}

/**
 * Item name: control characters stripped, trimmed, 1 to 100 characters.
 * `.overwrite()` keeps the type as string, so MCP can still describe it as JSON Schema.
 */
const nameSchema = z
  .string()
  .max(1000) // reject huge strings before any processing
  .overwrite(sanitizeName)
  .min(1)
  .max(LIMITS.maxNameLength);

export const cartItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: nameSchema,
  unitWeightKg: z.number().gt(0).max(LIMITS.maxUnitWeightKg),
  unitPriceUsd: z.number().min(0).max(LIMITS.maxUnitPriceUsd),
  quantity: z.number().int().min(1).max(LIMITS.maxQuantityPerItem),
  category: z.enum([
    'general',
    'electronics_telecom',
    'cosmetics_supplements',
    'apparel',
    'home_goods',
  ]),
});

/** Total number of units after expanding quantities (what the packer actually iterates over). */
export function countExpandedUnits(items: { quantity: number }[]): number {
  return items.reduce((sum, i) => sum + Math.max(1, Math.floor(i.quantity)), 0);
}

export const cartSchema = z
  .array(cartItemSchema)
  .min(1)
  .max(LIMITS.maxItems)
  .refine((items) => countExpandedUnits(items) <= LIMITS.maxTotalUnits, {
    message: `A cart can contain at most ${LIMITS.maxTotalUnits} units in total.`,
  });

export const PRESET_IDS = ['oversized_haul', 'restricted_tech', 'safe_micro_haul'] as const;
export const presetIdSchema = z.enum(PRESET_IDS);
