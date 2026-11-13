"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { optimizeSplitShipment } from "@/domain/crew/alchemist";
import { PRESET_DEMO_CARTS, runGrimCourierCrew } from "@/domain/crew/dispatcher";
import { cartItemSchema } from "@/domain/crew/schemas";
import type {
  BoxTaxBreakdown,
  CartItem,
  ItemCategory,
  SenaeAlert,
} from "@/domain/crew/types";

type Lang = "es" | "en";
type PresetId = keyof typeof PRESET_DEMO_CARTS;

const PHANTASM_URL = "https://phantasm-track-hazel.vercel.app";
const CATEGORIES: ItemCategory[] = [
  "general",
  "electronics_telecom",
  "cosmetics_supplements",
  "apparel",
  "home_goods",
];

const usd = (n: number) => `$${n.toFixed(2)}`;

// Savings shown on the demo button are computed by the engine, not hardcoded.
const OVERSIZED_SAVINGS = optimizeSplitShipment(PRESET_DEMO_CARTS.oversized_haul.items).netSavingsUsd;

const T = {
  es: {
    title: "🦅 GrimCourier Crew · App Kiro Crew y Servidor MCP",
    subtitle: "Oráculo multiagente de envíos divididos SENAE 4x4 (Kiroween 2026)",
    openGrimoire: "🎃 Abrir Grimorio PhantasmTrack",
    presets: "Escenarios de demostración (1 clic)",
    demo1: `📦 Demo 1: $460 / 5.8kg Botín sobredimensionado (¡Ahorra ${usd(OVERSIZED_SAVINGS)} USD!)`,
    demo2: "🚨 Demo 2: Tecnología restringida y cosméticos (ARCSA + ARCOTEL + Alertas comerciales)",
    demo3: "✅ Demo 3: Micro-envío seguro 4x4 (1.8kg / $145 USD)",
    cart: "Carrito",
    emptyCart: "El carrito está vacío. Elige una demo o agrega un artículo.",
    colName: "Artículo",
    colWeight: "Peso/u (kg)",
    colPrice: "Precio/u (USD)",
    colQty: "Cant.",
    colCategory: "Categoría",
    remove: "Quitar",
    addItem: "Agregar artículo",
    add: "Agregar",
    totals: "Totales",
    trace: "Traza de ejecución",
    a1: "🕵️‍♂️ Agente 1: El Inquisidor Arancelario",
    a2: "⚖️ Agente 2: El Alquimista de Envíos Divididos",
    a3: "🦅 Agente 3: El Despachador de Rutas y Pasarela MCP",
    clear: "DESPEJADO",
    alerts: "ALERTAS ENCONTRADAS",
    noAlerts: "Sin restricciones detectadas.",
    single: "Una caja (penalización Régimen General)",
    split: "Plan del Alquimista (cajas exentas 4x4)",
    saved: "USD ahorrados",
    noSavings: "Sin ahorro: se mantiene una sola caja.",
    box: "Caja",
    taxes: "Impuestos",
    exempt: "4x4 EXENTO",
    general: "RÉGIMEN GENERAL",
    courier: "Courier",
    freight: "Flete",
    customs: "Aduana",
    landed: "Total puesto",
    days: "Días",
    best: "Mejor",
    send: "🔮 Enviar caja a PhantasmTrack",
    inspector: "Inspector Kiro Crew y MCP",
    agents: "Agentes (agents/*.json)",
    skills: "Skills (skills/*/SKILL.md)",
    tools: "Herramientas MCP (mcp-server/index.ts)",
    command: "Comando (Ctrl+K)",
    fetch: "Ver JSON de /api/crew",
    copy: "Copiar JSON",
    copied: "Copiado",
    fetchError: "No se pudo consultar /api/crew",
    reportJson: "Reporte en vivo",
    nameLabel: "Nombre",
    langLabel: "Idioma",
    invalid: "Datos inválidos: revisa nombre, peso, precio y cantidad.",
    items: "unidades",
  },
  en: {
    title: "🦅 GrimCourier Crew · Kiro Crew App & MCP Server",
    subtitle: "Multi-Agent SENAE 4x4 Split-Shipment Oracle (Kiroween 2026)",
    openGrimoire: "🎃 Open PhantasmTrack Grimoire",
    presets: "Demo scenarios (1 click)",
    demo1: `📦 Demo 1: $460 / 5.8kg Oversized Haul (Saves ${usd(OVERSIZED_SAVINGS)} USD!)`,
    demo2: "🚨 Demo 2: Restricted Tech & Cosmetics (ARCSA + ARCOTEL + Commercial Alerts)",
    demo3: "✅ Demo 3: Safe 4x4 Micro-Haul (1.8kg / $145 USD)",
    cart: "Cart",
    emptyCart: "The cart is empty. Pick a demo or add an item.",
    colName: "Item",
    colWeight: "Weight/unit (kg)",
    colPrice: "Price/unit (USD)",
    colQty: "Qty",
    colCategory: "Category",
    remove: "Remove",
    addItem: "Add custom item",
    add: "Add",
    totals: "Totals",
    trace: "Execution trace",
    a1: "🕵️‍♂️ Agent 1: The Tariff Inquisitor",
    a2: "⚖️ Agent 2: The Split-Shipment Alchemist",
    a3: "🦅 Agent 3: The Route Dispatcher & MCP Gateway",
    clear: "CLEAR",
    alerts: "ALERTS_FOUND",
    noAlerts: "No restrictions detected.",
    single: "Single Box (General Regime Penalty)",
    split: "Alchemist Split Plan (4x4 Exempt Boxes)",
    saved: "USD saved",
    noSavings: "No savings: keeping a single box.",
    box: "Box",
    taxes: "Taxes",
    exempt: "4x4 EXEMPT",
    general: "GENERAL REGIME",
    courier: "Courier",
    freight: "Freight",
    customs: "Customs",
    landed: "Landed total",
    days: "Days",
    best: "Best",
    send: "🔮 Send Box to PhantasmTrack",
    inspector: "Kiro Crew & MCP Inspector",
    agents: "Agents (agents/*.json)",
    skills: "Skills (skills/*/SKILL.md)",
    tools: "MCP tools (mcp-server/index.ts)",
    command: "Command (Ctrl+K)",
    fetch: "Preview /api/crew JSON",
    copy: "Copy JSON",
    copied: "Copied",
    fetchError: "Could not reach /api/crew",
    reportJson: "Live report",
    nameLabel: "Name",
    langLabel: "Language",
    invalid: "Invalid input: check name, weight, price and quantity.",
    items: "units",
  },
} as const;

