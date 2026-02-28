import React from "react";
import { nanoid } from "nanoid";
import { moneyGBP } from "../utils/money";

export default function LineItemsEditor({ items, setItems }) {
  const add = () => {
    setItems((prev) => [
      ...prev,
      { id: nanoid(), description: "", qty: 1, unitPrice: 0 },
    ]);
  };

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  const update = (id, patch) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  };

  return (
    <div className="li">
      <div className="li-head">
        <div>Description</div>
        <div className="right">Qty</div>
        <div className="right">Unit</div>
        <div className="right">Line</div>
        <div />
      </div>

      {items.map((it) => {
        const line = Number(it.qty || 0) * Number(it.unitPrice || 0);
        return (
          <div className="li-row" key={it.id}>
            <input
              className="input"
              placeholder="e.g. Supply & install 600x600 paving slabs..."
              value={it.description}
              onChange={(e) => update(it.id, { description: e.target.value })}
            />
            <input
              className="input right"
              type="number"
              min="0"
              step="1"
              value={it.qty}
              onChange={(e) => update(it.id, { qty: Number(e.target.value) })}
            />
            <input
              className="input right"
              type="number"
              min="0"
              step="0.01"
              value={it.unitPrice}
              onChange={(e) => update(it.id, { unitPrice: Number(e.target.value) })}
            />
            <div className="right mono">{moneyGBP(line)}</div>
            <button className="btn danger" type="button" onClick={() => remove(it.id)}>
              Remove
            </button>
          </div>
        );
      })}

      <div className="li-actions">
        <button className="btn" type="button" onClick={add}>
          + Add line item
        </button>
      </div>
    </div>
  );
}