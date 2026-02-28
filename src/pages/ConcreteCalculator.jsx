import { useState, useCallback } from "react";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:#0E1012; --surface:#161A1D; --panel:#1C2126;
      --border:#2A3038; --border2:#323C46;
      --text:#C8CDD4; --text-dim:#5A6472; --text-mute:#3A4450;
      --timber:#C87840; --timber-lt:#E09860; --timber-dk:#8B4E1E;
      --moss:#4A7A42; --moss-lt:#6AAA60; --straw:#B89848;
      --cream:#E8DCC8; --white:#F2EEE6;
      --locked:#232C34; --locked-txt:#3A4A58;
      --pro-col:#7A9EC8; --diy-col:#6AAA60;
      --concrete-col:#6A7A8A; --concrete-lt:#8A9AAA;
      --rebar-col:#8A5A4A; --form-col:#A08860;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;

      /* Robust viewport height (prevents 1px bottom clipping due to rounding / dynamic bars) */
      --app-h: 100vh;
    }

	html, body { height: 100%; }

/* common React/Next mount points */
	#root, #__next { height: 100%; }

    @supports (height: 100svh) {
      :root { --app-h: 100svh; }
    }
    @supports (height: 100dvh) {
      :root { --app-h: 100dvh; }
    }

    html, body { height: 100%; }
    body {
      font-family:var(--sans);
      background:var(--bg);
      color:var(--text);
      height:var(--app-h);
      min-height:var(--app-h);
      overflow:hidden;
    }

    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const FOOTING_TYPES = [
  { id: "pad", label: "Pad Footing", icon: "▣", desc: "Square/rectangular pad for posts" },
  { id: "strip", label: "Strip Footing", icon: "▬", desc: "Continuous strip for walls" },
  { id: "posthole", label: "Post Hole", icon: "◯", desc: "Circular hole for fence posts" },
];

const MIX_RATIOS = [
  { id: "c10", label: "10:1 (C10)", ratio: 10, strength: "C10", desc: "Light duty / blinding", cementPerM3: 160 },
  { id: "c15", label: "8:1 (C15)", ratio: 8, strength: "C15", desc: "Floor blinding / bedding", cementPerM3: 200 },
  { id: "c20", label: "6:1 (C20)", ratio: 6, strength: "C20", desc: "General purpose / footings", cementPerM3: 260 },
  { id: "c25", label: "5:1 (C25)", ratio: 5, strength: "C25", desc: "Structural / driveways", cementPerM3: 320 },
  { id: "c30", label: "4:1 (C30)", ratio: 4, strength: "C30", desc: "Heavy structural", cementPerM3: 380 },
  { id: "c35", label: "3.5:1 (C35)", ratio: 3.5, strength: "C35", desc: "Reinforced foundations", cementPerM3: 420 },
];

const AGGREGATE_TYPES = [
  { id: "all-in", label: "All-in Ballast", desc: "Pre-mixed sand & gravel" },
  { id: "separate", label: "Separate Sand & Gravel", desc: "2:1 gravel to sand ratio" },
];

const VIEWS = ["SECTION", "PLAN", "BOTH"];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const mm = v => parseFloat(v) || 0;
const r2 = n => Math.round(n * 100) / 100;
const r3 = n => Math.round(n * 1000) / 1000;
const CEI = Math.ceil;
const fmm = v => v >= 1000 ? `${r2(v / 1000).toFixed(2)}m` : `${Math.round(v)}mm`;

/* ─── DIY SPEC RESOLVER ──────────────────────────────────────────────────── */
function resolveDIYSpec(tier, footingType) {
  if (tier === "budget") {
    return {
      mixRatio: "c20",
      aggregateType: "all-in",
      includeRebar: false,
      rebarSize: "10",
      rebarSpacing: "200",
    };
  }
  return {
    mixRatio: "c25",
    aggregateType: "all-in",
    includeRebar: false,
    rebarSize: "12",
    rebarSpacing: "150",
  };
}

