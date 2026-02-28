export const builderStyles = `
  .wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }
  .topbar { display:flex; align-items:flex-end; justify-content:space-between; gap: 16px; margin-bottom: 16px; }
  h1 { margin: 0; font-size: 24px; }
  h2 { margin: 0 0 10px; font-size: 16px; }
  .subtle { color:#6b7280; margin: 6px 0 0; }
  .grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .wide { grid-column: 1 / -1; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius: 14px; padding: 14px; box-shadow: 0 10px 28px rgba(0,0,0,0.04); }
  .form { display:grid; grid-template-columns: 1fr; gap: 10px; }
  .form.two { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  label { display:flex; flex-direction:column; gap: 6px; }
  .lbl { font-size: 11px; letter-spacing: .06em; font-weight: 700; color:#374151; }
  .input { height: 40px; border-radius: 10px; border: 1px solid #e5e7eb; padding: 0 12px; outline: none; background:#fff; }
  .input:focus { border-color:#cbd5e1; box-shadow: 0 0 0 4px rgba(148,163,184,.25); }
  .textarea { min-height: 120px; border-radius: 12px; border: 1px solid #e5e7eb; padding: 10px 12px; outline:none; resize: vertical; background:#fff; }
  .textarea:focus { border-color:#cbd5e1; box-shadow: 0 0 0 4px rgba(148,163,184,.25); }
  .rowBetween { display:flex; align-items:center; justify-content:space-between; gap: 10px; margin-bottom: 10px; }
  .inline { display:flex; align-items:center; gap: 10px; flex-direction:row; }
  .small { width: 120px; }
  .right { text-align:right; }
  .mono { font-variant-numeric: tabular-nums; }
  .strong { font-weight: 800; }

  /* line items */
  .li { border:1px solid #e5e7eb; border-radius: 12px; overflow:hidden; }
  .li-head, .li-row { display:grid; grid-template-columns: 1.2fr 90px 120px 120px 90px; gap: 10px; padding: 10px; align-items:center; }
  .li-head { background:#f9fafb; font-size: 11px; font-weight: 800; color:#374151; }
  .li-row { border-top:1px solid #f3f4f6; }
  .li-actions { padding: 10px; border-top:1px solid #f3f4f6; display:flex; justify-content:flex-start; }

  .btn { height: 40px; border-radius: 10px; border: 1px solid #e5e7eb; background:#fff; padding: 0 14px; font-weight: 800; cursor:pointer; }
  .btn:hover { filter: brightness(0.98); }
  .btn.primary { border-color:#111; background:#111; color:#fff; }
  .btn.danger { border-color:#fecaca; background:#fff; }
  .actions { display:flex; gap: 10px; align-items:center; }

  .totals { margin-top: 12px; display:flex; flex-direction:column; gap: 6px; align-items:flex-end; }
  .totals > div { width: 320px; display:flex; justify-content:space-between; }
  .totals .strong { font-size: 14px; }

  /* templates */
  .tpl { border:1px solid #e5e7eb; border-radius: 14px; padding: 12px; display:flex; flex-direction:column; gap: 10px; }
  .tplRow { display:flex; gap: 10px; align-items:center; }
  .tplLabel { font-size: 11px; letter-spacing: .06em; font-weight: 900; color:#374151; min-width: 90px; }
  .tplList { display:flex; flex-direction:column; gap: 8px; }
  .tplItem { display:flex; align-items:center; justify-content:space-between; border:1px solid #f3f4f6; border-radius: 12px; padding: 10px; background:#fafafa; }
  .tplName { font-weight: 900; color:#111; }

  @media (max-width: 980px) {
    .grid { grid-template-columns: 1fr; }
    .li-head, .li-row { grid-template-columns: 1fr 70px 90px 100px 90px; }
  }
`;