const AGENT_IDS = ["tariff-inquisitor", "split-shipment-alchemist", "route-dispatcher"];
const SKILL_IDS = ["senae-4x4-customs", "split-shipment-optimizer"];
const MCP_TOOL_IDS = [
  "analyze_cart_senae",
  "optimize_split_shipment",
  "compare_ecuador_couriers",
  "run_grim_courier_crew",
];

// Shared class names. Every card is `min-w-0` so long content can never widen its parent.
const panel =
  "w-full min-w-0 overflow-hidden rounded-xl border border-purple-900/40 bg-[#120d1d]/90 p-4 sm:p-6 shadow-lg shadow-black/40";
const sectionTitle = "font-display mb-3 text-lg text-amber-300 break-words";
const inputCls =
  "block w-full min-w-0 rounded-md border border-violet-900/60 bg-[#0d0916] px-2 py-1.5 text-sm text-stone-100 placeholder:text-stone-500";
const btnCls =
  "rounded-lg border border-violet-700/60 bg-violet-950/60 px-4 py-2 text-sm font-medium text-violet-100 transition hover:border-amber-400/70 hover:bg-violet-900/60";
const ctaCls =
  "inline-block rounded-lg bg-gradient-to-r from-red-800 to-violet-800 px-4 py-2 text-center text-sm font-semibold text-amber-100 hover:from-red-700 hover:to-violet-700";
const th = "px-2 py-2 font-semibold";
const td = "px-2 py-2";