/* ─── CALCULATION ENGINE ─────────────────────────────────────────────────── */
function calcFooting(s) {
  const footingType = s.footingType;
  const quantity = parseInt(s.quantity) || 1;
  const width = mm(s.width);
  const length = mm(s.length);
  const depth = mm(s.depth);
  const diameter = mm(s.diameter);
  const waste = 1 + mm(s.waste) / 100;
  
  if (footingType === "posthole" && (!diameter || !depth)) return null;
  if (footingType !== "posthole" && (!width || !length || !depth)) return null;
  
  const mixData = MIX_RATIOS.find(m => m.id === s.mixRatio) || MIX_RATIOS[2];
  const aggregateType = s.aggregateType || "all-in";
  const includeRebar = s.includeRebar && s.userMode === "pro";
  const rebarSize = mm(s.rebarSize) || 12;
  const rebarSpacing = mm(s.rebarSpacing) || 150;
  
  let volumePerFooting;
  let footingArea;
  
  if (footingType === "posthole") {
    const radiusM = (diameter / 2) / 1000;
    const depthM = depth / 1000;
    volumePerFooting = Math.PI * radiusM * radiusM * depthM;
    footingArea = Math.PI * radiusM * radiusM;
  } else if (footingType === "pad") {
    const widthM = width / 1000;
    const lengthM = length / 1000;
    const depthM = depth / 1000;
    volumePerFooting = widthM * lengthM * depthM;
    footingArea = widthM * lengthM;
  } else if (footingType === "strip") {
    const widthM = width / 1000;
    const lengthM = length / 1000;
    const depthM = depth / 1000;
    volumePerFooting = widthM * lengthM * depthM;
    footingArea = widthM * lengthM;
  }
  
  const totalVolumeNet = volumePerFooting * quantity;
  const totalVolume = totalVolumeNet * waste;
  
  const cementKgPerM3 = mixData.cementPerM3;
  const totalCementKg = totalVolume * cementKgPerM3;
  const cementBags25kg = CEI(totalCementKg / 25);
  
  let aggregateCalc;
  if (aggregateType === "all-in") {
    const ballastM3 = totalVolume * 0.95;
    const ballastKg = ballastM3 * 1800;
    const ballastBags = CEI(ballastKg / 25);
    aggregateCalc = {
      type: "all-in",
      ballastKg: r2(ballastKg),
      ballastBags,
      ballastTonnes: r2(ballastKg / 1000),
    };
  } else {
    const aggregateVolume = totalVolume * 0.95;
    const gravelVolume = aggregateVolume * (2/3);
    const sandVolume = aggregateVolume * (1/3);
    const gravelKg = gravelVolume * 1850;
    const sandKg = sandVolume * 1600;
    aggregateCalc = {
      type: "separate",
      gravelKg: r2(gravelKg),
      gravelTonnes: r2(gravelKg / 1000),
      gravelBags: CEI(gravelKg / 25),
      sandKg: r2(sandKg),
      sandTonnes: r2(sandKg / 1000),
      sandBags: CEI(sandKg / 25),
    };
  }
  
  const waterLitres = r2(totalCementKg * 0.5);
  
  let rebarCalc = null;
  if (includeRebar && footingType !== "posthole") {
    const widthM = width / 1000;
    const lengthM = footingType === "strip" ? length / 1000 : length / 1000;
    const spacingM = rebarSpacing / 1000;
    
    const barsAcrossWidth = Math.floor(lengthM / spacingM) + 1;
    const barsAcrossLength = Math.floor(widthM / spacingM) + 1;
    const lengthOfWidthBars = (widthM - 0.1) * barsAcrossWidth * quantity;
    const lengthOfLengthBars = (lengthM - 0.1) * barsAcrossLength * quantity;
    const totalRebarLength = lengthOfWidthBars + lengthOfLengthBars;
    
    const rebarWeights = { 8: 0.395, 10: 0.617, 12: 0.888, 16: 1.58, 20: 2.47 };
    const rebarKgPerM = rebarWeights[rebarSize] || 0.888;
    const totalRebarKg = totalRebarLength * rebarKgPerM;
    
    const intersections = barsAcrossWidth * barsAcrossLength * quantity;
    const tieWireKg = r2(intersections * 0.005);
    
    rebarCalc = {
      barSize: rebarSize,
      spacing: rebarSpacing,
      barsWidth: barsAcrossWidth * quantity,
      barsLength: barsAcrossLength * quantity,
      totalLength: r2(totalRebarLength),
      totalKg: r2(totalRebarKg),
      tieWireKg,
    };
  }
  
  let formworkCalc = null;
  if (s.includeFormwork && s.userMode === "pro" && footingType !== "posthole") {
    const depthM = depth / 1000;
    let perimeterM;
    if (footingType === "pad") {
      perimeterM = 2 * (width / 1000 + length / 1000);
    } else {
      perimeterM = 2 * (length / 1000) + 2 * (width / 1000);
    }
    const formworkAreaPerFooting = perimeterM * depthM;
    const totalFormworkArea = formworkAreaPerFooting * quantity;
    
    const boardWidth = depth <= 150 ? 150 : 225;
    const boardsNeeded = CEI(depth / boardWidth);
    const totalBoardLength = perimeterM * boardsNeeded * quantity;
    
    const stakesPerFooting = CEI(perimeterM / 0.6);
    const totalStakes = stakesPerFooting * quantity;
    
    formworkCalc = {
      areaM2: r2(totalFormworkArea),
      boardLength: r2(totalBoardLength),
      boardWidth,
      boardsHigh: boardsNeeded,
      stakes: totalStakes,
    };
  }
  
  return {
    footingType,
    quantity,
    dimensions: {
      width: footingType === "posthole" ? diameter : width,
      length: footingType === "posthole" ? diameter : length,
      depth,
      diameter: footingType === "posthole" ? diameter : null,
    },
    volume: {
      perFooting: r3(volumePerFooting),
      totalNet: r3(totalVolumeNet),
      totalWithWaste: r3(totalVolume),
    },
    mix: mixData,
    cement: {
      kgTotal: r2(totalCementKg),
      bags25kg: cementBags25kg,
    },
    aggregate: aggregateCalc,
    water: {
      litres: waterLitres,
    },
    rebar: rebarCalc,
    formwork: formworkCalc,
    userMode: s.userMode,
  };
}

