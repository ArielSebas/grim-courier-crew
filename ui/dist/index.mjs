// GrimCourier Crew · Kiro Crew UI bundle (ESM).
// `react` and `@kirocrew/app-sdk` are runtime externals resolved by the Kiro Crew host.
// Mirrors ui/src/App.tsx without JSX so it can be committed as a ready-to-load artifact.
import React, { useEffect, useState } from 'react';
import { useAppApi, useAppEvents } from '@kirocrew/app-sdk';
import { Card, CardTitle, PageHeader, StatCard, Badge } from '@kirocrew/app-sdk/ui';

const h = React.createElement;

const AGENTS = [
  { name: 'tariff-inquisitor', label: 'Tariff Inquisitor' },
  { name: 'split-shipment-alchemist', label: 'Split-Shipment Alchemist' },
  { name: 'route-dispatcher', label: 'Route Dispatcher' },
];

const MCP_TOOLS = [
  'analyze_cart_senae',
  'optimize_split_shipment',
  'compare_ecuador_couriers',
  'run_grim_courier_crew',
];

// Reference scenario: 8 items, 5.8 kg, $460 FOB (PRESET_DEMO_CARTS.oversized_haul).
const REFERENCE = { singleBoxTax: 177.45, splitTax: 40, savings: 137.45, boxes: 2 };

const usd = (n) => `$${n.toFixed(2)}`;

export default function App() {
  const api = useAppApi();
  const [status, setStatus] = useState('Checking...');
  const [lastEvent, setLastEvent] = useState('No events yet');

  useAppEvents((event) => {
    setLastEvent((event && (event.message || event.type)) || 'event');
  });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(api && typeof api.get === 'function' ? api.get('/api/status') : undefined)
      .then(() => {
        if (!cancelled) setStatus('Online');
      })
      .catch(() => {
        if (!cancelled) setStatus('Unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const list = (items, render) =>
    h('ul', null, items.map((item) => h('li', { key: typeof item === 'string' ? item : item.name }, render(item))));

  return h(
    'div',
    { style: { padding: 24, display: 'grid', gap: 16 } },
    h(PageHeader, {
      title: 'GrimCourier Crew',
      description: 'SENAE 4x4 split-shipment oracle for Ecuadorian imports',
    }),
    h(
      'div',
      { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 } },
      h(StatCard, { label: 'Crew status', value: status }),
      h(StatCard, { label: 'Active agents', value: String(AGENTS.length) }),
      h(StatCard, { label: 'MCP tools', value: String(MCP_TOOLS.length) }),
      h(StatCard, { label: 'Reference savings', value: usd(REFERENCE.savings) }),
    ),
    h(
      Card,
      null,
      h(CardTitle, null, 'Agents'),
      list(AGENTS, (a) => [a.label + ' ', h(Badge, { key: a.name }, a.name)]),
    ),
    h(Card, null, h(CardTitle, null, 'MCP tools'), list(MCP_TOOLS, (t) => h('code', null, t))),
    h(
      Card,
      null,
      h(CardTitle, null, '4x4 optimization (reference haul)'),
      h(
        'p',
        null,
        `One box pays about ${usd(REFERENCE.singleBoxTax)} under the General Regime. ` +
          `Splitting into ${REFERENCE.boxes} 4x4 boxes pays ${usd(REFERENCE.splitTax)}, ` +
          `saving about ${usd(REFERENCE.savings)}.`,
      ),
    ),
    h(Card, null, h(CardTitle, null, 'Latest event'), h('p', null, lastEvent)),
  );
}

/** Returns the root element for the host to render at /apps/grim-courier-crew. */
export function mount() {
  return h(App);
}
