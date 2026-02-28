import { nanoid } from "nanoid";

const KEY = "paperwork.templates.v1";

/**
 * Template shape:
 * {
 *   id, name,
 *   business: {...},
 *   defaults: {
 *     quoteNotes, quoteTerms,
 *     invoiceNotes, paymentDetails,
 *     scheduleNotes,
 *     workOrderNotes,
 *     reminderText,
 *     vatRatePercent
 *   }
 * }
 */

export function listTemplates() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(tpl) {
  const templates = listTemplates();
  const next = [...templates.filter(t => t.id !== tpl.id), tpl];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function createTemplateFromDraft(name, draft, pick = {}) {
  // pick can override what to store
  const tpl = {
    id: nanoid(),
    name: name || "Template",
    business: draft.business || {},
    defaults: {
      vatRatePercent: Number(draft.vatRatePercent ?? 0),

      quoteNotes: draft.notes ?? "",
      quoteTerms: draft.terms ?? "",

      invoiceNotes: draft.notes ?? "",
      paymentDetails: draft.payment ?? "",

      scheduleNotes: draft.notes ?? "",

      workOrderNotes: draft.notes ?? "",

      reminderText: draft.reminderText ?? "",
      ...pick,
    },
  };
  return tpl;
}

export function deleteTemplate(id) {
  const templates = listTemplates().filter(t => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(templates));
  return templates;
}

export function applyTemplateToDraft(draft, tpl, docType) {
  // docType: "quote" | "invoice" | "schedule" | "workorder" | "receipt" | "reminder"
  const d = structuredClone(draft);

  // always apply business + vat default if present
  if (tpl.business) d.business = { ...d.business, ...tpl.business };
  if (tpl.defaults && typeof tpl.defaults.vatRatePercent === "number") {
    d.vatRatePercent = tpl.defaults.vatRatePercent;
  }

  const defs = tpl.defaults || {};
  if (docType === "quote") {
    if (defs.quoteNotes != null) d.notes = defs.quoteNotes;
    if (defs.quoteTerms != null) d.terms = defs.quoteTerms;
  }
  if (docType === "invoice") {
    if (defs.invoiceNotes != null) d.notes = defs.invoiceNotes;
    if (defs.paymentDetails != null) d.payment = defs.paymentDetails;
  }
  if (docType === "schedule") {
    if (defs.scheduleNotes != null) d.notes = defs.scheduleNotes;
  }
  if (docType === "workorder") {
    if (defs.workOrderNotes != null) d.notes = defs.workOrderNotes;
  }
  if (docType === "reminder") {
    if (defs.reminderText != null) d.reminderText = defs.reminderText;
  }

  return d;
}