/* ─── SVG SECTION VIEW ───────────────────────────────────────────────────── */
function FootingSection({ calc }) {
  if (!calc) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="28" width="40" height="24" rx="2" stroke="#2A3038" strokeWidth="2" fill="none" />
        <line x1="12" y1="28" x2="52" y2="28" stroke="#3A4450" strokeWidth="2" strokeDasharray="4,2" />
        <rect x="24" y="16" width="16" height="12" rx="1" stroke="#3A4450" strokeWidth="1.5" fill="none" />
      </svg>
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>ENTER DIMENSIONS TO GENERATE SECTION</span>
    </div>
  );

  const { footingType, dimensions, rebar } = calc;
  const isPosthole = footingType === "posthole";
  
  const PAD_L = 80, PAD_R = 60, PAD_T = 60, PAD_B = 80;
  const SVG_W = 500, SVG_H = 400;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;
  
  const width = isPosthole ? dimensions.diameter : dimensions.width;
  const depth = dimensions.depth;
  
  const scaleX = drawW / width;
  const scaleY = drawH / (depth + 100);
  const scale = Math.min(scaleX, scaleY) * 0.7;
  
  const footingW = width * scale;
  const footingD = depth * scale;
  const groundOffset = 50;
  
  const ox = PAD_L + (drawW - footingW) / 2;
  const oy = PAD_T + groundOffset;
  
  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;
  
  const AC = "#6A7A8A", AR = "#8A5A4A";
  const tick = 5;
  
  els.push(<line key={k()} x1={ox - 40} y1={oy} x2={ox + footingW + 40} y2={oy} stroke="#4A4030" strokeWidth="2" />);
  
  for (let i = 0; i < 8; i++) {
    const gx = ox - 30 + i * 25 + Math.random() * 10;
    els.push(
      <g key={k()}>
        <line x1={gx} y1={oy} x2={gx - 3} y2={oy - 8} stroke="#3A5A30" strokeWidth="1.5" />
        <line x1={gx} y1={oy} x2={gx + 2} y2={oy - 6} stroke="#4A6A40" strokeWidth="1" />
      </g>
    );
  }
  
  els.push(<rect key={k()} x={ox - 40} y={oy} width={footingW + 80} height={footingD + 40} fill="#1A1810" />);
  
  if (isPosthole) {
    els.push(
      <rect key={k()} x={ox} y={oy} width={footingW} height={footingD} fill="#5A6068" stroke="#7A8088" strokeWidth="2" rx="4" />
    );
    for (let i = 0; i < 8; i++) {
      const cx = ox + 10 + Math.random() * (footingW - 20);
      const cy = oy + 10 + Math.random() * (footingD - 20);
      els.push(<circle key={k()} cx={cx} cy={cy} r={2 + Math.random() * 3} fill="#4A5058" opacity="0.5" />);
    }
    const postW = footingW * 0.4;
    const postX = ox + (footingW - postW) / 2;
    els.push(
      <rect key={k()} x={postX} y={oy - 40} width={postW} height={footingD + 40} fill="none" stroke="#8A6A50" strokeWidth="2" strokeDasharray="6,4" rx="2" />
    );
    els.push(
      <text key={k()} x={ox + footingW / 2} y={oy - 50} textAnchor="middle" fill="#8A6A50" fontFamily="IBM Plex Mono" fontSize="9">POST</text>
    );
  } else {
    els.push(
      <rect key={k()} x={ox} y={oy} width={footingW} height={footingD} fill="#5A6068" stroke="#7A8088" strokeWidth="2" />
    );
    for (let i = 0; i < 12; i++) {
      const cx = ox + 10 + Math.random() * (footingW - 20);
      const cy = oy + 10 + Math.random() * (footingD - 20);
      const size = 2 + Math.random() * 4;
      els.push(<circle key={k()} cx={cx} cy={cy} r={size} fill="#4A5058" opacity="0.4" />);
    }
    
    if (rebar) {
      const cover = 50 * scale / (width / dimensions.width);
      const barR = 3;
      const numBars = Math.min(5, rebar.barsWidth);
      const barSpacing = (footingW - cover * 2) / (numBars - 1);
      for (let i = 0; i < numBars; i++) {
        const bx = ox + cover + i * barSpacing;
        const by = oy + footingD - cover;
        els.push(<circle key={k()} cx={bx} cy={by} r={barR} fill={AR} stroke="#AA7A6A" strokeWidth="1" />);
      }
      els.push(
        <line key={k()} x1={ox + cover} y1={oy + cover} x2={ox + cover} y2={oy + footingD - cover + 20} stroke={AR} strokeWidth="2" />
      );
      els.push(
        <line key={k()} x1={ox + footingW - cover} y1={oy + cover} x2={ox + footingW - cover} y2={oy + footingD - cover + 20} stroke={AR} strokeWidth="2" />
      );
    }
  }
  
  const topDimY = oy - 25;
  els.push(<line key={k()} x1={ox} y1={topDimY} x2={ox + footingW} y2={topDimY} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={ox} y1={topDimY - tick} x2={ox} y2={topDimY + tick} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={ox + footingW} y1={topDimY - tick} x2={ox + footingW} y2={topDimY + tick} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={ox} y1={oy} x2={ox} y2={topDimY} stroke={AC} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />);
  els.push(<line key={k()} x1={ox + footingW} y1={oy} x2={ox + footingW} y2={topDimY} stroke={AC} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />);
  els.push(
    <text key={k()} x={ox + footingW / 2} y={topDimY - 8} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="11" fontWeight="600">
      {fmm(width)} {isPosthole ? "DIA" : "WIDTH"}
    </text>
  );
  
  const rightDimX = ox + footingW + 25;
  els.push(<line key={k()} x1={rightDimX} y1={oy} x2={rightDimX} y2={oy + footingD} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={rightDimX - tick} y1={oy} x2={rightDimX + tick} y2={oy} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={rightDimX - tick} y1={oy + footingD} x2={rightDimX + tick} y2={oy + footingD} stroke={AC} strokeWidth="1.5" />);
  els.push(
    <text key={k()} x={rightDimX + 12} y={oy + footingD / 2} textAnchor="start" dominantBaseline="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="11" fontWeight="600">
      {fmm(depth)}
    </text>
  );
  els.push(
    <text key={k()} x={rightDimX + 12} y={oy + footingD / 2 + 14} textAnchor="start" dominantBaseline="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="9">
      DEPTH
    </text>
  );
  
  els.push(
    <text key={k()} x={ox - 15} y={oy + 4} textAnchor="end" fill="#6A7A5A" fontFamily="IBM Plex Mono" fontSize="9">GL</text>
  );
  
  els.push(
    <text key={k()} x={ox + footingW / 2} y={oy + footingD / 2} textAnchor="middle" dominantBaseline="middle" fill="#9AAABC" fontFamily="IBM Plex Mono" fontSize="12" fontWeight="600">
      {calc.mix.strength}
    </text>
  );
  els.push(
    <text key={k()} x={ox + footingW / 2} y={oy + footingD / 2 + 14} textAnchor="middle" dominantBaseline="middle" fill="#7A8A9A" fontFamily="IBM Plex Mono" fontSize="9">
      CONCRETE
    </text>
  );
  
  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxWidth: "100%", maxHeight: "100%" }}>
      {els}
    </svg>
  );
}

