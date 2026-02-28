import { useState, useCallback } from "react";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:#0E1012; --surface:#161A1D; --panel:#1C2126;
      --border:#2A3038; --border2:#323C46;
      --text:#C8CDD4; --text-dim:#5A6472; --text-mute:#3A4450;
      --grass:#4A8A42; --grass-lt:#6AAA60; --grass-dk:#2A5A22;
      --soil:#6A5040; --soil-lt:#8A7060; --soil-dk:#4A3020;
      --sand:#D8C890; --gravel:#8A7860;
      --cream:#E8DCC8; --white:#F2EEE6;
      --pro-col:#7A9EC8; --diy-col:#6AAA60;
      --turf-col:#4A8A42; --topsoil-col:#6A5040; --seed-col:#C8B060;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;

      /* Optional: make sure these exist to avoid "undefined" lookups */
      --locked: #0b0d0f;
      --locked-txt: #6b7280;
    }

    html, body { height: 100%; }
    body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  height: 100%;
  overflow: hidden;
    }

    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const PROJECT_TYPES = [
  { id: "new-lawn", label: "New Lawn", icon: "🌱", desc: "Starting from bare soil or cleared ground" },
  { id: "lawn-repair", label: "Lawn Repair", icon: "🔧", desc: "Patching bare spots or damaged areas" },
  { id: "level-lawn", label: "Level & Resurface", icon: "📐", desc: "Adding topsoil to level uneven lawn" },
  { id: "raised-bed", label: "Raised Lawn Area", icon: "⬆", desc: "Building up lawn level with topsoil" },
];

const COVERAGE_TYPES = [
  { id: "turf", label: "Turf Rolls", icon: "▬", desc: "Pre-grown grass rolls (typically 1m²)", color: "var(--turf-col)" },
  { id: "seed", label: "Grass Seed", icon: "•", desc: "Seed for growing new lawn", color: "var(--seed-col)" },
  { id: "topsoil-only", label: "Topsoil Only", icon: "▤", desc: "Just topsoil, no grass", color: "var(--topsoil-col)" },
];

const TURF_SPECS = {
  standard: { name: "Standard Turf Roll", width: 610, length: 1220, area: 0.744, thickness: 25 },
  premium: { name: "Premium Turf Roll", width: 610, length: 2440, area: 1.488, thickness: 30 },
  budget: { name: "Budget Turf Roll", width: 400, length: 1000, area: 0.4, thickness: 20 },
};

const SEED_RATES = {
  standard: { name: "Standard Mix", rate: 35, desc: "35g/m² - general purpose" },
  premium: { name: "Premium Mix", rate: 50, desc: "50g/m² - luxury lawn" },
  hardwearing: { name: "Hardwearing Mix", rate: 40, desc: "40g/m² - family/pet lawn" },
  shade: { name: "Shade Tolerant", rate: 45, desc: "45g/m² - under trees" },
  overseeding: { name: "Overseeding", rate: 20, desc: "20g/m² - thickening existing lawn" },
};

const VIEWS = ["PLAN", "SECTION", "BOTH"];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const mm = (v) => parseFloat(v) || 0;
const r2 = (n) => Math.round(n * 100) / 100;
const CEI = Math.ceil;
const fmm = (v) => (v >= 1000 ? `${r2(v / 1000).toFixed(2)}m` : `${Math.round(v)}mm`);

