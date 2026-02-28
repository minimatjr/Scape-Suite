import React, { useEffect, useState } from "react";
import PaperworkActions from "../components/PaperworkActions";
import TemplateManagerDb from "../components/TemplateManagerDb";
import DepositReceiptPdf from "../pdf/DepositReceiptPdf";
import { loadDraft, saveDraft } from "../utils/storage";
import { builderStyles } from "./styles";
import { useDocNumber } from "../hooks/useDocNumber";

const KEY = "paperwork.receiptDraft.v1";

const empty = {
  business: {
    name: "LandscapeCalc Ltd",
    tagline: "Landscaping & Outdoor Works",
    address: "",
    phone: "",
    email: "",
    footerNote: "",
  },
  client: { name: "", address: "", email: "" },
  receipt: {
    number: "",
    date: "",
    reference: "",
    amount: 0,
    method: "Bank Transfer",
    forDocument: "Quote # / Invoice #",
    notes: "Deposit received to secure booking/start date.",
  },
  vatRatePercent: 20,
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DepositReceiptBuilder() {
  const [draft, setDraft] = useState(() => loadDraft(KEY, empty));
  const [busyNumber, setBusyNumber] = useState(false);
  const { nextNumber } = useDocNumber();

  useEffect(() => saveDraft(KEY, draft), [draft]);

  const generateNumber = async () => {
    try {
      setBusyNumber(true);
      const num = await nextNumber("receipt");
      setDraft((d) => ({ ...d, receipt: { ...d.receipt, number: num } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const createNew = async () => {
    const base = {
      ...empty,
      business: { ...draft.business },
      receipt: { ...empty.receipt, notes: draft.receipt?.notes ?? empty.receipt.notes },
    };

    setDraft(base);

    try {
      setBusyNumber(true);
      const num = await nextNumber("receipt");
      setDraft((d) => ({ ...d, receipt: { ...d.receipt, number: num, date: todayISO() } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const pdfDoc = <DepositReceiptPdf data={draft} />;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>Deposit Receipt</h1>
          <p className="subtle">Client-facing receipt PDF.</p>
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={createNew} disabled={busyNumber}>
            {busyNumber ? "Working…" : "Create New Receipt"}
          </button>
          <PaperworkActions documentEl={pdfDoc} filename={`Receipt-${draft.receipt.number || "Draft"}.pdf`} />
        </div>
      </div>

      <div className="grid">
        <section className="card wide">
          <TemplateManagerDb docType="receipt" draft={draft} setDraft={setDraft} />
        </section>

        <section className="card">
          <h2>Business</h2>
          <div className="form">
            {["name", "tagline", "address", "phone", "email"].map((k) => (
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
            {["name", "address", "email"].map((k) => (
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

        <section className="card wide">
          <h2>Receipt</h2>

          <div className="form two">
            <label>
              <span className="lbl">Receipt Number</span>
              <div className="inlineField">
                <input
                  className="input"
                  value={draft.receipt.number}
                  onChange={(e) => setDraft((d) => ({ ...d, receipt: { ...d.receipt, number: e.target.value } }))}
                />
                <button className="btn" type="button" onClick={generateNumber} disabled={busyNumber}>
                  {busyNumber ? "…" : "Auto"}
                </button>
              </div>
            </label>

            {[
              ["date", "Date"],
              ["reference", "Reference"],
              ["method", "Method"],
              ["forDocument", "For (Invoice/Quote)"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.receipt[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, receipt: { ...d.receipt, [k]: e.target.value } }))}
                />
              </label>
            ))}

            <label>
              <span className="lbl">AMOUNT</span>
              <input
                className="input right"
                type="number"
                min="0"
                step="0.01"
                value={draft.receipt.amount}
                onChange={(e) => setDraft((d) => ({ ...d, receipt: { ...d.receipt, amount: Number(e.target.value) } }))}
              />
            </label>
          </div>

          <label style={{ marginTop: 10 }}>
            <span className="lbl">NOTES</span>
            <textarea
              className="textarea"
              value={draft.receipt.notes}
              onChange={(e) => setDraft((d) => ({ ...d, receipt: { ...d.receipt, notes: e.target.value } }))}
            />
          </label>
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