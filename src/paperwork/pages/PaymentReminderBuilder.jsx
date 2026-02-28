import React, { useEffect, useState } from "react";
import PaperworkActions from "../components/PaperworkActions";
import TemplateManagerDb from "../components/TemplateManagerDb";
import PaymentReminderPdf from "../pdf/PaymentReminderPdf";
import { loadDraft, saveDraft } from "../utils/storage";
import { builderStyles } from "./styles";
import { useDocNumber } from "../hooks/useDocNumber";

const KEY = "paperwork.reminderDraft.v1";

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
  reminder: {
    issuedDate: "",
    invoiceNumber: "",
    dueDate: "",
    amountDue: 0,
    reminderText:
      "This is a friendly reminder that the invoice listed above is now due. If you’ve already paid, please disregard this message. Thank you.",
    paymentDetails:
      "Bank transfer:\nAccount Name:\nSort Code:\nAccount Number:\nReference: Invoice Number",
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

export default function PaymentReminderBuilder() {
  const [draft, setDraft] = useState(() => loadDraft(KEY, empty));
  const [busyNumber, setBusyNumber] = useState(false);
  const { nextNumber } = useDocNumber();

  useEffect(() => saveDraft(KEY, draft), [draft]);

  // This generates the Reminder reference (PR-000001 etc.). It does NOT touch invoice number.
  const generateReminderRef = async () => {
    try {
      setBusyNumber(true);
      const num = await nextNumber("reminder");
      // We'll store it in `reference` if you want; for now, place into invoiceNumber is wrong.
      // If your PaymentReminderPdf expects only invoiceNumber, keep this unused.
      setDraft((d) => ({ ...d, reminder: { ...d.reminder, reference: num } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const createNew = async () => {
    const base = {
      ...empty,
      business: { ...draft.business },
      reminder: {
        ...empty.reminder,
        reminderText: draft.reminder?.reminderText ?? empty.reminder.reminderText,
        paymentDetails: draft.reminder?.paymentDetails ?? empty.reminder.paymentDetails,
      },
    };

    setDraft(base);

    // set issued date automatically
    setDraft((d) => ({ ...d, reminder: { ...d.reminder, issuedDate: todayISO() } }));

    // optional: also generate a reminder reference
    try {
      setBusyNumber(true);
      const num = await nextNumber("reminder");
      setDraft((d) => ({ ...d, reminder: { ...d.reminder, reference: num } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const pdfDoc = <PaymentReminderPdf data={draft} />;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>Payment Reminder</h1>
          <p className="subtle">A polite, client-ready reminder letter PDF.</p>
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={createNew} disabled={busyNumber}>
            {busyNumber ? "Working…" : "Create New Reminder"}
          </button>
          <PaperworkActions documentEl={pdfDoc} filename={`Payment-Reminder-${draft.reminder.invoiceNumber || "Draft"}.pdf`} />
        </div>
      </div>

      <div className="grid">
        <section className="card wide">
          <TemplateManagerDb docType="reminder" draft={draft} setDraft={setDraft} />
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
          <h2>Reminder Details</h2>

          {/* Optional reminder reference field */}
          <div className="form two">
            <label>
              <span className="lbl">Reminder Reference (optional)</span>
              <div className="inlineField">
                <input
                  className="input"
                  value={draft.reminder.reference || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, reminder: { ...d.reminder, reference: e.target.value } }))}
                />
                <button className="btn" type="button" onClick={generateReminderRef} disabled={busyNumber}>
                  {busyNumber ? "…" : "Auto"}
                </button>
              </div>
            </label>

            {[
              ["issuedDate", "Issued Date"],
              ["invoiceNumber", "Invoice Number"],
              ["dueDate", "Due Date"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.reminder[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, reminder: { ...d.reminder, [k]: e.target.value } }))}
                />
              </label>
            ))}

            <label>
              <span className="lbl">AMOUNT DUE</span>
              <input
                className="input right"
                type="number"
                min="0"
                step="0.01"
                value={draft.reminder.amountDue}
                onChange={(e) => setDraft((d) => ({ ...d, reminder: { ...d.reminder, amountDue: Number(e.target.value) } }))}
              />
            </label>
          </div>

          <label style={{ marginTop: 10 }}>
            <span className="lbl">MESSAGE</span>
            <textarea
              className="textarea"
              value={draft.reminder.reminderText}
              onChange={(e) => setDraft((d) => ({ ...d, reminder: { ...d.reminder, reminderText: e.target.value } }))}
            />
          </label>

          <label style={{ marginTop: 10 }}>
            <span className="lbl">PAYMENT DETAILS (OPTIONAL)</span>
            <textarea
              className="textarea"
              value={draft.reminder.paymentDetails}
              onChange={(e) => setDraft((d) => ({ ...d, reminder: { ...d.reminder, paymentDetails: e.target.value } }))}
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