import { useEffect, useState } from 'react';
import { useAppApi, useAppEvents } from '@kirocrew/app-sdk';
import { Card, CardTitle, PageHeader, StatCard } from '@kirocrew/app-sdk/ui';

/**
 * Kiro Crew dashboard entry. Loaded by the Kiro Crew host (window.__kirocrew_modules).
 * NOTE: the useAppApi / useAppEvents call shapes below follow common conventions and
 * have not been checked against the installed @kirocrew/app-sdk version.
 */

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

// Reference scenario: 8 items, 5.8 kg, $460 FOB (see PRESET_DEMO_CARTS.oversized_haul).
const REFERENCE = { singleBoxTax: 177.45, splitTax: 40, savings: 137.45, boxes: 2 };

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function App() {
  const api = useAppApi() as { get?: (path: string) => Promise<unknown> };
  const [status, setStatus] = useState<string>('Checking...');
  const [lastEvent, setLastEvent] = useState<string>('No events yet');

  useAppEvents((event: { type?: string; message?: string }) => {
    setLastEvent(event.message ?? event.type ?? 'event');
  });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(api.get?.('/api/status'))
      .then(() => !cancelled && setStatus('Online'))
      .catch(() => !cancelled && setStatus('Unavailable'));
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <PageHeader
        title="GrimCourier Crew"
        description="SENAE 4x4 split-shipment oracle for Ecuadorian imports"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Crew status" value={status} />
        <StatCard label="Active agents" value={String(AGENTS.length)} />
        <StatCard label="MCP tools" value={String(MCP_TOOLS.length)} />
        <StatCard label="Reference savings" value={usd(REFERENCE.savings)} />
      </div>

      <Card>
        <CardTitle>Agents</CardTitle>
        <ul>
          {AGENTS.map((a) => (
            <li key={a.name}>
              {a.label} <code>{a.name}</code>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>MCP tools</CardTitle>
        <ul>
          {MCP_TOOLS.map((t) => (
            <li key={t}>
              <code>{t}</code>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>4x4 optimization (reference haul)</CardTitle>
        <p>
          One box pays about {usd(REFERENCE.singleBoxTax)} under the General Regime. Splitting into{' '}
          {REFERENCE.boxes} 4x4 boxes pays {usd(REFERENCE.splitTax)}, saving about {usd(REFERENCE.savings)}.
        </p>
      </Card>

      <Card>
        <CardTitle>Latest event</CardTitle>
        <p>{lastEvent}</p>
      </Card>
    </div>
  );
}
