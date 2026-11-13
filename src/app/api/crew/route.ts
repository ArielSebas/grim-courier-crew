import { PRESET_DEMO_CARTS, runGrimCourierCrew } from '../../../domain/crew/dispatcher';
import { PRESET_IDS, cartSchema, presetIdSchema } from '../../../domain/crew/schemas';
import { z } from 'zod';

const MAX_BODY_BYTES = 32 * 1024; // 50 items with 100-char names fit well under this
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 10_000;

const bodySchema = z
  .object({
    presetId: presetIdSchema.optional(),
    items: cartSchema.optional(),
  })
  .strict();

/**
 * Fixed-window, in-memory rate limiter.
 * Per server instance only: on serverless or multi-instance deploys each instance
 * has its own counters. Use a shared store (e.g. Redis) for a hard global limit.
 */
const hits = new Map<string, { count: number; windowStart: number }>();

function clientIp(request: Request): string {
  // On Vercel the platform sets x-forwarded-for; elsewhere it may be client-supplied.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip ? ip.slice(0, 64) : 'unknown';
}

function rateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Drop expired windows so the map cannot grow without bound.
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [key, entry] of hits) {
      if (now - entry.windowStart >= RATE_WINDOW_MS) hits.delete(key);
    }
    if (hits.size > MAX_TRACKED_IPS) hits.clear();
  }

  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.windowStart + RATE_WINDOW_MS - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

const error = (message: string, status: number, headers?: Record<string, string>) =>
  Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

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
  try {
    const limit = rateLimit(clientIp(request));
    if (!limit.allowed) {
      return error('Too many requests. Try again later.', 429, { 'Retry-After': String(limit.retryAfterSec) });
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return error('Content-Type must be application/json.', 415);
    }

    // Reject early on the declared size, then re-check the real size (the header can lie).
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return error('Payload too large.', 413);
    }
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
      return error('Payload too large.', 413);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return error('Invalid JSON body.', 400);
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      // Only path and message: no input values echoed back.
      const issues = parsed.error.issues.slice(0, 10).map((i) => ({ path: i.path.join('.'), message: i.message }));
      return Response.json({ error: 'Invalid request.', issues }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const { presetId, items } = parsed.data;
    const cart = items ?? (presetId ? PRESET_DEMO_CARTS[presetId].items : undefined);
    if (!cart) {
      return error('Provide either "items" or a valid "presetId".', 400);
    }

    return Response.json(runGrimCourierCrew(cart, new Date().toISOString()), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    // Log server-side only; the client gets a generic message without stack traces.
    console.error('[api/crew] unexpected error', err);
    return error('Internal server error.', 500);
  }
}
