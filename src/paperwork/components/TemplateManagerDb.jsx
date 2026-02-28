import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function TemplateManagerDb({ docType, draft, setDraft }) {
  const [category, setCategory] = useState("residential");
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("paperwork_templates")
      .select("*")
      .eq("doc_type", docType)
      .eq("category", category)
      .order("updated_at", { ascending: false });

    if (!error) setTemplates(data || []);
  };

  useEffect(() => { load(); }, [docType, category]);

  const apply = () => {
    const tpl = templates.find(t => t.id === selectedId);
    if (!tpl) return;
    // payload holds defaults like { business, vatRatePercent, notes, terms, paymentDetails, ... }
    const p = tpl.payload || {};
    setDraft(d => ({
      ...d,
      ...p,
      business: { ...d.business, ...(p.business || {}) },
    }));
  };

  const save = async () => {
    const payload = {
      business: draft.business,
      vatRatePercent: draft.vatRatePercent,
      notes: draft.notes,
      terms: draft.terms,
      payment: draft.payment,
      reminderText: draft.reminderText,
      // add other defaults you want captured
    };

    const { error } = await supabase.from("paperwork_templates").insert({
      name: name || `${docType} template`,
      category,
      doc_type: docType,
      payload,
      owner_id: (await supabase.auth.getUser()).data.user.id,
    });

    if (!error) {
      setName("");
      await load();
    }
  };

  const del = async (id) => {
    await supabase.from("paperwork_templates").delete().eq("id", id);
    await load();
  };

  return (
    <div className="tpl">
      <div className="tplRow">
        <div className="tplLabel">Category</div>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="tplRow">
        <div className="tplLabel">Templates</div>
        <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select…</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="btn" type="button" onClick={apply} disabled={!selectedId}>Apply</button>
        <button className="btn" type="button" onClick={load}>Refresh</button>
      </div>

      <div className="tplRow">
        <input className="input" placeholder="New template name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" type="button" onClick={save}>Save current as template</button>
      </div>

      <div className="tplList">
        {templates.map((t) => (
          <div className="tplItem" key={t.id}>
            <div className="tplName">{t.name}</div>
            <button className="btn danger" type="button" onClick={() => del(t.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}