/* ─── SVG PLAN VIEW ──────────────────────────────────────────────────────── */
function FootingPlan({ calc }) {
  if (!calc) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="16" y="16" width="32" height="32" rx="2" stroke="#2A3038" strokeWidth="2" fill="none" />
        <circle cx="32" cy="32" r="8" stroke="#3A4450" strokeWidth="1.5" fill="none" />
      </svg>
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>ENTER DIMENSIONS TO GENERATE PLAN</span>
    </div>
  );

  const { footingType, dimensions, quantity, rebar } = calc;
  const isPosthole = footingType === "posthole";
  const isStrip = footingType === "strip";
  
  const PAD = 60;
  const SVG_W = 500, SVG_H = 400;
  const drawW = SVG_W - PAD * 2;
  const drawH = SVG_H - PAD * 2;
  
  const width = isPosthole ? dimensions.diameter : dimensions.width;
  const length = isPosthole ? dimensions.diameter : dimensions.length;
  
  const scaleX = drawW / (isStrip ? length : width * Math.min(quantity, 3));
  const scaleY = drawH / (isStrip ? width : length);
  const scale = Math.min(scaleX, scaleY) * 0.6;
  
  const footingW = width * scale;
  const footingL = length * scale;
  
  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;
  
  const AC = "#6A7A8A", AR = "#8A5A4A";
  const tick = 5;

  if (isPosthole) {
    const numShow = Math.min(quantity, 5);
    const spacing = footingW * 1.5;
    const totalW = (numShow - 1) * spacing + footingW;
    const startX = (SVG_W - totalW) / 2 + footingW / 2;
    const cy = SVG_H / 2;
    
    for (let i = 0; i < numShow; i++) {
      const cx = startX + i * spacing;
      els.push(<circle key={k()} cx={cx} cy={cy} r={footingW / 2} fill="#5A6068" stroke="#7A8088" strokeWidth="2" />);
      for (let j = 0; j < 4; j++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * footingW * 0.3;
        els.push(<circle key={k()} cx={cx + Math.cos(angle) * dist} cy={cy + Math.sin(angle) * dist} r={2} fill="#4A5058" opacity="0.5" />);
      }
      els.push(<circle key={k()} cx={cx} cy={cy} r={footingW * 0.2} fill="none" stroke="#8A6A50" strokeWidth="1.5" strokeDasharray="4,3" />);
    }
    
    if (quantity > numShow) {
      els.push(
        <text key={k()} x={SVG_W / 2} y={cy + footingW / 2 + 30} textAnchor="middle" fill="#7A8A9A" fontFamily="IBM Plex Mono" fontSize="10">
          +{quantity - numShow} more footings
        </text>
      );
    }
    
    const dimY = cy - footingW / 2 - 25;
    const firstCx = startX;
    els.push(<line key={k()} x1={firstCx - footingW / 2} y1={dimY} x2={firstCx + footingW / 2} y2={dimY} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={firstCx - footingW / 2} y1={dimY - tick} x2={firstCx - footingW / 2} y2={dimY + tick} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={firstCx + footingW / 2} y1={dimY - tick} x2={firstCx + footingW / 2} y2={dimY + tick} stroke={AC} strokeWidth="1.5" />);
    els.push(<text key={k()} x={firstCx} y={dimY - 8} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600">{fmm(dimensions.diameter)} Ø</text>);
    
  } else if (isStrip) {
    const ox = (SVG_W - footingL) / 2;
    const oy = (SVG_H - footingW) / 2;
    
    els.push(<rect key={k()} x={ox} y={oy} width={footingL} height={footingW} fill="#5A6068" stroke="#7A8088" strokeWidth="2" />);
    
    for (let i = 0; i < 15; i++) {
      const cx = ox + 10 + Math.random() * (footingL - 20);
      const cy = oy + 5 + Math.random() * (footingW - 10);
      els.push(<circle key={k()} cx={cx} cy={cy} r={2 + Math.random() * 2} fill="#4A5058" opacity="0.4" />);
    }
    
    if (rebar) {
      const cover = 8;
      const numLong = 3;
      const numTrans = Math.floor(footingL / 30);
      for (let i = 0; i < numLong; i++) {
        const by = oy + cover + i * ((footingW - cover * 2) / (numLong - 1));
        els.push(<line key={k()} x1={ox + cover} y1={by} x2={ox + footingL - cover} y2={by} stroke={AR} strokeWidth="2" opacity="0.7" />);
      }
      for (let i = 0; i < numTrans; i++) {
        const bx = ox + cover + i * ((footingL - cover * 2) / (numTrans - 1));
        els.push(<line key={k()} x1={bx} y1={oy + cover} x2={bx} y2={oy + footingW - cover} stroke={AR} strokeWidth="1.5" opacity="0.7" />);
      }
    }
    
    els.push(<line key={k()} x1={ox} y1={oy - 25} x2={ox + footingL} y2={oy - 25} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={ox} y1={oy - 25 - tick} x2={ox} y2={oy - 25 + tick} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={ox + footingL} y1={oy - 25 - tick} x2={ox + footingL} y2={oy - 25 + tick} stroke={AC} strokeWidth="1.5" />);
    els.push(<text key={k()} x={ox + footingL / 2} y={oy - 35} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600">{fmm(length)} LENGTH</text>);
    
    els.push(<line key={k()} x1={ox + footingL + 25} y1={oy} x2={ox + footingL + 25} y2={oy + footingW} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={ox + footingL + 25 - tick} y1={oy} x2={ox + footingL + 25 + tick} y2={oy} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={ox + footingL + 25 - tick} y1={oy + footingW} x2={ox + footingL + 25 + tick} y2={oy + footingW} stroke={AC} strokeWidth="1.5" />);
    els.push(<text key={k()} x={ox + footingL + 35} y={oy + footingW / 2} textAnchor="start" dominantBaseline="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600">{fmm(width)}</text>);
    
  } else {
    const numShow = Math.min(quantity, 4);
    const cols = numShow <= 2 ? numShow : 2;
    const rows = Math.ceil(numShow / cols);
    const gapX = footingW * 0.4;
    const gapY = footingL * 0.4;
    const totalW = cols * footingW + (cols - 1) * gapX;
    const totalH = rows * footingL + (rows - 1) * gapY;
    const startX = (SVG_W - totalW) / 2;
    const startY = (SVG_H - totalH) / 2;
    
    for (let i = 0; i < numShow; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = startX + col * (footingW + gapX);
      const oy = startY + row * (footingL + gapY);
      
      els.push(<rect key={k()} x={ox} y={oy} width={footingW} height={footingL} fill="#5A6068" stroke="#7A8088" strokeWidth="2" />);
      
      for (let j = 0; j < 6; j++) {
        const cx = ox + 8 + Math.random() * (footingW - 16);
        const cy = oy + 8 + Math.random() * (footingL - 16);
        els.push(<circle key={k()} cx={cx} cy={cy} r={2 + Math.random() * 2} fill="#4A5058" opacity="0.4" />);
      }
      
      if (rebar && i === 0) {
        const cover = 6;
        const numW = 3;
        const numL = 3;
        for (let r = 0; r < numW; r++) {
          const by = oy + cover + r * ((footingL - cover * 2) / (numW - 1));
          els.push(<line key={k()} x1={ox + cover} y1={by} x2={ox + footingW - cover} y2={by} stroke={AR} strokeWidth="1.5" opacity="0.7" />);
        }
        for (let r = 0; r < numL; r++) {
          const bx = ox + cover + r * ((footingW - cover * 2) / (numL - 1));
          els.push(<line key={k()} x1={bx} y1={oy + cover} x2={bx} y2={oy + footingL - cover} stroke={AR} strokeWidth="1.5" opacity="0.7" />);
        }
      }
    }
    
    if (quantity > numShow) {
      els.push(
        <text key={k()} x={SVG_W / 2} y={startY + totalH + 25} textAnchor="middle" fill="#7A8A9A" fontFamily="IBM Plex Mono" fontSize="10">
          +{quantity - numShow} more footings
        </text>
      );
    }
    
    const firstOx = startX;
    const firstOy = startY;
    els.push(<line key={k()} x1={firstOx} y1={firstOy - 20} x2={firstOx + footingW} y2={firstOy - 20} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={firstOx} y1={firstOy - 20 - tick} x2={firstOx} y2={firstOy - 20 + tick} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={firstOx + footingW} y1={firstOy - 20 - tick} x2={firstOx + footingW} y2={firstOy - 20 + tick} stroke={AC} strokeWidth="1.5" />);
    els.push(<text key={k()} x={firstOx + footingW / 2} y={firstOy - 28} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600">{fmm(width)}</text>);
    els.push(<line key={k()} x1={firstOx - 20} y1={firstOy} x2={firstOx - 20} y2={firstOy + footingL} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={firstOx - 20 - tick} y1={firstOy} x2={firstOx - 20 + tick} y2={firstOy} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={firstOx - 20 - tick} y1={firstOy + footingL} x2={firstOx - 20 + tick} y2={firstOy + footingL} stroke={AC} strokeWidth="1.5" />);
    els.push(<text key={k()} x={firstOx - 28} y={firstOy + footingL / 2} textAnchor="middle" dominantBaseline="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600" transform={`rotate(-90,${firstOx - 28},${firstOy + footingL / 2})`}>{fmm(length)}</text>);
  }
  
  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxWidth: "100%", maxHeight: "100%" }}>
      {els}
    </svg>
  );
}

