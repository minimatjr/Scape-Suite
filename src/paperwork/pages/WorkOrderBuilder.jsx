import React, { useEffect, useState } from "react";
import PaperworkActions from "../components/PaperworkActions";
import TemplateManagerDb from "../components/TemplateManagerDb";
import WorkOrderPdf from "../pdf/WorkOrderPdf";
import { loadDraft, saveDraft } from "../utils/storage";
import { builderStyles } from "./styles";
import { useDocNumber } from "../hooks/useDocNumber";

const KEY = "paperwork.workOrderDraft.v1";

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
  workOrder: { number: "", date: "", reference: "", projectTitle: "", siteAddress: "" },
  schedule: { startDate: "", startTime: "", endDate: "", endTime: "", arrivalWindow: "08:00–10:00" },
  crew: "Crew:\nVehicle(s):\nSupervisor:",
  materials: "Materials:\nEquipment:\nPPE:",
  checklist: { access: false, utilities: false, waste: false, notice: false, photosBefore: false, photosAfter: false },
  notes:
    "Method notes:\n- Protect existing surfaces\n- Keep site tidy daily\n- Dispose of waste as agreed\nSnags/variations to be noted and confirmed in writing.",
  vatRatePercent: 20,
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WorkOrderBuilder() {
  const [draft, setDraft] = useState(() => loadDraft(KEY, empty));
  const [busyNumber, setBusyNumber] = useState(false);
  const { nextNumber } = useDocNumber();

  useEffect(() => saveDraft(KEY, draft), [draft]);

  const generateNumber = async () => {
    try {
      setBusyNumber(true);
      const num = await nextNumber("workorder");
      setDraft((d) => ({ ...d, workOrder: { ...d.workOrder, number: num } }));
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
      const num = await nextNumber("workorder");
      setDraft((d) => ({ ...d, workOrder: { ...d.workOrder, number: num, date: todayISO() } }));
    } finally {
      setBusyNumber(false);
    }
  };

  const pdfDoc = <WorkOrderPdf data={draft} />;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>Work Order / Job Sheet</h1>
          <p className="subtle">Internal + client sign-off document.</p>
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={createNew} disabled={busyNumber}>
            {busyNumber ? "Working…" : "Create New Work Order"}
          </button>
          <PaperworkActions documentEl={pdfDoc} filename={`WorkOrder-${draft.workOrder.number || "Draft"}.pdf`} />
        </div>
      </div>

      <div className="grid">
        <section className="card wide">
          <TemplateManagerDb docType="workorder" draft={draft} setDraft={setDraft} />
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
          <h2>Work Order Details</h2>

          <div className="form two">
            <label>
              <span className="lbl">WO Number</span>
              <div className="inlineField">
                <input
                  className="input"
                  value={draft.workOrder.number}
                  onChange={(e) => setDraft((d) => ({ ...d, workOrder: { ...d.workOrder, number: e.target.value } }))}
                />
                <button className="btn" type="button" onClick={generateNumber} disabled={busyNumber}>
                  {busyNumber ? "…" : "Auto"}
                </button>
              </div>
            </label>

            {[
              ["date", "Date"],
              ["reference", "Reference"],
              ["projectTitle", "Project Title"],
            ].map(([k, label]) => (
              <label key={k}>
                <span className="lbl">{label}</span>
                <input
                  className="input"
                  value={draft.workOrder[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, workOrder: { ...d.workOrder, [k]: e.target.value } }))}
                />
              </label>
            ))}
          </div>

          <div className="form">
            <label>
              <span className="lbl">SITE ADDRESS</span>
              <input
                className="input"
                value={draft.workOrder.siteAddress}
                onChange={(e) => setDraft((d) => ({ ...d, workOrder: { ...d.workOrder, siteAddress: e.target.value } }))}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>Schedule</h2>
          <div className="form two">
            {[
              ["startDate", "Start Date"],
              ["startTime", "Start Time"],
              ["endDate", "End Date"],
              ["endTime", "End Time"],
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

          <label style={{ marginTop: 10 }}>
            <span className="lbl">ARRIVAL WINDOW</span>
            <input
              className="input"
              value={draft.schedule.arrivalWindow}
              onChange={(e) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, arrivalWindow: e.target.value } }))}
            />
          </label>
        </section>

        <section className="card">
          <h2>Checklist</h2>
          <div className="form">
            {[
              ["access", "Access confirmed / keys arranged"],
              ["utilities", "Utilities checked (water/electric)"],
              ["waste", "Waste disposal planned"],
              ["notice", "Client notified of noise/dust"],
              ["photosBefore", "Before photos taken"],
              ["photosAfter", "After photos taken"],
            ].map(([k, label]) => (
              <label key={k} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={draft.checklist[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, checklist: { ...d.checklist, [k]: e.target.checked } }))}
                />
                <span className="lbl" style={{ letterSpacing: 0, fontWeight: 800 }}>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Crew</h2>
          <textarea className="textarea" value={draft.crew} onChange={(e) => setDraft((d) => ({ ...d, crew: e.target.value }))} />
        </section>

        <section className="card">
          <h2>Materials / Equipment</h2>
          <textarea className="textarea" value={draft.materials} onChange={(e) => setDraft((d) => ({ ...d, materials: e.target.value }))} />
        </section>

        <section className="card wide">
          <h2>Notes / Method</h2>
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