/* ─── CALCULATION ENGINE ─────────────────────────────────────────────────── */
function calcTurf(s) {
  const length = mm(s.length);
  const width = mm(s.width);
  const topsoilDepth = mm(s.topsoilDepth);

  if (!length || !width) return null;

  const area = (length / 1000) * (width / 1000); // m²
  const waste = 1 + mm(s.waste) / 100;
  const coverageType = s.coverageType;
  const projectType = s.projectType;

  // Topsoil calculations
  const topsoilVolume = area * (topsoilDepth / 1000); // m³
  const topsoilTonnes = r2(topsoilVolume * 1.4); // ~1.4 tonnes per m³
  const topsoilBulkBags = r2(topsoilVolume / 0.5); // 0.5m³ per bulk bag
  const topsoilKg = CEI(topsoilTonnes * 1000);

  // Turf calculations
  let turfRolls = 0;
  let turfSpec = null;
  if (coverageType === "turf") {
    turfSpec = TURF_SPECS[s.turfGrade];
    turfRolls = CEI((area / turfSpec.area) * waste);
  }

  // Seed calculations
  let seedKg = 0;
  let seedSpec = null;
  if (coverageType === "seed") {
    seedSpec = SEED_RATES[s.seedType];
    seedKg = r2((area * seedSpec.rate / 1000) * waste); // convert g to kg
  }

  // Preparation materials
  const prepSandKg = s.addSand ? CEI(area * 5 * waste) : 0; // 5kg/m² for leveling
  const fertilizerKg = s.addFertilizer ? r2(area * 0.035 * waste) : 0; // 35g/m²

  // Edging (if enabled)
  const perimeterM = s.addEdging ? ((length + width) * 2) / 1000 : 0;
  const edgingPieces = s.addEdging ? CEI(perimeterM / 1) : 0; // 1m edging pieces
  const edgingPegs = s.addEdging ? CEI(perimeterM * 3) : 0; // 3 pegs per metre

  return {
    length,
    width,
    area: r2(area),
    projectType,
    coverageType,
    topsoil: {
      depth: topsoilDepth,
      volume: r2(topsoilVolume),
      tonnes: topsoilTonnes,
      bulkBags: topsoilBulkBags,
      kg: topsoilKg,
    },
    turf:
      coverageType === "turf"
        ? {
            rolls: turfRolls,
            spec: turfSpec,
            grade: s.turfGrade,
            coverage: r2(turfRolls * turfSpec.area),
          }
        : null,
    seed:
      coverageType === "seed"
        ? {
            kg: seedKg,
            spec: seedSpec,
            type: s.seedType,
            grams: CEI(seedKg * 1000),
          }
        : null,
    prep: {
      sandKg: prepSandKg,
      fertilizerKg,
    },
    edging: s.addEdging
      ? {
          perimeter: r2(perimeterM),
          pieces: edgingPieces,
          pegs: edgingPegs,
        }
      : null,
    waste: mm(s.waste),
  };
}

/* ─── SVG PLAN VIEW ───────────────────────────────────────────────────────── */
function LawnPlan({ calc }) {
  if (!calc)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="8" width="48" height="48" rx="4" stroke="#2A3038" strokeWidth="2" strokeDasharray="4,4" />
          <path d="M20 40 Q32 20 44 40" stroke="#4A8A42" strokeWidth="2" fill="none" />
          <circle cx="28" cy="32" r="2" fill="#4A8A42" />
          <circle cx="36" cy="28" r="2" fill="#4A8A42" />
        </svg>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>
          ENTER DIMENSIONS TO GENERATE PLAN
        </span>
      </div>
    );

  const { length, width, area, coverageType, turf } = calc;

  const PAD = 60;
  const SVG_W = 500,
    SVG_H = 400;
  const drawW = SVG_W - PAD * 2;
  const drawH = SVG_H - PAD * 2;

  const scaleX = drawW / length;
  const scaleY = drawH / width;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  const lawnW = length * scale;
  const lawnH = width * scale;
  const ox = (SVG_W - lawnW) / 2;
  const oy = (SVG_H - lawnH) / 2;

  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;

  // Lawn area fill
  els.push(<rect key={k()} x={ox} y={oy} width={lawnW} height={lawnH} fill="#3A6A32" stroke="#4A8A42" strokeWidth="2" rx="4" />);

  // Grass texture
  for (let i = 0; i < 60; i++) {
    const gx = ox + 10 + Math.random() * (lawnW - 20);
    const gy = oy + 10 + Math.random() * (lawnH - 20);
    const gh = 4 + Math.random() * 6;
    els.push(
      <line
        key={k()}
        x1={gx}
        y1={gy}
        x2={gx + (Math.random() - 0.5) * 3}
        y2={gy - gh}
        stroke="#5AAA52"
        strokeWidth="1"
        opacity={0.4 + Math.random() * 0.3}
      />
    );
  }

  // Turf roll lines (if turf selected)
  if (coverageType === "turf" && turf) {
    const rollW = (turf.spec.width * scale) / 1000;
    const numRollsAcross = Math.ceil(lawnW / rollW);
    for (let i = 1; i < numRollsAcross; i++) {
      const rx = ox + i * rollW;
      if (rx < ox + lawnW - 5) {
        els.push(<line key={k()} x1={rx} y1={oy + 5} x2={rx} y2={oy + lawnH - 5} stroke="#2A5A22" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />);
      }
    }
  }

  // Dimension lines
  // Width (top)
  els.push(<line key={k()} x1={ox} y1={oy - 25} x2={ox + lawnW} y2={oy - 25} stroke="var(--text-dim)" strokeWidth="1" />);
  els.push(<line key={k()} x1={ox} y1={oy - 30} x2={ox} y2={oy - 20} stroke="var(--text-dim)" strokeWidth="1" />);
  els.push(<line key={k()} x1={ox + lawnW} y1={oy - 30} x2={ox + lawnW} y2={oy - 20} stroke="var(--text-dim)" strokeWidth="1" />);
  els.push(
    <text key={k()} x={ox + lawnW / 2} y={oy - 32} textAnchor="middle" fill="var(--text-dim)" fontFamily="IBM Plex Mono" fontSize="11">
      {fmm(length)}
    </text>
  );

  // Length (right)
  els.push(<line key={k()} x1={ox + lawnW + 25} y1={oy} x2={ox + lawnW + 25} y2={oy + lawnH} stroke="var(--text-dim)" strokeWidth="1" />);
  els.push(<line key={k()} x1={ox + lawnW + 20} y1={oy} x2={ox + lawnW + 30} y2={oy} stroke="var(--text-dim)" strokeWidth="1" />);
  els.push(<line key={k()} x1={ox + lawnW + 20} y1={oy + lawnH} x2={ox + lawnW + 30} y2={oy + lawnH} stroke="var(--text-dim)" strokeWidth="1" />);
  els.push(
    <text
      key={k()}
      x={ox + lawnW + 38}
      y={oy + lawnH / 2}
      textAnchor="middle"
      fill="var(--text-dim)"
      fontFamily="IBM Plex Mono"
      fontSize="11"
      transform={`rotate(90, ${ox + lawnW + 38}, ${oy + lawnH / 2})`}
    >
      {fmm(width)}
    </text>
  );

  // Area label
  els.push(
    <text key={k()} x={ox + lawnW / 2} y={oy + lawnH / 2} textAnchor="middle" fill="var(--white)" fontFamily="IBM Plex Mono" fontSize="14" fontWeight="600">
      {area} m²
    </text>
  );

  return (
    <svg width={SVG_W} height={SVG_H} style={{ maxWidth: "100%", height: "auto" }}>
      {els}
    </svg>
  );
}