/* ─── MATERIALS LIST ─────────────────────────────────────────────────────── */
function MaterialsList({ calc }) {
  if (!calc) return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--text-mute)", letterSpacing: "0.12em" }}>MATERIALS LIST</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>Enter dimensions to calculate materials</div>
    </div>
  );

  const { volume, cement, aggregate, water, rebar, formwork, mix, quantity, footingType } = calc;
  
  const Section = ({ title, accent, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: accent || "var(--text-dim)", letterSpacing: "0.12em", marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${accent || "var(--border)"}40` }}>{title}</div>
      {children}
    </div>
  );
  
  const Row = ({ label, value, sub, accent }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--text)" }}>{label}</span>
        {sub && <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginLeft: 8 }}>{sub}</span>}
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem", color: accent || "var(--concrete-lt)", fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: "16px 20px", background: "var(--surface)", height: "100%", overflowY: "auto", paddingBottom: "calc(18px + env(safe-area-inset-bottom))" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--concrete-lt)", letterSpacing: "0.14em", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>MATERIALS LIST — {mix.strength} MIX</span>
        <span style={{ color: "var(--text-mute)" }}>{quantity}× {footingType.toUpperCase()}</span>
      </div>
      
      <Section title="CONCRETE VOLUME" accent="var(--concrete-col)">
        <Row label="Per footing" value={`${volume.perFooting} m³`} />
        <Row label="Total (net)" value={`${volume.totalNet} m³`} />
        <Row label="Total (inc. waste)" value={`${volume.totalWithWaste} m³`} accent="var(--straw)" />
      </Section>
      
      <Section title="CEMENT" accent="var(--text)">
        <Row label="Total weight" value={`${cement.kgTotal} kg`} />
        <Row label="25kg bags" value={`${cement.bags25kg} bags`} accent="var(--straw)" />
      </Section>
      
      <Section title="AGGREGATE" accent="var(--timber)">
        {aggregate.type === "all-in" ? (
          <>
            <Row label="All-in ballast" value={`${aggregate.ballastKg} kg`} sub={`${aggregate.ballastTonnes} tonnes`} />
            <Row label="25kg bags" value={`${aggregate.ballastBags} bags`} accent="var(--straw)" />
          </>
        ) : (
          <>
            <Row label="Gravel (20mm)" value={`${aggregate.gravelKg} kg`} sub={`${aggregate.gravelTonnes} tonnes`} />
            <Row label="Gravel bags (25kg)" value={`${aggregate.gravelBags} bags`} />
            <Row label="Sharp sand" value={`${aggregate.sandKg} kg`} sub={`${aggregate.sandTonnes} tonnes`} />
            <Row label="Sand bags (25kg)" value={`${aggregate.sandBags} bags`} />
          </>
        )}
      </Section>
      
      <Section title="WATER" accent="var(--pro-col)">
        <Row label="Approx. water" value={`${water.litres} L`} sub="0.5 w/c ratio" />
      </Section>
      
      {rebar && (
        <Section title="REINFORCEMENT" accent="var(--rebar-col)">
          <Row label={`T${rebar.barSize} rebar`} value={`${rebar.totalLength} m`} sub={`@ ${rebar.spacing}mm c/c`} />
          <Row label="Rebar weight" value={`${rebar.totalKg} kg`} accent="var(--straw)" />
          <Row label="Tie wire" value={`${rebar.tieWireKg} kg`} />
        </Section>
      )}
      
      {formwork && (
        <Section title="FORMWORK" accent="var(--form-col)">
          <Row label="Formwork area" value={`${formwork.areaM2} m²`} />
          <Row label={`Boards (${formwork.boardWidth}mm)`} value={`${formwork.boardLength} m`} sub={`${formwork.boardsHigh} high`} />
          <Row label="Stakes" value={`${formwork.stakes} no.`} />
        </Section>
      )}
      
      <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--panel)", borderRadius: 6, border: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 6, letterSpacing: "0.1em" }}>MIX SPECIFICATION</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.82rem", color: "var(--concrete-lt)" }}>
          {mix.label} — {mix.desc}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--text-mute)", marginTop: 4 }}>
          {mix.ratio} parts aggregate : 1 part cement
        </div>
      </div>
    </div>
  );
}

/* ─── UI COMPONENTS ──────────────────────────────────────────────────────── */
const PanelSection = ({ title, accent, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: accent || "var(--text-dim)", letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: accent || "var(--border2)" }} />
      {title}
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, unit, hint, small, locked, lockedReason }) => (
  <div style={{ marginBottom: small ? 8 : 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
      <label style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: locked ? "var(--locked-txt)" : "var(--text-dim)", letterSpacing: "0.06em" }}>{label}</label>
      {unit && <span style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-mute)" }}>{unit}</span>}
    </div>
    {locked ? (
      <div style={{ background: "var(--locked)", border: "1px solid var(--border)", borderRadius: 4, padding: "7px 10px", fontFamily: "var(--mono)", fontSize: "0.85rem", color: "var(--locked-txt)", cursor: "not-allowed" }}>{value || "—"}</div>
    ) : (
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 10px", fontFamily: "var(--mono)", fontSize: "0.85rem", color: "var(--text)", outline: "none" }}
      />
    )}
    {hint && <div style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: locked ? "var(--locked-txt)" : "var(--text-mute)", marginTop: 3 }}>{lockedReason || hint}</div>}
  </div>
);

const Select = ({ label, value, onChange, options, hint }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
      <label style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--text-dim)", letterSpacing: "0.06em" }}>{label}</label>
    </div>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 10px", fontFamily: "var(--mono)", fontSize: "0.85rem", color: "var(--text)", outline: "none", cursor: "pointer" }}
    >
      {options.map(opt => (
        <option key={opt.id} value={opt.id}>{opt.label}</option>
      ))}
    </select>
    {hint && <div style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-mute)", marginTop: 3 }}>{hint}</div>}
  </div>
);

const Toggle = ({ label, sub, checked, onChange, accent }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", background: checked ? `${accent || "var(--moss)"}15` : "transparent", border: `1px solid ${checked ? accent || "var(--moss)" : "var(--border)"}`, borderRadius: 6, cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }}
  >
    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? accent || "var(--moss)" : "var(--border2)"}`, background: checked ? accent || "var(--moss)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
      {checked && <span style={{ color: "var(--bg)", fontSize: 10, fontWeight: 700 }}>✓</span>}
    </div>
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: checked ? "var(--text)" : "var(--text-dim)" }}>{label}</div>
      {sub && <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-mute)", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          flex: 1,
          padding: "10px 8px",
          background: "transparent",
          border: "none",
          borderBottom: active === t.id ? `2px solid ${t.color || "var(--concrete-lt)"}` : "2px solid transparent",
          color: active === t.id ? (t.color || "var(--concrete-lt)") : "var(--text-dim)",
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

