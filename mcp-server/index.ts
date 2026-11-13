import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { calculateBoxTaxes, expandCartItems, optimizeSplitShipment } from '../src/domain/crew/alchemist';
import { PRESET_DEMO_CARTS, runGrimCourierCrew } from '../src/domain/crew/dispatcher';
import { runTariffInquisitor } from '../src/domain/crew/inquisitor';
import { cartSchema, presetIdSchema } from '../src/domain/crew/schemas';
import type { CartItem } from '../src/domain/crew/types';

const server = new McpServer({ name: 'grim-courier-mcp', version: '1.0.0' });

const itemsInput = { items: cartSchema.describe('Cart items. Quantity is expanded into individual units.') };

const json = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

server.registerTool(
  'analyze_cart_senae',
  {
    title: 'Analyze cart under SENAE rules',
    description:
      'Agent 1 (Tariff Inquisitor): detects ARCSA/ARCOTEL restrictions, commercial quantities and units over 4x4 limits, and returns the single-box tax.',
    inputSchema: itemsInput,
  },
  async ({ items }) => {
    const alerts = runTariffInquisitor(items);
    const singleBox = calculateBoxTaxes(expandCartItems(items), 1);
    return json({ status: alerts.length > 0 ? 'ALERTS_FOUND' : 'CLEAR', alerts, singleBox });
  },
);

server.registerTool(
  'optimize_split_shipment',
  {
    title: 'Optimize split shipment',
    description:
      'Agent 2 (Split-Shipment Alchemist): First-Fit Decreasing packing into 4x4 boxes with exact net USD savings.',
    inputSchema: itemsInput,
  },
  async ({ items }) => json(optimizeSplitShipment(items)),
);

server.registerTool(
  'compare_ecuador_couriers',
  {
    title: 'Compare Ecuador couriers',
    description:
      'Agent 3 (Route Dispatcher): compares Temu Direct, LaarBox and Upper for each optimized box and returns PhantasmTrack deep links.',
    inputSchema: itemsInput,
  },
  async ({ items }) => {
    const report = runGrimCourierCrew(items, new Date().toISOString());
    return json(report.agent3Dispatcher);
  },
);

server.registerTool(
  'run_grim_courier_crew',
  {
    title: 'Run the full GrimCourier Crew',
    description:
      'Runs all 3 agents. Provide either items or a presetId (oversized_haul, restricted_tech, safe_micro_haul).',
    inputSchema: {
      items: cartSchema.optional(),
      presetId: presetIdSchema.optional(),
    },
  },
  async ({ items, presetId }) => {
    const cart: CartItem[] | undefined = items ?? (presetId ? PRESET_DEMO_CARTS[presetId].items : undefined);
    if (!cart) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'Provide either "items" or a valid "presetId".' }],
      };
    }
    return json(runGrimCourierCrew(cart, new Date().toISOString()));
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is reserved for the MCP protocol, so log to stderr.
  console.error('grim-courier-mcp running on stdio');
}

main().catch((err) => {
  console.error('Fatal MCP error:', err);
  process.exit(1);
});
