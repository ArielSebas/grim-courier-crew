import { z } from 'zod';

/** Input validation for carts. Bounds keep unit expansion small and predictable. */
export const cartItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  unitWeightKg: z.number().positive().max(1000),
  unitPriceUsd: z.number().positive().max(1_000_000),
  quantity: z.number().int().min(1).max(100),
  category: z.enum([
    'general',
    'electronics_telecom',
    'cosmetics_supplements',
    'apparel',
    'home_goods',
  ]),
});

export const cartSchema = z.array(cartItemSchema).min(1).max(50);

export const PRESET_IDS = ['oversized_haul', 'restricted_tech', 'safe_micro_haul'] as const;
export const presetIdSchema = z.enum(PRESET_IDS);