/* ─── SVG SECTION VIEW ────────────────────────────────────────────────────── */
function LawnSection({ calc }) {
  if (!calc)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="32" width="48" height="16" fill="#5A4030" stroke="#6A5040" strokeWidth="1" />
          <rect x="8" y="28" width="48" height="4" fill="#4A8A42" />
          <line x1="56" y1="28" x2="62" y2="28" stroke="#3A4450" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="56" y1="48" x2="62" y2="48" stroke="#3A4450" strokeWidth="1" strokeDasharray="2,2" />
        </svg>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>
          ENTER DIMENSIONS TO GENERATE SECTION
        </span>
      </div>
    );

  const { topsoil, coverageType, turf } = calc;

  const PAD_L = 80,
    PAD_R = 60,
    PAD_T = 60,
    PAD_B = 60;
  const SVG_W = 500,
    SVG_H = 300;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;

  // Layers
  const turfThickness = coverageType === "turf" && turf ? turf.spec.thickness : 0;
  const seedLayer = coverageType === "seed" ? 5 : 0;
  const totalDepth = topsoil.depth + turfThickness + seedLayer + 50; // +50 for subsoil

  const scale = Math.min(drawW / 600, drawH / totalDepth) * 0.8;

  const sectionW = 500 * scale;
  const topsoilH = topsoil.depth * scale;
  const turfH = turfThickness * scale;
  const seedH = seedLayer * scale;
  const subsoilH = 50 * scale;

  const ox = PAD_L;
  const surfaceY = PAD_T + turfH + seedH;

  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;

  // Subsoil (existing ground)
  els.push(<rect key={k()} x={ox} y={surfaceY + topsoilH} width={sectionW} height={subsoilH} fill="#4A3828" />);
  for (let i = 0; i < 20; i++) {
    const sx = ox + Math.random() * sectionW;
    const sy = surfaceY + topsoilH + 5 + Math.random() * (subsoilH - 10);
    els.push(<circle key={k()} cx={sx} cy={sy} r={1 + Math.random() * 3} fill="#3A2818" opacity="0.5" />);
  }
  els.push(
    <text key={k()} x={ox + sectionW / 2} y={surfaceY + topsoilH + subsoilH / 2 + 4} textAnchor="middle" fill="#6A5848" fontFamily="IBM Plex Mono" fontSize="10">
      EXISTING SUBSOIL
    </text>
  );

  // Topsoil layer
  els.push(<rect key={k()} x={ox} y={surfaceY} width={sectionW} height={topsoilH} fill="#5A4530" stroke="#6A5540" strokeWidth="1" />);
  for (let i = 0; i < 30; i++) {
    const tx = ox + Math.random() * sectionW;
    const ty = surfaceY + 5 + Math.random() * (topsoilH - 10);
    els.push(<circle key={k()} cx={tx} cy={ty} r={1 + Math.random() * 2} fill="#4A3520" opacity="0.6" />);
  }

  // Turf layer (if applicable)
  if (coverageType === "turf" && turfH > 0) {
    els.push(<rect key={k()} x={ox} y={surfaceY - turfH} width={sectionW} height={turfH} fill="#4A7A42" stroke="#5A8A52" strokeWidth="1" />);
    // Grass blades
    for (let i = 0; i < 40; i++) {
      const gx = ox + 5 + Math.random() * (sectionW - 10);
      const gy = surfaceY - turfH;
      const gh = 6 + Math.random() * 8;
      els.push(<line key={k()} x1={gx} y1={gy} x2={gx + (Math.random() - 0.5) * 4} y2={gy - gh} stroke="#6AAA60" strokeWidth="1.5" />);
    }
    // Root zone indication
    for (let i = 0; i < 15; i++) {
      const rx = ox + 20 + Math.random() * (sectionW - 40);
      const ry = surfaceY - turfH + turfH * 0.3;
      const rh = turfH * 0.6;
      els.push(<line key={k()} x1={rx} y1={ry} x2={rx + (Math.random() - 0.5) * 3} y2={ry + rh} stroke="#3A5A32" strokeWidth="0.5" opacity="0.5" />);
    }
  }

  // Seed layer indicator (if applicable)
  if (coverageType === "seed" && seedH > 0) {
    for (let i = 0; i < 25; i++) {
      const sx = ox + 10 + Math.random() * (sectionW - 20);
      const sy = surfaceY - seedH / 2;
      els.push(<circle key={k()} cx={sx} cy={sy} r={1.5} fill="#C8B060" opacity="0.8" />);
    }
    // Young grass shoots
    for (let i = 0; i < 15; i++) {
      const gx = ox + 15 + Math.random() * (sectionW - 30);
      const gy = surfaceY - seedH;
      const gh = 3 + Math.random() * 5;
      els.push(<line key={k()} x1={gx} y1={gy} x2={gx} y2={gy - gh} stroke="#7ABA70" strokeWidth="1" opacity="0.7" />);
    }
  }

  // Dimension lines
  // Topsoil depth (right side)
  const dimX = ox + sectionW + 20;
  els.push(<line key={k()} x1={dimX} y1={surfaceY} x2={dimX} y2={surfaceY + topsoilH} stroke="var(--soil-lt)" strokeWidth="1" />);
  els.push(<line key={k()} x1={dimX - 5} y1={surfaceY} x2={dimX + 5} y2={surfaceY} stroke="var(--soil-lt)" strokeWidth="1" />);
  els.push(<line key={k()} x1={dimX - 5} y1={surfaceY + topsoilH} x2={dimX + 5} y2={surfaceY + topsoilH} stroke="var(--soil-lt)" strokeWidth="1" />);
  els.push(
    <text key={k()} x={dimX + 12} y={surfaceY + topsoilH / 2 + 4} fill="var(--soil-lt)" fontFamily="IBM Plex Mono" fontSize="10">
      {fmm(topsoil.depth)}
    </text>
  );

  // Turf thickness (if applicable)
  if (coverageType === "turf" && turfH > 0) {
    const turfDimX = ox + sectionW + 60;
    els.push(<line key={k()} x1={turfDimX} y1={surfaceY - turfH} x2={turfDimX} y2={surfaceY} stroke="var(--grass-lt)" strokeWidth="1" />);
    els.push(<line key={k()} x1={turfDimX - 5} y1={surfaceY - turfH} x2={turfDimX + 5} y2={surfaceY - turfH} stroke="var(--grass-lt)" strokeWidth="1" />);
    els.push(<line key={k()} x1={turfDimX - 5} y1={surfaceY} x2={turfDimX + 5} y2={surfaceY} stroke="var(--grass-lt)" strokeWidth="1" />);
    els.push(
      <text key={k()} x={turfDimX + 12} y={surfaceY - turfH / 2 + 4} fill="var(--grass-lt)" fontFamily="IBM Plex Mono" fontSize="10">
        {fmm(turfThickness)}
      </text>
    );
  }

  // Layer labels (left side)
  if (coverageType === "turf" && turfH > 0) {
    els.push(
      <text key={k()} x={ox - 10} y={surfaceY - turfH / 2 + 4} textAnchor="end" fill="var(--grass-lt)" fontFamily="IBM Plex Mono" fontSize="9">
        TURF
      </text>
    );
  }
  if (coverageType === "seed") {
    els.push(
      <text key={k()} x={ox - 10} y={surfaceY - seedH / 2} textAnchor="end" fill="var(--seed-col)" fontFamily="IBM Plex Mono" fontSize="9">
        SEED
      </text>
    );
  }
  els.push(
    <text key={k()} x={ox - 10} y={surfaceY + topsoilH / 2 + 4} textAnchor="end" fill="var(--soil-lt)" fontFamily="IBM Plex Mono" fontSize="9">
      TOPSOIL
    </text>
  );

  return (
    <svg width={SVG_W} height={SVG_H} style={{ maxWidth: "100%", height: "auto" }}>
      {els}
    </svg>
  );
}

