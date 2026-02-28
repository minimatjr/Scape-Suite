import React, { useEffect, useMemo, useState } from "react";
import QuotePdf from "../pdf/QuotePdf";
import LineItemsEditor from "../components/LineItemsEditor";
import PaperworkActions from "../components/PaperworkActions";
import TemplateManagerDb from "../components/TemplateManagerDb";
import { calcTotals, moneyGBP } from "../utils/money";
import { loadDraft, saveDraft } from "../utils/storage";
import { builderStyles } from "./styles";
import { useDocNumber } from "../hooks/useDocNumber";

const DRAFT_KEY = "paperwork.quoteDraft.v1";

const empty = {
  business: {
    name: "LandscapeCalc Ltd",
    tagline: "Landscaping & Outdoor Works",
    address: "",
    phone: "",
    email: "",
    website: "",
    footerNote: "",
  },
  client: { name: "", address: "", email: "", phone: "" },
  quote: { number: "", date: "", validUntil: "", projectTitle: "", siteAddress: "", reference: "" },
  items: [{ id: "line-1", description: "", qty: 1, unitPrice: 0 }],
  vatRatePercent: 20,
  notes: "All works subject to site survey and access. Disposal included unless stated.",
  terms: "50% deposit to secure start date. Balance due on completion. Quote valid for 14 days.",
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function QuoteBuilder() {
  const [draft, setDraft] = useState(() => loadDraft(DRAFT_KEY, empty));
  const [busyNumber, setBusyNumber] = useState(false);
  const { nextNumber } = useDocNumber();

  useEffect(() => {
    saveDraft(DRAFT_KEY, draft);
  }, [draft]);

  const generateNumber = async () => {
    try {
      setBusyNumber(true);
      const num = await nextNumber("quote");
      setDraft((d) => ({ ...d, quote: { ...d.quote, number: num } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const createNew = async () => {
    const base = {
      ...empty,
      business: { ...draft.business },
      vatRatePercent: draft.vatRatePercent ?? empty.vatRatePercent,
      notes: draft.notes ?? empty.notes,
      terms: draft.terms ?? empty.terms,
    };

    setDraft(base);

    try {
      setBusyNumber(true);
      const num = await nextNumber("quote");
      setDraft((d) => ({ ...d, quote: { ...d.quote, number: num, date: todayISO() } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const totals = useMemo(
    () => calcTotals(draft.items, draft.vatRatePercent),
    [draft.items, draft.vatRatePercent]
  );

  const pdfDoc = <QuotePdf data={draft} />;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>Quote Builder</h1>
          <p className="subtle">Fill the form → download/print a client-ready quote PDF.</p>
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={createNew} disabled={busyNumber}>
            {busyNumber ? "Working…" : "Create New Quote"}
          </button>
          <PaperworkActions documentEl={pdfDoc} filename={`Quote-${draft.quote.number || "Draft"}.pdf`} />
        </div>
      </div>

      <div className="grid">
        <section className="card wide">
          <TemplateManagerDb docType="quote" draft={draft} setDraft={setDraft} />
        </section>

        <section className="card">
          <h2>Business</h2>
          <div className="form">
            {["name", "tagline", "address", "phone", "email", "website"].map((k) => (
              <label key={k}>
                <span className="lbl">{k.toUpperCase()}</span>
                <input
                  className="input"
                  value={draft.business[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, business: { ...d.business, [k]: e.target.value } }))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Client</h2>
          <div className="form">
            {["name", "address", "email", "phone"].map((k) => (
              <label key={k}>
                <span className="lbl">{k.toUpperCase()}</span>
                <input
                  className="input"
                  value={draft.client[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, client: { ...d.client, [k]: e.target.value } }))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Quote Details</h2>
          <div className="form two">
            <label>
              <span className="lbl">Quote Number</span>
              <div className="inlineField">
                <input
                  className="input"
                  value={draft.quote.number}
                  onChange={(e) => setDraft((d) => ({ ...d, quote: { ...d.quote, number: e.target.value } }))}
                />
                <button className="btn" type="button" onClick={generateNumber} disabled={busyNumber}>
                  {busyNumber ? "…" : "Auto"}
                </button>
              </div>
            </label>

            {[
              ["date", "Date"],
              ["validUntil", "Valid Until"],
              ["reference", "Reference"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.quote[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, quote: { ...d.quote, [k]: e.target.value } }))}
                />
              </label>
            ))}
          </div>

          <div className="form">
            {[
              ["projectTitle", "Project Title"],
              ["siteAddress", "Site Address"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.quote[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, quote: { ...d.quote, [k]: e.target.value } }))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card wide">
          <div className="rowBetween">
            <h2>Line Items</h2>
            <label className="inline">
              <span className="lbl">VAT %</span>
              <input
                className="input small right"
                type="number"
                min="0"
                step="0.1"
                value={draft.vatRatePercent}
                onChange={(e) => setDraft((d) => ({ ...d, vatRatePercent: Number(e.target.value) }))}
              />
            </label>
          </div>

          <LineItemsEditor items={draft.items} setItems={(items) => setDraft((d) => ({ ...d, items }))} />

          <div className="totals">
            <div><span className="subtle">Subtotal</span><span className="mono">{moneyGBP(totals.subtotal)}</span></div>
            <div><span className="subtle">VAT</span><span className="mono">{moneyGBP(totals.vat)}</span></div>
            <div className="strong"><span>Total</span><span className="mono">{moneyGBP(totals.total)}</span></div>
          </div>
        </section>

        <section className="card">
          <h2>Notes</h2>
          <textarea className="textarea" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
        </section>

        <section className="card">
          <h2>Terms</h2>
          <textarea className="textarea" value={draft.terms} onChange={(e) => setDraft((d) => ({ ...d, terms: e.target.value }))} />
        </section>
      </div>

      <style>{builderStyles + extraStyles}</style>
    </div>
  );
}

const extraStyles = `
  .inlineField { display:flex; gap: 10px; align-items:center; }
  .inlineField .input { flex: 1; }
`;