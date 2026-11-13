import { PRESET_DEMO_CARTS, runGrimCourierCrew } from '../../../domain/crew/dispatcher';
import { PRESET_IDS, cartSchema, presetIdSchema } from '../../../domain/crew/schemas';
import { z } from 'zod';

const bodySchema = z.object({
  presetId: presetIdSchema.optional(),
  items: cartSchema.optional(),
});

export async function GET() {
  return Response.json({
    app: {
      name: 'grim-courier-crew',
      version: '1.0.0',
      displayName: 'GrimCourier Crew · SENAE 4x4 Split-Shipment Oracle',
      manifest: 'app.json',
    },
    agents: ['tariff-inquisitor', 'split-shipment-alchemist', 'route-dispatcher'],
    skills: ['senae-4x4-customs', 'split-shipment-optimizer'],
    mcpTools: [
      'analyze_cart_senae',
      'optimize_split_shipment',
      'compare_ecuador_couriers',
      'run_grim_courier_crew',
    ],
    presets: PRESET_IDS.map((id) => ({
      id,
      labelEs: PRESET_DEMO_CARTS[id].labelEs,
      labelEn: PRESET_DEMO_CARTS[id].labelEn,
    })),
  });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request.', issues: parsed.error.issues }, { status: 400 });
  }

  const { presetId, items } = parsed.data;
  const cart = items ?? (presetId ? PRESET_DEMO_CARTS[presetId].items : undefined);
  if (!cart) {
    return Response.json({ error: 'Provide either "items" or a valid "presetId".' }, { status: 400 });
  }

  return Response.json(runGrimCourierCrew(cart, new Date().toISOString()));
}