/* ─── MATERIALS LIST ─────────────────────────────────────────────────────── */
function MaterialsList({ calc }) {
  if (!calc)
    return (
      <div style={{ padding: 24, color: "var(--text-mute)", fontFamily: "var(--mono)", fontSize: "0.72rem", textAlign: "center" }}>
        No calculations yet
      </div>
    );

  const items = [];

  // Topsoil
  if (calc.topsoil.depth > 0) {
    items.push({
      category: "TOPSOIL",
      color: "var(--topsoil-col)",
      rows: [
        { label: "Volume Required", value: `${calc.topsoil.volume} m³` },
        { label: "Weight (approx)", value: `${calc.topsoil.tonnes} tonnes` },
        { label: "Bulk Bags (0.5m³)", value: `${CEI(calc.topsoil.bulkBags)} bags` },
      ],
    });
  }

  // Turf
  if (calc.turf) {
    items.push({
      category: "TURF",
      color: "var(--turf-col)",
      rows: [
        { label: calc.turf.spec.name, value: `${calc.turf.rolls} rolls` },
        { label: "Coverage", value: `${calc.turf.coverage} m²` },
        { label: "Roll Size", value: `${calc.turf.spec.width}×${calc.turf.spec.length}mm` },
      ],
    });
  }

  // Seed
  if (calc.seed) {
    items.push({
      category: "GRASS SEED",
      color: "var(--seed-col)",
      rows: [
        { label: calc.seed.spec.name, value: `${calc.seed.kg} kg` },
        { label: "Application Rate", value: calc.seed.spec.desc },
        { label: "Total Grams", value: `${calc.seed.grams} g` },
      ],
    });
  }

  // Preparation materials
  if (calc.prep.sandKg > 0 || calc.prep.fertilizerKg > 0) {
    const prepRows = [];
    if (calc.prep.sandKg > 0) prepRows.push({ label: "Leveling Sand", value: `${calc.prep.sandKg} kg` });
    if (calc.prep.fertilizerKg > 0) prepRows.push({ label: "Starter Fertilizer", value: `${calc.prep.fertilizerKg} kg` });
    items.push({
      category: "PREPARATION",
      color: "var(--sand)",
      rows: prepRows,
    });
  }

  // Edging
  if (calc.edging) {
    items.push({
      category: "EDGING",
      color: "var(--text)",
      rows: [
        { label: "Perimeter", value: `${calc.edging.perimeter} m` },
        { label: "Edging Pieces (1m)", value: `${calc.edging.pieces} pcs` },
        { label: "Fixing Pegs", value: `${calc.edging.pegs} pcs` },
      ],
    });
  }

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.14em", marginBottom: 16 }}>
        MATERIALS LIST
      </div>

      {items.map((cat, ci) => (
        <div key={ci} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: cat.color, letterSpacing: "0.12em", marginBottom: 8, fontWeight: 600 }}>
            {cat.category}
          </div>
          {cat.rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-dim)" }}>{row.label}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text)", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(106,170,96,0.1)", borderRadius: 6, border: "1px solid rgba(106,170,96,0.25)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--grass-lt)", letterSpacing: "0.1em" }}>{calc.waste}% WASTE FACTOR INCLUDED</div>
      </div>
    </div>
  );
}