function severityCls(a: SenaeAlert) {
  return a.severity === "CRITICAL"
    ? "border-red-700/70 bg-red-950/50 text-red-200"
    : "border-amber-600/60 bg-amber-950/40 text-amber-100";
}

function groupUnits(box: BoxTaxBreakdown) {
  const counts = new Map<string, number>();
  for (const u of box.items) counts.set(u.name, (counts.get(u.name) ?? 0) + 1);
  return [...counts.entries()].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name));
}

function CategoryBadge({ category }: { category: ItemCategory }) {
  return (
    <span className="inline-block max-w-full break-all rounded-full border border-violet-800/60 bg-violet-950/60 px-2 py-0.5 text-xs text-violet-200">
      {category}
    </span>
  );
}

function RegimeBadge({ box, lang }: { box: BoxTaxBreakdown; lang: Lang }) {
  const t = T[lang];
  const exempt = box.regime === "4X4_EXEMPT";
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${
        exempt
          ? "border-emerald-600/60 bg-emerald-950/50 text-emerald-300"
          : "border-red-600/60 bg-red-950/50 text-red-300"
      }`}
    >
      {exempt ? t.exempt : t.general}
    </span>
  );
}

function BoxCard({ box, lang }: { box: BoxTaxBreakdown; lang: Lang }) {
  const t = T[lang];
  return (
    <div className="min-w-0 rounded-lg border border-violet-900/40 bg-[#0d0916] p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-amber-300">
          {t.box} {box.boxIndex}
        </strong>
        <RegimeBadge box={box} lang={lang} />
      </div>
      <p className="mt-2 break-words text-stone-300">{groupUnits(box).join(", ")}</p>
      <p className="mt-1 text-stone-400">
        {box.totalWeightKg} kg / {box.totalWeightLb} lb · FOB {usd(box.totalFobUsd)}
      </p>
      <p className="mt-1 font-semibold text-stone-100">
        {t.taxes}: {usd(box.totalTaxesUsd)}
      </p>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [items, setItems] = useState<CartItem[]>(() => structuredClone(PRESET_DEMO_CARTS.oversized_haul.items));
  const [activePreset, setActivePreset] = useState<PresetId | null>("oversized_haul");
  const [customCounter, setCustomCounter] = useState(1);
  const [form, setForm] = useState({ name: "", weight: "", price: "", qty: "1", category: "general" as ItemCategory });
  const [formError, setFormError] = useState(false);
  const [apiJson, setApiJson] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const t = T[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const report = useMemo(() => (items.length > 0 ? runGrimCourierCrew(items) : null), [items]);

  function loadPreset(id: PresetId) {
    setItems(structuredClone(PRESET_DEMO_CARTS[id].items));
    setActivePreset(id);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setActivePreset(null);
  }

  function addItem(e: FormEvent) {
    e.preventDefault();
    const parsed = cartItemSchema.safeParse({
      id: `custom-${customCounter}`,
      name: form.name.trim(),
      unitWeightKg: Number(form.weight),
      unitPriceUsd: Number(form.price),
      quantity: Number(form.qty),
      category: form.category,
    });
    if (!parsed.success) {
      setFormError(true);
      return;
    }
    setFormError(false);
    setItems((prev) => [...prev, parsed.data]);
    setCustomCounter((c) => c + 1);
    setActivePreset(null);
    setForm({ name: "", weight: "", price: "", qty: "1", category: "general" });
  }

  async function previewApi() {
    try {
      const res = await fetch("/api/crew");
      setApiJson(JSON.stringify(await res.json(), null, 2));
    } catch {
      setApiJson(t.fetchError);
    }
  }

  async function copyJson() {
    const text = apiJson || (report ? JSON.stringify(report, null, 2) : "");
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(t.copied);
      setTimeout(() => setCopyMsg(""), 1500);
    } catch {
      setCopyMsg(t.fetchError);
    }
  }

  const trace = report
    ? [
        `[tariff-inquisitor] ${lang === "es" ? report.agent1Inquisitor.summaryEs : report.agent1Inquisitor.summaryEn}`,
        `[split-shipment-alchemist] ${lang === "es" ? report.agent2Alchemist.explanationEs : report.agent2Alchemist.explanationEn}`,
        `[route-dispatcher] ${lang === "es" ? report.agent3Dispatcher.summaryEs : report.agent3Dispatcher.summaryEn}`,
      ]
    : [];

  const removeButton = (i: CartItem) => (
    <button
      type="button"
      onClick={() => removeItem(i.id)}
      aria-label={`${t.remove} ${i.name}`}
      className="shrink-0 rounded border border-red-800/70 px-2 py-1 text-xs text-red-300 hover:bg-red-950"
    >
      {t.remove}
    </button>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#09070e] text-stone-100">
      <header className="w-full border-b border-violet-900/50 bg-[#09070e]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="font-display break-words text-xl font-bold tracking-wide text-amber-300 sm:text-2xl">
              {t.title}
            </h1>
            <p className="break-words text-xs text-violet-300/80">{t.subtitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div role="group" aria-label={t.langLabel} className="flex overflow-hidden rounded-lg border border-violet-700/60">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-sm font-semibold ${
                    lang === l ? "bg-red-900/70 text-amber-200" : "bg-transparent text-violet-200 hover:bg-violet-950"
                  }`}
                >
                  {l === "es" ? "🇪🇸 ES" : "🇺🇸 EN"}
                </button>
              ))}
            </div>
            <a href={PHANTASM_URL} target="_blank" rel="noopener noreferrer" className={ctaCls}>
              {t.openGrimoire}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Demo scenarios */}
        <section className={panel} aria-labelledby="presets-h">
          <h2 id="presets-h" className={sectionTitle}>
            {t.presets}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(
              [
                ["oversized_haul", t.demo1],
                ["restricted_tech", t.demo2],
                ["safe_micro_haul", t.demo3],
              ] as [PresetId, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => loadPreset(id)}
                aria-pressed={activePreset === id}
                className={`w-full min-w-0 whitespace-normal break-words rounded-lg border bg-violet-950/60 p-3.5 text-left text-sm font-medium text-violet-100 transition-all hover:border-amber-400/70 hover:bg-violet-900/60 ${
                  activePreset === id ? "border-amber-400 ring-1 ring-amber-400/60" : "border-violet-700/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Cart */}
        <section className={panel} aria-labelledby="cart-h">
          <h2 id="cart-h" className={sectionTitle}>
            {t.cart}
          </h2>

          {items.length === 0 ? (
            <p className="text-stone-400">{t.emptyCart}</p>
          ) : (
            <>
              {/* Mobile: one card per item */}
              <ul className="space-y-2 md:hidden">
                {items.map((i) => (
                  <li key={i.id} className="min-w-0 rounded-lg border border-violet-900/40 bg-[#0d0916] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-stone-100">{i.name}</p>
                        <div className="mt-1">
                          <CategoryBadge category={i.category} />
                        </div>
                      </div>
                      {removeButton(i)}
                    </div>
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="min-w-0">
                        <dt className="text-violet-300">{t.colWeight}</dt>
                        <dd>{i.unitWeightKg}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-violet-300">{t.colPrice}</dt>
                        <dd>{usd(i.unitPriceUsd)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-violet-300">{t.colQty}</dt>
                        <dd>{i.quantity}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              {/* Desktop: contained table */}
              <div className="hidden w-full overflow-x-auto md:block">
                <table className="w-full table-auto text-left text-sm">
                  <thead className="text-violet-300">
                    <tr>
                      <th className={th}>{t.colName}</th>
                      <th className={th}>{t.colWeight}</th>
                      <th className={th}>{t.colPrice}</th>
                      <th className={th}>{t.colQty}</th>
                      <th className={th}>{t.colCategory}</th>
                      <th className={th}>
                        <span className="sr-only">{t.remove}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="border-t border-violet-900/30">
                        <td className={`${td} break-words`}>{i.name}</td>
                        <td className={td}>{i.unitWeightKg}</td>
                        <td className={td}>{usd(i.unitPriceUsd)}</td>
                        <td className={td}>{i.quantity}</td>
                        <td className={td}>
                          <CategoryBadge category={i.category} />
                        </td>
                        <td className={`${td} text-right`}>{removeButton(i)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {report && (
            <p className="mt-3 break-words text-sm text-violet-200">
              {t.totals}: {report.totalItemsCount} {t.items} · {report.totalWeightKg} kg · {usd(report.totalFobUsd)} FOB
            </p>
          )}

          {/* Add custom item */}
          <form onSubmit={addItem} className="mt-4 border-t border-violet-900/40 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-violet-200">{t.addItem}</h3>
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <label className="block min-w-0 text-xs text-violet-300 sm:col-span-2 lg:col-span-2">
                {t.nameLabel}
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={120}
                />
              </label>
              <label className="block min-w-0 text-xs text-violet-300">
                {t.colWeight}
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </label>
              <label className="block min-w-0 text-xs text-violet-300">
                {t.colPrice}
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </label>
              <label className="block min-w-0 text-xs text-violet-300">
                {t.colQty}
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                />
              </label>
              <label className="block min-w-0 text-xs text-violet-300">
                {t.colCategory}
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="submit" className={btnCls}>
                {t.add}
              </button>
              {formError && (
                <span role="alert" className="text-sm text-red-300">
                  {t.invalid}
                </span>
              )}
            </div>
          </form>
        </section>

        {report && (
          <div aria-live="polite" className="w-full min-w-0 space-y-6">
            {/* Execution trace */}
            <section className={panel} aria-labelledby="trace-h">
              <h2 id="trace-h" className={sectionTitle}>
                {t.trace}
              </h2>
              <ol className="space-y-1 font-mono text-xs text-violet-200">
                {trace.map((line, idx) => (
                  <li key={idx} className="break-words">
                    <span className="text-emerald-400">✔</span> {line}
                  </li>
                ))}
              </ol>
            </section>

            {/* Agent 1 */}
            <section className={panel} aria-labelledby="a1-h">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="a1-h" className="font-display min-w-0 break-words text-lg text-amber-300">
                  {t.a1} <code className="text-xs text-violet-400">tariff-inquisitor</code>
                </h2>
                <span
                  className={`self-start rounded-full border px-3 py-0.5 text-xs font-bold sm:self-auto ${
                    report.agent1Inquisitor.status === "CLEAR"
                      ? "border-emerald-600/60 bg-emerald-950/50 text-emerald-300"
                      : "border-amber-500/60 bg-amber-950/50 text-amber-200"
                  }`}
                >
                  {report.agent1Inquisitor.status === "CLEAR" ? t.clear : t.alerts}
                </span>
              </div>
              {report.agent1Inquisitor.alerts.length === 0 ? (
                <p className="text-stone-400">{t.noAlerts}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2">
                  {report.agent1Inquisitor.alerts.map((a, idx) => (
                    <li
                      key={`${a.itemId}-${a.code}-${idx}`}
                      className={`min-w-0 break-words rounded-lg border p-3 text-sm ${severityCls(a)}`}
                    >
                      <div className="mb-1 flex flex-wrap gap-2 text-xs font-bold">
                        <span>{a.severity}</span>
                        <code>{a.code}</code>
                      </div>
                      {lang === "es" ? a.messageEs : a.messageEn}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Agent 2 */}
            <section className={panel} aria-labelledby="a2-h">
              <h2 id="a2-h" className={sectionTitle}>
                {t.a2} <code className="text-xs text-violet-400">split-shipment-alchemist</code>
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-red-900/60 bg-red-950/20 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-red-300">{t.single}</h3>
                  <BoxCard box={report.agent2Alchemist.singleBoxBaseline} lang={lang} />
                </div>
                <div className="min-w-0 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-emerald-300">{t.split}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {report.agent2Alchemist.optimizedBoxes.map((b) => (
                      <BoxCard key={b.boxIndex} box={b} lang={lang} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xl font-bold text-amber-300">
                {report.agent2Alchemist.netSavingsUsd > 0
                  ? `${usd(report.agent2Alchemist.netSavingsUsd)} ${t.saved}`
                  : t.noSavings}
              </p>
              <p className="mt-1 break-words text-center text-sm text-stone-400">
                {lang === "es" ? report.agent2Alchemist.explanationEs : report.agent2Alchemist.explanationEn}
              </p>
            </section>

            {/* Agent 3 */}
            <section className={panel} aria-labelledby="a3-h">
              <h2 id="a3-h" className={sectionTitle}>
                {t.a3} <code className="text-xs text-violet-400">route-dispatcher</code>
              </h2>
              <div className="space-y-4">
                {report.agent3Dispatcher.boxRoutes.map((r) => (
                  <div key={r.boxIndex} className="min-w-0 rounded-lg border border-violet-900/40 bg-[#0d0916] p-3">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <strong className="text-amber-300">
                        {t.box} {r.boxIndex}
                      </strong>
                      <a
                        href={r.phantasmTrackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${ctaCls} w-full sm:w-auto`}
                      >
                        {t.send}
                      </a>
                    </div>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full table-auto text-left text-xs sm:text-sm">
                        <thead className="text-violet-300">
                          <tr>
                            <th className={th}>{t.courier}</th>
                            <th className={th}>{t.freight}</th>
                            <th className={th}>{t.customs}</th>
                            <th className={th}>{t.landed}</th>
                            <th className={th}>{t.days}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.quotes.map((q) => (
                            <tr
                              key={q.courierId}
                              className={`border-t border-violet-900/30 ${q.recommended ? "text-amber-200" : ""}`}
                            >
                              <td className={td}>
                                {q.courierName}{" "}
                                {q.recommended && (
                                  <span className="whitespace-nowrap rounded bg-amber-900/60 px-1.5 text-xs font-bold">
                                    {t.best}
                                  </span>
                                )}
                              </td>
                              <td className={td}>{usd(q.freightUsd)}</td>
                              <td className={td}>{usd(q.customsTaxesUsd)}</td>
                              <td className={`${td} font-semibold`}>{usd(q.totalLandedCostUsd)}</td>
                              <td className={`${td} whitespace-nowrap`}>{q.estimatedDays}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 break-words text-sm text-stone-300">
                {lang === "es" ? report.agent3Dispatcher.summaryEs : report.agent3Dispatcher.summaryEn}
              </p>
            </section>
          </div>
        )}

        {/* Kiro Crew & MCP Inspector */}
        <section className={panel} aria-labelledby="insp-h">
          <h2 id="insp-h" className={sectionTitle}>
            {t.inspector}
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <h3 className="mb-1 break-words font-semibold text-violet-300">{t.agents}</h3>
              <ul className="space-y-1">
                {AGENT_IDS.map((a) => (
                  <li key={a}>
                    <code>{a}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="mb-1 break-words font-semibold text-violet-300">{t.skills}</h3>
              <ul className="space-y-1">
                {SKILL_IDS.map((s) => (
                  <li key={s}>
                    <code>{s}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="mb-1 break-words font-semibold text-violet-300">{t.tools}</h3>
              <ul className="space-y-1">
                {MCP_TOOL_IDS.map((m) => (
                  <li key={m}>
                    <code>{m}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <h3 className="mb-1 break-words font-semibold text-violet-300">{t.command}</h3>
              <code>optimize-4x4-cart</code>
              <p className="mt-1 text-stone-400">Optimize SENAE 4x4 Cart Split</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={previewApi} className={btnCls}>
              {t.fetch}
            </button>
            <button type="button" onClick={copyJson} className={btnCls}>
              {t.copy}
            </button>
            <span role="status" className="text-sm text-emerald-300">
              {copyMsg}
            </span>
          </div>
          <pre
            tabIndex={0}
            aria-label={t.reportJson}
            className="mt-3 max-h-80 w-full max-w-full overflow-x-auto overflow-y-auto rounded-lg border border-violet-900/40 bg-[#0d0916] p-3 text-xs text-violet-100"
          >
            {apiJson || (report ? JSON.stringify(report, null, 2) : "")}
          </pre>
        </section>
      </main>

      <footer className="border-t border-violet-900/40 py-4 text-center text-xs text-stone-500">
        GrimCourier Crew · MIT · Kiroween 2026
      </footer>
    </div>
  );
}