const TypeSelector = ({ types, active, onChange }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
    {types.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          padding: "10px 12px",
          background: active === t.id ? "var(--panel)" : "var(--bg)",
          border: `1px solid ${active === t.id ? "var(--concrete-lt)" : "var(--border)"}`,
          borderRadius: 6,
          color: active === t.id ? "var(--concrete-lt)" : "var(--text-dim)",
          fontFamily: "var(--mono)",
          fontSize: "0.64rem",
          cursor: "pointer",
          textAlign: "center",
          transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: "1rem", marginBottom: 4 }}>{t.icon}</div>
        {t.label.split(" ")[0]}
      </button>
    ))}
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function ConcreteFootingCalculator() {
  const [userMode, setUserMode] = useState("diy");
  const [specTier, setSpecTier] = useState("full");
  const [footingType, setFootingType] = useState("pad");
  const [view, setView] = useState("SECTION");
  const [showList, setShowList] = useState(true);
  const [tab, setTab] = useState("dims");
  
  const [d, setD] = useState({
    quantity: "1",
    width: "450",
    length: "450",
    depth: "300",
    diameter: "300",
    waste: "10",
    mixRatio: "c20",
    aggregateType: "all-in",
    includeRebar: false,
    rebarSize: "12",
    rebarSpacing: "150",
    includeFormwork: false,
  });
  
  const isDIY = userMode === "diy";
  const diySpec = isDIY ? resolveDIYSpec(specTier, footingType) : {};
  
  const set = useCallback(key => val => setD(prev => ({ ...prev, [key]: val })), []);
  
  const fval = key => isDIY && diySpec[key] !== undefined ? diySpec[key] : d[key];
  const isLocked = key => isDIY && diySpec[key] !== undefined;
  
  const calcInput = {
    ...d,
    mixRatio: fval("mixRatio"),
    aggregateType: fval("aggregateType"),
    includeRebar: isDIY ? false : d.includeRebar,
    rebarSize: fval("rebarSize"),
    rebarSpacing: fval("rebarSpacing"),
    footingType,
    userMode,
  };
  
  const result = calcFooting(calcInput);
  
  const cycleTier = () => setSpecTier(t => t === "full" ? "budget" : "full");
  
  const tabs = [
    { id: "dims", label: "DIMENSIONS", color: "var(--concrete-lt)" },
    { id: "mix", label: "MIX", color: "var(--straw)" },
    ...(!isDIY ? [{ id: "extras", label: "EXTRAS", color: "var(--rebar-col)" }] : []),
  ];
  
  return (
    <div
  	style={{
    		position: "fixed",
    		left: 0,
    		right: 0,
    		top: "var(--nav-height, 0px)",
    		bottom: 0,

    		display: "flex",
    		flexDirection: "column",
    		background: "var(--bg)",
    		overflow: "hidden",
    		width: "auto",
   		 height: "auto",

    		/* small safety buffer for desktop rounding / fractional scaling */
    		paddingBottom: "9px",
  }}
>
      <GlobalStyle />
      
      {/* HEADER */}
      <header style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, var(--concrete-col) 0%, #4A5A6A 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "14px" }}>▣</span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", fontWeight: 600, color: "var(--text)", letterSpacing: "0.04em" }}>CONCRETE FOOTING</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.54rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>CALCULATOR</div>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 6, padding: 3 }}>
            {["diy", "pro"].map(m => (
              <button
                key={m}
                onClick={() => setUserMode(m)}
                style={{
                  padding: "6px 12px",
                  background: userMode === m ? (m === "diy" ? "var(--diy-col)" : "var(--pro-col)") : "transparent",
                  border: "none",
                  borderRadius: 4,
                  color: userMode === m ? "var(--bg)" : "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "0.58rem",
                  fontWeight: userMode === m ? 600 : 400,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          
          {isDIY && (
            <button
              onClick={cycleTier}
              style={{
                padding: "6px 12px",
                background: specTier === "full" ? "var(--timber)" : "var(--panel)",
                border: `1px solid ${specTier === "full" ? "var(--timber)" : "var(--border)"}`,
                borderRadius: 4,
                color: specTier === "full" ? "var(--bg)" : "var(--text-dim)",
                fontFamily: "var(--mono)",
                fontSize: "0.58rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              {specTier.toUpperCase()}
            </button>
          )}
          
          {/* View toggle */}
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 6, padding: 3 }}>
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 12px",
                  background: view === v ? "var(--panel)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  color: view === v ? "var(--concrete-lt)" : "var(--text-dim)",
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
              border: `1px solid ${showList ? "var(--concrete-col)" : "var(--border)"}`,
              borderRadius: 4,
              color: showList ? "var(--concrete-lt)" : "var(--text-dim)",
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
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* LEFT PANEL */}
        <div style={{ 
          width: 320, 
          flexShrink: 0, 
          display: "flex", 
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          overflow: "hidden",
        }}>
          <TabBar tabs={tabs} active={tab} onChange={setTab} />
          
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", minHeight: 0 }}>
            {tab === "dims" && (
              <>
                <PanelSection title="FOOTING TYPE" accent="var(--concrete-lt)">
                  <TypeSelector types={FOOTING_TYPES} active={footingType} onChange={setFootingType} />
                </PanelSection>
                
                <PanelSection title="QUANTITY" accent="var(--concrete-col)">
                  <Field label="Number of footings" value={d.quantity} onChange={set("quantity")} unit="no." hint="How many identical footings" small />
                </PanelSection>
                
                <PanelSection title="DIMENSIONS" accent="var(--concrete-lt)">
                  {footingType === "posthole" ? (
                    <>
                      <Field label="Hole Diameter" value={d.diameter} onChange={set("diameter")} unit="mm" hint="Typical: 300-450mm" />
                      <Field label="Hole Depth" value={d.depth} onChange={set("depth")} unit="mm" hint="Below ground level" />
                    </>
                  ) : footingType === "strip" ? (
                    <>
                      <Field label="Strip Width" value={d.width} onChange={set("width")} unit="mm" hint="Typical: 450-600mm" />
                      <Field label="Strip Length" value={d.length} onChange={set("length")} unit="mm" hint="Total run length" />
                      <Field label="Strip Depth" value={d.depth} onChange={set("depth")} unit="mm" hint="Typical: 225-300mm" />
                    </>
                  ) : (
                    <>
                      <Field label="Pad Width" value={d.width} onChange={set("width")} unit="mm" hint="Typical: 450-600mm" />
                      <Field label="Pad Length" value={d.length} onChange={set("length")} unit="mm" hint="Typically same as width" />
                      <Field label="Pad Depth" value={d.depth} onChange={set("depth")} unit="mm" hint="Typical: 225-300mm" />
                    </>
                  )}
                </PanelSection>
                
                <PanelSection title="WASTE ALLOWANCE" accent="var(--text-dim)">
                  <Field label="Waste" value={d.waste} onChange={set("waste")} unit="%" hint="Typically 10%" small />
                </PanelSection>
                
                {result && (
                  <div style={{ background: "rgba(106,122,138,0.12)", border: "1px solid rgba(106,122,138,0.3)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>VOLUME SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Per footing", v: `${result.volume.perFooting} m³` },
                        { l: "Total net", v: `${result.volume.totalNet} m³` },
                        { l: "With waste", v: `${result.volume.totalWithWaste} m³` },
                        { l: "Cement", v: `${result.cement.bags25kg} bags` },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--concrete-lt)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {tab === "mix" && (
              <>
                <PanelSection title="CONCRETE MIX" accent="var(--concrete-col)">
                  <Select
                    label="Mix Ratio"
                    value={fval("mixRatio")}
                    onChange={set("mixRatio")}
                    options={MIX_RATIOS}
                    hint={MIX_RATIOS.find(m => m.id === fval("mixRatio"))?.desc}
                  />
                  
                  <Select
                    label="Aggregate Type"
                    value={fval("aggregateType")}
                    onChange={set("aggregateType")}
                    options={AGGREGATE_TYPES}
                    hint={AGGREGATE_TYPES.find(a => a.id === fval("aggregateType"))?.desc}
                  />
                </PanelSection>
                
                <div style={{ background: "var(--panel)", borderRadius: 6, padding: "12px 14px", marginTop: 12 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>MIX GUIDE</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--text-mute)", lineHeight: 1.6 }}>
                    <div style={{ marginBottom: 6 }}><span style={{ color: "var(--text)" }}>C20 (6:1)</span> — Standard footings, patios</div>
                    <div style={{ marginBottom: 6 }}><span style={{ color: "var(--text)" }}>C25 (5:1)</span> — Structural, driveways</div>
                    <div><span style={{ color: "var(--text)" }}>C30 (4:1)</span> — Heavy duty, reinforced</div>
                  </div>
                </div>
              </>
            )}
            
            {tab === "extras" && !isDIY && (
              <>
                <PanelSection title="REINFORCEMENT" accent="var(--rebar-col)">
                  <Toggle
                    label="Include rebar"
                    sub="Bottom mat reinforcement for structural footings"
                    checked={d.includeRebar}
                    onChange={set("includeRebar")}
                    accent="var(--rebar-col)"
                  />
                  {d.includeRebar && footingType !== "posthole" && (
                    <>
                      <Field label="Bar Size" value={d.rebarSize} onChange={set("rebarSize")} unit="mm" hint="T10, T12, T16 common" small />
                      <Field label="Bar Spacing" value={d.rebarSpacing} onChange={set("rebarSpacing")} unit="mm" hint="150-200mm typical" small />
                    </>
                  )}
                  {d.includeRebar && footingType === "posthole" && (
                    <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 4, marginTop: 8 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-dim)" }}>
                        Rebar not typically used in post holes. Consider starter bars cast into footing if needed.
                      </div>
                    </div>
                  )}
                </PanelSection>
                
                {footingType !== "posthole" && (
                  <PanelSection title="FORMWORK" accent="var(--form-col)">
                    <Toggle
                      label="Include formwork"
                      sub="Timber shuttering for edge forms"
                      checked={d.includeFormwork}
                      onChange={set("includeFormwork")}
                      accent="var(--form-col)"
                    />
                  </PanelSection>
                )}
              </>
            )}
          </div>
          
          {/* Status bar */}
          <div style={{ padding: "8px 14px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: result ? "var(--moss-lt)" : "var(--text-mute)", letterSpacing: "0.1em" }}>
              {result ? `● ${result.volume.totalWithWaste} m³ CALCULATED` : "○ AWAITING INPUT"}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>
              {userMode.toUpperCase()} · {footingType.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Right — Views + Materials List */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: showList ? "0 0 55%" : 1, background: "var(--bg)", position: "relative", overflow: "hidden", transition: "flex 0.3s ease" }}>
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
              {view === "SECTION" && <FootingSection calc={result} />}
              {view === "PLAN" && <FootingPlan calc={result} />}
              {view === "BOTH" && (
                <div style={{ display: "flex", width: "100%", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border)" }}>
                    <FootingSection calc={result} />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FootingPlan calc={result} />
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ position: "absolute", top: 14, right: 14, fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-mute)", letterSpacing: "0.14em", background: "rgba(14,16,18,0.7)", padding: "4px 10px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              {view === "SECTION" ? "SECTION VIEW" : view === "PLAN" ? "PLAN VIEW" : "SECTION + PLAN"}
            </div>
            
            <div style={{ position: "absolute", top: 14, left: 14, fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.1em", background: "rgba(14,16,18,0.75)", padding: "4px 10px", borderRadius: 4, display: "flex", gap: 8, alignItems: "center", backdropFilter: "blur(4px)" }}>
              <span style={{ color: isDIY ? "var(--diy-col)" : "var(--pro-col)", fontWeight: 700 }}>{isDIY ? "DIY" : "PRO"}</span>
              <span style={{ color: "var(--border2)" }}>·</span>
              <span style={{ color: "var(--concrete-lt)", fontWeight: 700 }}>{footingType.toUpperCase()}</span>
              {result && (
                <>
                  <span style={{ color: "var(--border2)" }}>·</span>
                  <span style={{ color: "var(--straw)" }}>{result.mix.strength}</span>
                </>
              )}
            </div>
            
            {result && (
              <div style={{ position: "absolute", bottom: 14, right: 14, fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-mute)", letterSpacing: "0.1em", background: "rgba(14,16,18,0.7)", padding: "4px 10px", borderRadius: 4 }}>
                {result.quantity}× · {result.volume.totalWithWaste} m³ total
              </div>
            )}
          </div>
          
          {showList && (
            <div style={{ flex: "1 1 45%", overflowY: "auto", borderTop: "1px solid var(--border)" }}>
              <MaterialsList calc={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}