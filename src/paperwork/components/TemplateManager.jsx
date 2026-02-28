import React, { useEffect, useMemo, useState } from "react";
import {
  applyTemplateToDraft,
  createTemplateFromDraft,
  deleteTemplate,
  listTemplates,
  saveTemplate,
} from "../utils/templates";

export default function TemplateManager({ docType, draft, setDraft, makeTemplatePick }) {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setTemplates(listTemplates());
  }, []);

  const options = useMemo(() => templates, [templates]);

  const onSaveTemplate = () => {
    const pick = typeof makeTemplatePick === "function" ? makeTemplatePick(draft) : {};
    const tpl = createTemplateFromDraft(name || `${docType} template`, draft, pick);
    setTemplates(saveTemplate(tpl));
    setName("");
  };

  const onApply = (id) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setDraft((d) => applyTemplateToDraft(d, tpl, docType));
  };

  const onDelete = (id) => setTemplates(deleteTemplate(id));

  return (
    <div className="tpl">
      <div className="tplRow">
        <div className="tplLabel">Templates</div>

        <select className="input" defaultValue="" onChange={(e) => onApply(e.target.value)}>
          <option value="" disabled>
            Apply a template…
          </option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button className="btn" type="button" onClick={() => setTemplates(listTemplates())}>
          Refresh
        </button>
      </div>

      <div className="tplRow">
        <input
          className="input"
          placeholder="New template name (e.g. ‘Standard Residential’)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" type="button" onClick={onSaveTemplate}>
          Save current as template
        </button>
      </div>

      {templates.length > 0 && (
        <div className="tplList">
          {templates.map((t) => (
            <div className="tplItem" key={t.id}>
              <div className="tplName">{t.name}</div>
              <button className="btn danger" type="button" onClick={() => onDelete(t.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}