/* ─── UI COMPONENTS ──────────────────────────────────────────────────────── */
const Field = ({ label, value, onChange, unit, hint, small, disabled }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>{label}</span>
      {hint && <span style={{ fontFamily: "var(--mono)", fontSize: "0.54rem", color: "var(--text-mute)" }}>{hint}</span>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: small ? 80 : "100%",
          padding: "8px 10px",
          background: disabled ? "var(--locked)" : "var(--bg)",
          border: `1px solid ${disabled ? "var(--locked)" : "var(--border2)"}`,
          borderRadius: 4,
          color: disabled ? "var(--locked-txt)" : "var(--text)",
          fontFamily: "var(--mono)",
          fontSize: "0.82rem",
          outline: "none",
        }}
      />
      {unit && <span style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--text-mute)", minWidth: 30 }}>{unit}</span>}
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange, accent, sub }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 0",
      cursor: "pointer",
      opacity: checked ? 1 : 0.6,
    }}
  >
    <div
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? accent : "var(--border)",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          background: "var(--white)",
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          transition: "left 0.2s",
        }}
      />
    </div>
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--text)" }}>{label}</div>
      {sub && <div style={{ fontFamily: "var(--mono)", fontSize: "0.54rem", color: "var(--text-mute)" }}>{sub}</div>}
    </div>
  </div>
);

