import React, { useEffect, useState } from "react";
import PaperworkActions from "../components/PaperworkActions";
import TemplateManagerDb from "../components/TemplateManagerDb";
import SchedulePdf from "../pdf/SchedulePdf";
import { loadDraft, saveDraft } from "../utils/storage";
import { builderStyles } from "./styles";
import { useDocNumber } from "../hooks/useDocNumber";

const KEY = "paperwork.scheduleDraft.v1";

const empty = {
  business: {
    name: "LandscapeCalc Ltd",
    tagline: "Landscaping & Outdoor Works",
    address: "",
    phone: "",
    email: "",
    footerNote: "",
  },
  client: { name: "", address: "", email: "", phone: "" },
  schedule: {
    reference: "",
    issuedDate: "",
    date: "",
    arrivalWindow: "08:00–10:00",
    duration: "1 day",
    contactOnDay: "",
  },
  project: {
    title: "",
    siteAddress: "",
    accessNotes: "Gate code / parking / pets / key location...",
  },
  notes:
    "Please ensure clear access to the work area. We may need access to an outdoor tap and a power socket if available.",
  vatRatePercent: 20,
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ScheduleBuilder() {
  const [draft, setDraft] = useState(() => loadDraft(KEY, empty));
  const [busyNumber, setBusyNumber] = useState(false);
  const { nextNumber } = useDocNumber();

  useEffect(() => saveDraft(KEY, draft), [draft]);

  const generateReference = async () => {
    try {
      setBusyNumber(true);
      const num = await nextNumber("schedule");
      setDraft((d) => ({ ...d, schedule: { ...d.schedule, reference: num } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const createNew = async () => {
    const base = {
      ...empty,
      business: { ...draft.business },
      notes: draft.notes ?? empty.notes,
    };

    setDraft(base);

    try {
      setBusyNumber(true);
      const num = await nextNumber("schedule");
      setDraft((d) => ({
        ...d,
        schedule: { ...d.schedule, reference: num, issuedDate: todayISO() },
      }));
    } finally {
      setBusyNumber(false);
    }
  };

  const pdfDoc = <SchedulePdf data={draft} />;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>Schedule / Appointment Confirmation</h1>
          <p className="subtle">Client-facing appointment confirmation PDF.</p>
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={createNew} disabled={busyNumber}>
            {busyNumber ? "Working…" : "Create New Schedule"}
          </button>
          <PaperworkActions documentEl={pdfDoc} filename={`Schedule-${draft.schedule.reference || "Draft"}.pdf`} />
        </div>
      </div>

      <div className="grid">
        <section className="card wide">
          <TemplateManagerDb docType="schedule" draft={draft} setDraft={setDraft} />
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

        <section className="card wide">
          <h2>Appointment</h2>

          <div className="form two">
            <label>
              <span className="lbl">Reference</span>
              <div className="inlineField">
                <input
                  className="input"
                  value={draft.schedule.reference}
                  onChange={(e) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, reference: e.target.value } }))}
                />
                <button className="btn" type="button" onClick={generateReference} disabled={busyNumber}>
                  {busyNumber ? "…" : "Auto"}
                </button>
              </div>
            </label>

            {[
              ["issuedDate", "Issued Date"],
              ["date", "Appointment Date"],
              ["arrivalWindow", "Arrival Window"],
              ["duration", "Expected Duration"],
              ["contactOnDay", "On-day Contact"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.schedule[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, [k]: e.target.value } }))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card wide">
          <h2>Project / Site</h2>
          <div className="form">
            {[
              ["title", "Project Title"],
              ["siteAddress", "Site Address"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.project[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, project: { ...d.project, [k]: e.target.value } }))}
                />
              </label>
            ))}
            <label>
              <span className="lbl">ACCESS NOTES</span>
              <textarea
                className="textarea"
                value={draft.project.accessNotes}
                onChange={(e) => setDraft((d) => ({ ...d, project: { ...d.project, accessNotes: e.target.value } }))}
              />
            </label>
          </div>
        </section>

        <section className="card wide">
          <h2>Notes</h2>
          <textarea className="textarea" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
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