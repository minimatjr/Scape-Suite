import React from "react";
import { pdf } from "@react-pdf/renderer";

export default function PaperworkActions({ documentEl, filename }) {
  const download = async () => {
    const blob = await pdf(documentEl).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const print = async () => {
    const blob = await pdf(documentEl).toBlob();
    const url = URL.createObjectURL(blob);

    const w = window.open(url);
    if (!w) return;

    // wait a moment for the PDF viewer
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);

    // cleanup later
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  };

  return (
    <div className="actions">
      <button className="btn primary" type="button" onClick={download}>
        Download PDF
      </button>
      <button className="btn" type="button" onClick={print}>
        Print
      </button>
    </div>
  );
}