const PanelSection = ({ title, accent, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        fontFamily: "var(--mono)",
        fontSize: "0.58rem",
        color: accent || "var(--text-dim)",
        letterSpacing: "0.12em",
        marginBottom: 12,
        fontWeight: 600,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          flex: 1,
          padding: "10px 8px",
          background: "transparent",
          border: "none",
          borderBottom: active === t.id ? `2px solid ${t.color || "var(--grass-lt)"}` : "2px solid transparent",
          color: active === t.id ? t.color || "var(--grass-lt)" : "var(--text-dim)",
          fontFamily: "var(--mono)",
          fontSize: "0.62rem",
          letterSpacing: "0.1em",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {t.label}
      </button>
    ))}
  </div>
);

const TypeSelector = ({ types, active, onChange, small }) => (
  <div style={{ display: "grid", gridTemplateColumns: small ? "repeat(2, 1fr)" : "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
    {types.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          padding: "10px 12px",
          background: active === t.id ? "var(--panel)" : "var(--bg)",
          border: `1px solid ${active === t.id ? t.color || "var(--grass)" : "var(--border)"}`,
          borderRadius: 6,
          color: active === t.id ? t.color || "var(--grass-lt)" : "var(--text-dim)",
          fontFamily: "var(--mono)",
          fontSize: "0.64rem",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s",
        }}
      >
        <span style={{ marginRight: 6 }}>{t.icon}</span>
        {t.label}
      </button>
    ))}
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function TurfTopsoilCalculator() {
  const [view, setView] = useState("PLAN");
  const [tab, setTab] = useState("dimensions");
  const [showList, setShowList] = useState(true);

  const [projectType, setProjectType] = useState("new-lawn");
  const [coverageType, setCoverageType] = useState("turf");

  const [dims, setDims] = useState({
    length: "5000",
    width: "4000",
    topsoilDepth: "100",
    waste: "10",
  });

  const [turfGrade, setTurfGrade] = useState("standard");
  const [seedType, setSeedType] = useState("standard");

  const [extras, setExtras] = useState({
    addSand: false,
    addFertilizer: true,
    addEdging: false,
  });

  const set = useCallback((key) => (val) => setDims((d) => ({ ...d, [key]: val })), []);

  const result = calcTurf({
    ...dims,
    projectType,
    coverageType,
    turfGrade,
    seedType,
    ...extras,
  });

  const tabs = [
    { id: "dimensions", label: "DIMENSIONS", color: "var(--grass-lt)" },
    { id: "coverage", label: "COVERAGE", color: "var(--turf-col)" },
    { id: "extras", label: "EXTRAS", color: "var(--sand)" },
  ];

  return (
    // ✅ Key layout fix: ensure this flex container can fill the layout cell
    // and doesn't "refuse" to shrink (minHeight: 0).
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <GlobalStyle />

      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, var(--grass) 0%, var(--grass-dk) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "14px" }}>🌱</span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", fontWeight: 600, color: "var(--text)", letterSpacing: "0.04em" }}>
                TURF & TOPSOIL
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.54rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>CALCULATOR</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 6, padding: 3 }}>
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 12px",
                  background: view === v ? "var(--panel)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  color: view === v ? "var(--grass-lt)" : "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Materials toggle */}
          <button
            onClick={() => setShowList(!showList)}
            style={{
              padding: "6px 12px",
              background: showList ? "var(--panel)" : "transparent",
              border: `1px solid ${showList ? "var(--grass)" : "var(--border)"}`,
              borderRadius: 4,
              color: showList ? "var(--grass-lt)" : "var(--text-dim)",
              fontFamily: "var(--mono)",
              fontSize: "0.58rem",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            MATERIALS
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {/* ✅ Key layout fix: minHeight: 0 on flex children so they can actually use available space */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        {/* LEFT PANEL */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border)",
            background: "var(--surface)",
            
          }}
        >
          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 16px" }}>
            {/* DIMENSIONS TAB */}
            {tab === "dimensions" && (
              <>
                <PanelSection title="PROJECT TYPE" accent="var(--grass-lt)">
                  <TypeSelector types={PROJECT_TYPES} active={projectType} onChange={setProjectType} />
                </PanelSection>

                <PanelSection title="LAWN DIMENSIONS" accent="var(--text)">
                  <Field label="Length" value={dims.length} onChange={set("length")} unit="mm" />
                  <Field label="Width" value={dims.width} onChange={set("width")} unit="mm" />
                </PanelSection>

                <PanelSection title="TOPSOIL" accent="var(--soil-lt)">
                  <Field label="Topsoil Depth" value={dims.topsoilDepth} onChange={set("topsoilDepth")} unit="mm" hint="typically 100-150mm" />
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(90,69,48,0.15)", border: "1px solid rgba(90,69,48,0.3)", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>
                      AREA SUMMARY
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Lawn Area", v: `${result.area} m²` },
                        { l: "Topsoil Vol", v: `${result.topsoil.volume} m³` },
                        { l: "Topsoil", v: `${result.topsoil.tonnes} t` },
                        { l: "Bulk Bags", v: `${CEI(result.topsoil.bulkBags)}` },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--soil-lt)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* COVERAGE TAB */}
            {tab === "coverage" && (
              <>
                <PanelSection title="COVERAGE TYPE" accent="var(--grass-lt)">
                  <TypeSelector types={COVERAGE_TYPES} active={coverageType} onChange={setCoverageType} />
                </PanelSection>

                {coverageType === "turf" && (
                  <PanelSection title="TURF GRADE" accent="var(--turf-col)">
                    {Object.entries(TURF_SPECS).map(([id, spec]) => (
                      <div
                        key={id}
                        onClick={() => setTurfGrade(id)}
                        style={{
                          padding: "10px 12px",
                          marginBottom: 8,
                          background: turfGrade === id ? "var(--panel)" : "transparent",
                          border: `1px solid ${turfGrade === id ? "var(--turf-col)" : "var(--border)"}`,
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: turfGrade === id ? "var(--turf-col)" : "var(--text-dim)" }}>{spec.name}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "0.54rem", color: "var(--text-mute)", marginTop: 2 }}>
                          {spec.width}×{spec.length}mm · {spec.area}m²/roll
                        </div>
                      </div>
                    ))}
                  </PanelSection>
                )}

                {coverageType === "seed" && (
                  <PanelSection title="SEED TYPE" accent="var(--seed-col)">
                    {Object.entries(SEED_RATES).map(([id, spec]) => (
                      <div
                        key={id}
                        onClick={() => setSeedType(id)}
                        style={{
                          padding: "10px 12px",
                          marginBottom: 8,
                          background: seedType === id ? "var(--panel)" : "transparent",
                          border: `1px solid ${seedType === id ? "var(--seed-col)" : "var(--border)"}`,
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: seedType === id ? "var(--seed-col)" : "var(--text-dim)" }}>{spec.name}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "0.54rem", color: "var(--text-mute)", marginTop: 2 }}>{spec.desc}</div>
                      </div>
                    ))}
                  </PanelSection>
                )}

                {result && coverageType === "turf" && result.turf && (
                  <div style={{ background: "rgba(74,138,66,0.15)", border: "1px solid rgba(74,138,66,0.3)", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>
                      TURF SUMMARY
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Turf Rolls", v: result.turf.rolls },
                        { l: "Coverage", v: `${result.turf.coverage} m²` },
                        { l: "Roll Size", v: `${result.turf.spec.area} m²` },
                        { l: "Thickness", v: `${result.turf.spec.thickness}mm` },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--turf-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && coverageType === "seed" && result.seed && (
                  <div style={{ background: "rgba(200,176,96,0.15)", border: "1px solid rgba(200,176,96,0.3)", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>
                      SEED SUMMARY
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Seed Required", v: `${result.seed.kg} kg` },
                        { l: "Total Grams", v: `${result.seed.grams} g` },
                        { l: "Rate", v: `${result.seed.spec.rate}g/m²` },
                        { l: "Type", v: result.seed.type },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--seed-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* EXTRAS TAB */}
            {tab === "extras" && (
              <>
                <PanelSection title="PREPARATION" accent="var(--sand)">
                  <Toggle
                    label="Leveling Sand"
                    checked={extras.addSand}
                    onChange={(v) => setExtras((e) => ({ ...e, addSand: v }))}
                    accent="var(--sand)"
                    sub="5kg/m² for fine leveling"
                  />
                  <Toggle
                    label="Starter Fertilizer"
                    checked={extras.addFertilizer}
                    onChange={(v) => setExtras((e) => ({ ...e, addFertilizer: v }))}
                    accent="var(--grass-lt)"
                    sub="35g/m² pre-turf/seed feed"
                  />
                </PanelSection>

                <PanelSection title="EDGING" accent="var(--text)">
                  <Toggle
                    label="Add Lawn Edging"
                    checked={extras.addEdging}
                    onChange={(v) => setExtras((e) => ({ ...e, addEdging: v }))}
                    accent="var(--text)"
                    sub="Flexible edging strip"
                  />
                </PanelSection>

                <PanelSection title="WASTE ALLOWANCE" accent="var(--text-dim)">
                  <Field label="Waste Factor" value={dims.waste} onChange={set("waste")} unit="%" hint="typically 5-10%" small />
                </PanelSection>

                {result && (result.prep.sandKg > 0 || result.prep.fertilizerKg > 0 || result.edging) && (
                  <div style={{ background: "rgba(216,200,144,0.1)", border: "1px solid rgba(216,200,144,0.25)", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>
                      EXTRAS SUMMARY
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {result.prep.sandKg > 0 && (
                        <div>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>Sand</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--sand)", fontFamily: "var(--mono)", fontWeight: 600 }}>{result.prep.sandKg} kg</div>
                        </div>
                      )}
                      {result.prep.fertilizerKg > 0 && (
                        <div>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>Fertilizer</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--grass-lt)", fontFamily: "var(--mono)", fontWeight: 600 }}>{result.prep.fertilizerKg} kg</div>
                        </div>
                      )}
                      {result.edging && (
                        <>
                          <div>
                            <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>Edging</div>
                            <div style={{ fontSize: "0.88rem", color: "var(--text)", fontFamily: "var(--mono)", fontWeight: 600 }}>{result.edging.pieces} pcs</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>Pegs</div>
                            <div style={{ fontSize: "0.88rem", color: "var(--text)", fontFamily: "var(--mono)", fontWeight: 600 }}>{result.edging.pegs} pcs</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status bar */}
          <div
            style={{
              padding: "8px 14px",
              background: "var(--bg)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: result ? "var(--grass-lt)" : "var(--text-mute)", letterSpacing: "0.1em" }}>
              {result ? `● ${result.area}m² CALCULATED` : "○ AWAITING INPUT"}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>
              {COVERAGE_TYPES.find((t) => t.id === coverageType)?.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RIGHT — VIEWS + MATERIALS LIST */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              flex: showList ? "0 0 55%" : 1,
              minHeight: 0,
              background: "var(--bg)",
              position: "relative",
              overflow: "hidden",
              transition: "flex 0.3s ease",
            }}
          >
            {/* Grid background */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(42,48,56,0.5)" strokeWidth="0.5" />
                </pattern>
                <pattern id="lg" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#sg)" />
                  <path d="M100 0L0 0 0 100" fill="none" stroke="rgba(42,48,56,0.9)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#lg)" />
            </svg>

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {view === "PLAN" && <LawnPlan calc={result} />}
              {view === "SECTION" && <LawnSection calc={result} />}
              {view === "BOTH" && (
                <div style={{ display: "flex", width: "100%", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border)" }}>
                    <LawnPlan calc={result} />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LawnSection calc={result} />
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                fontFamily: "var(--mono)",
                fontSize: "0.6rem",
                color: "var(--text-mute)",
                letterSpacing: "0.14em",
                background: "rgba(14,16,18,0.7)",
                padding: "4px 10px",
                borderRadius: 4,
                backdropFilter: "blur(4px)",
              }}
            >
              {view === "PLAN" ? "PLAN VIEW" : view === "SECTION" ? "CROSS SECTION" : "PLAN + SECTION"}
            </div>

            <div
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                fontFamily: "var(--mono)",
                fontSize: "0.58rem",
                letterSpacing: "0.1em",
                background: "rgba(14,16,18,0.75)",
                padding: "4px 10px",
                borderRadius: 4,
                display: "flex",
                gap: 8,
                alignItems: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <span style={{ color: "var(--grass-lt)", fontWeight: 700 }}>{PROJECT_TYPES.find((t) => t.id === projectType)?.label.toUpperCase()}</span>
              <span style={{ color: "var(--border2)" }}>·</span>
              <span style={{ color: COVERAGE_TYPES.find((t) => t.id === coverageType)?.color, fontWeight: 700 }}>
                {COVERAGE_TYPES.find((t) => t.id === coverageType)?.label.toUpperCase()}
              </span>
            </div>

            {result && (
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  fontFamily: "var(--mono)",
                  fontSize: "0.58rem",
                  color: "var(--text-mute)",
                  letterSpacing: "0.1em",
                  background: "rgba(14,16,18,0.7)",
                  padding: "4px 10px",
                  borderRadius: 4,
                }}
              >
                {fmm(result.length)} × {fmm(result.width)} · {result.area}m²
              </div>
            )}
          </div>

          {showList && (
            <div style={{ flex: "1 1 45%", minHeight: 0, overflowY: "auto", borderTop: "1px solid var(--border)" }}>
              <MaterialsList calc={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}