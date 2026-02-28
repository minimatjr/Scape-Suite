import { useState, useCallback } from "react";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#0E1012; --surface:#161A1D; --panel:#1C2126;
      --border:#2A3038; --border2:#323C46;
      --text:#C8CDD4; --text-dim:#5A6472; --text-mute:#3A4450;
      --stone:#8A9AA0; --stone-lt:#A8B8C0; --stone-dk:#5A6A70;
      --moss:#4A7A42; --moss-lt:#6AAA60; --straw:#B89848;
      --cream:#E8DCC8; --white:#F2EEE6;
      --locked:#232C34; --locked-txt:#3A4A58;
      --pro-col:#7A9EC8; --diy-col:#6AAA60;
      --full-col:#C87840; --budget-col:#8A7CC0;
      --block-col:#7A8A90; --mortar-col:#B8A080; --gravel-col:#8A7860;
      --concrete-col:#6A7A8A; --brick-col:#C86848; --sand-col:#D8C890;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;
    }
    body { font-family:var(--sans); background:var(--bg); color:var(--text); min-height:100vh; overflow:hidden; }
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const WALL_TYPES = [
  { id: "solid-flat", label: "Solid Blocks Flat", icon: "▬", desc: "Solid blocks laid flat (215mm thick, 100mm courses)" },
  { id: "solid-edge", label: "Solid Blocks on Edge", icon: "▮", desc: "Solid blocks on edge (100mm thick, 215mm courses)" },
  { id: "solid-double", label: "Double-Skin Solid", icon: "▰", desc: "Two rows of solid blocks on edge (200mm thick)" },
  { id: "hollow", label: "Hollow Blocks", icon: "▯", desc: "Hollow concrete blocks (440×215×215mm)" },
  { id: "brick-block", label: "Brick & Block", icon: "▦", desc: "Brick face with block backing on edge" },
];

const BLOCK_SPECS = {
  "solid-flat": { length: 440, height: 100, width: 215, blocksPerM2: 10, name: "Solid Dense Block 440×215×100mm (laid flat)" },
  "solid-edge": { length: 440, height: 215, width: 100, blocksPerM2: 10, name: "Solid Dense Block 440×215×100mm (on edge)" },
  "solid-double": { length: 440, height: 215, width: 100, blocksPerM2: 20, name: "Solid Dense Block 440×215×100mm ×2 (on edge)" },
  "hollow": { length: 440, height: 215, width: 215, blocksPerM2: 10, name: "Hollow Block 440×215×215mm" },
  "brick-block": { 
    length: 440, height: 215, width: 100, blocksPerM2: 10, 
    bricksPerM2: 60, brickName: "Facing Brick 215×102.5×65mm",
    name: "Block 440×215×100mm (on edge) + Brick face" 
  },
};

const VIEWS = ["SECTION", "ELEVATION", "BOTH"];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const mm = v => parseFloat(v) || 0;
const r2 = n => Math.round(n * 100) / 100;
const CEI = Math.ceil;
const fmm = v => v >= 1000 ? `${r2(v / 1000).toFixed(2)}m` : `${Math.round(v)}mm`;

/* ─── DIY SPEC RESOLVER ──────────────────────────────────────────────────── */
function resolveDIYSpec(tier, wallType, wallHeight) {
  const height = mm(wallHeight) || 600;
  // Foundation depth: min 150mm or 25% of wall height
  const foundationDepth = Math.max(150, Math.round((height * 0.25) / 50) * 50);
  // Foundation width: wall width + 200mm each side minimum
  const spec = BLOCK_SPECS[wallType];
  const wallWidth = wallType === "solid-double" ? spec.width * 2 + 10 : 
                    wallType === "brick-block" ? spec.width + 102.5 + 10 : spec.width;
  const foundationWidth = wallWidth + 200;
  
  // Gravel drainage layer: 150mm depth, 300mm width behind wall
  const gravelDepth = 150;
  const gravelWidth = 300;
  
  if (tier === "budget") {
    return {
      foundationDepth: String(foundationDepth),
      foundationWidth: String(foundationWidth),
      mortarRatio: "1:6", // 1 cement : 6 sand
      gravelDepth: String(gravelDepth),
      gravelWidth: String(gravelWidth),
      copingOverhang: "25",
    };
  }
  return {
    foundationDepth: String(Math.max(foundationDepth, 200)),
    foundationWidth: String(foundationWidth + 100),
    mortarRatio: "1:4", // stronger mix
    gravelDepth: String(200),
    gravelWidth: String(400),
    copingOverhang: "40",
  };
}

/* ─── CALCULATION ENGINE ─────────────────────────────────────────────────── */
function calcWall(s) {
  const length = mm(s.wallLength);
  const height = mm(s.wallHeight);
  
  if (!length || !height) return null;
  
  const wallType = s.wallType;
  const spec = BLOCK_SPECS[wallType];
  const foundationDepth = mm(s.foundationDepth);
  const foundationWidth = mm(s.foundationWidth);
  const gravelDepth = mm(s.gravelDepth);
  const gravelWidth = mm(s.gravelWidth);
  const waste = 1 + mm(s.waste) / 100;
  const isDIY = s.userMode === "diy";
  const addCoping = s.addCoping;
  const copingOverhang = mm(s.copingOverhang);
  
  // Wall dimensions
  const wallWidth = wallType === "solid-double" ? spec.width * 2 + 10 : 
                    wallType === "brick-block" ? spec.width + 102.5 + 10 : spec.width;
  
  // Area calculations
  const wallArea = (length / 1000) * (height / 1000); // m²
  
  // Block calculations
  const blocksNeeded = CEI(wallArea * spec.blocksPerM2 * waste);
  
  // Brick calculations (for brick-block only)
  const bricksNeeded = wallType === "brick-block" ? CEI(wallArea * spec.bricksPerM2 * waste) : 0;
  
  // Course calculations - use spec.height for course height
  const courseHeight = spec.height + 10; // block height + mortar joint
  const numCourses = CEI(height / courseHeight);
  const blocksPerCourse = CEI(length / (spec.length + 10)); // +10 for mortar joint
  
  // Mortar calculations
  // Approx 0.03m³ mortar per m² of blockwork (10mm joints)
  const mortarVolume = wallArea * 0.03;
  // For brick-block, add brick mortar (approx 0.04m³ per m²)
  const brickMortarVolume = wallType === "brick-block" ? wallArea * 0.04 : 0;
  const totalMortarVolume = mortarVolume + brickMortarVolume;
  
  // Mortar mix: parse ratio
  const ratio = s.mortarRatio || "1:4";
  const [cementPart, sandPart] = ratio.split(":").map(Number);
  const totalParts = cementPart + sandPart;
  
  // 1m³ mortar needs approx 1.5m³ of dry materials (bulking factor)
  const dryVolume = totalMortarVolume * 1.5;
  const cementVolume = (dryVolume * cementPart) / totalParts;
  const sandVolume = (dryVolume * sandPart) / totalParts;
  
  // Cement bags (25kg = ~0.017m³)
  const cementBags = CEI((cementVolume / 0.017) * waste);
  // Sand (bulk bags = 0.85m³, or loose bags = 25kg ≈ 0.015m³)
  const sandBulkBags = r2((sandVolume * waste) / 0.85);
  const sandKg = CEI(sandVolume * 1600 * waste); // 1600 kg/m³
  
  // Foundation concrete
  const foundationVolume = (foundationWidth / 1000) * (foundationDepth / 1000) * (length / 1000);
  // Concrete mix 1:2:4 (cement:sand:gravel)
  const foundationDryVolume = foundationVolume * 1.5;
  const foundationCementVolume = foundationDryVolume / 7;
  const foundationSandVolume = (foundationDryVolume * 2) / 7;
  const foundationGravelVolume = (foundationDryVolume * 4) / 7;
  
  const foundationCementBags = CEI((foundationCementVolume / 0.017) * waste);
  const foundationSandKg = CEI(foundationSandVolume * 1600 * waste);
  const foundationGravelKg = CEI(foundationGravelVolume * 1800 * waste); // 1800 kg/m³
  
  // Drainage gravel (behind wall)
  const drainageVolume = (gravelWidth / 1000) * (gravelDepth / 1000) * (length / 1000);
  const drainageGravelKg = CEI(drainageVolume * 1800 * waste);
  
  // Coping stones (if enabled)
  const copingLength = addCoping ? length : 0;
  const copingWidth = wallWidth + (copingOverhang * 2);
  const copingStones = addCoping ? CEI(length / 600) : 0; // assume 600mm coping stones
  
  // Wall ties (for cavity/double-skin walls)
  const wallTies = (wallType === "solid-double" || wallType === "brick-block") 
    ? CEI(wallArea * 4.4) // 4.4 ties per m²
    : 0;
  
  // DPC (damp proof course)
  const dpcLength = CEI(length / 1000) + 1; // metres, with overlap
  
  return {
    wallLength: length,
    wallHeight: height,
    wallWidth,
    wallArea: r2(wallArea),
    wallType,
    spec,
    courses: {
      count: numCourses,
      height: courseHeight - 10,
      blocksPerCourse,
    },
    blocks: {
      count: blocksNeeded,
      spec: spec,
    },
    bricks: {
      count: bricksNeeded,
      name: spec.brickName || "",
    },
    mortar: {
      volume: r2(totalMortarVolume),
      ratio,
      cementBags,
      sandKg,
      sandBulkBags,
    },
    foundation: {
      depth: foundationDepth,
      width: foundationWidth,
      volume: r2(foundationVolume),
      cementBags: foundationCementBags,
      sandKg: foundationSandKg,
      gravelKg: foundationGravelKg,
    },
    drainage: {
      depth: gravelDepth,
      width: gravelWidth,
      volume: r2(drainageVolume),
      gravelKg: drainageGravelKg,
    },
    coping: {
      enabled: addCoping,
      length: copingLength,
      width: copingWidth,
      stones: copingStones,
      overhang: copingOverhang,
    },
    hardware: {
      wallTies,
      dpcLength,
    },
    totals: {
      cementBags: cementBags + foundationCementBags,
      sandKg: sandKg + foundationSandKg,
      gravelKg: foundationGravelKg + drainageGravelKg,
    },
    userMode: s.userMode,
  };
}

/* ─── SVG SECTION VIEW ───────────────────────────────────────────────────── */
function WallSection({ calc, wallType }) {
  if (!calc) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="16" y="8" width="32" height="40" rx="2" stroke="#2A3038" strokeWidth="2" />
        <rect x="12" y="48" width="40" height="8" rx="1" stroke="#3A4450" strokeWidth="1.5" />
        <line x1="52" y1="20" x2="58" y2="20" stroke="#3A4450" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="52" y1="35" x2="58" y2="35" stroke="#3A4450" strokeWidth="1" strokeDasharray="2,2" />
      </svg>
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>ENTER DIMENSIONS TO GENERATE SECTION</span>
    </div>
  );

  const { wallHeight, wallWidth, foundation, drainage, coping, courses, spec } = calc;
  
  // SVG layout
  const PAD_L = 100, PAD_R = 80, PAD_T = 60, PAD_B = 80;
  const SVG_W = 500, SVG_H = 450;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;
  
  // Total height includes foundation and coping
  const totalHeight = wallHeight + foundation.depth + (coping.enabled ? 50 : 0);
  const totalWidth = Math.max(wallWidth, foundation.width) + drainage.width;
  
  const scaleX = drawW / totalWidth;
  const scaleY = drawH / totalHeight;
  const scale = Math.min(scaleX, scaleY) * 0.75;
  
  const wallW = wallWidth * scale;
  const wallH = wallHeight * scale;
  const foundW = foundation.width * scale;
  const foundH = foundation.depth * scale;
  const drainW = drainage.width * scale;
  const drainH = drainage.depth * scale;
  const copingH = coping.enabled ? 50 * scale : 0;
  
  // Position wall with drainage on left (retained earth side)
  const ox = PAD_L + drainW + 20; // Wall starts after drainage area
  const groundY = PAD_T + copingH + wallH;
  
  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;

  // Retained earth fill (left side, behind wall)
  els.push(<rect key={k()} x={ox - drainW - 25} y={PAD_T} width={drainW + 25} height={wallH + foundH + copingH + 40} fill="#2A2820" />);
  // Earth texture
  for (let i = 0; i < 25; i++) {
    const gx = ox - drainW - 20 + Math.random() * (drainW + 15);
    const gy = PAD_T + 20 + Math.random() * (wallH + copingH + foundH);
    els.push(<circle key={k()} cx={gx} cy={gy} r={1 + Math.random() * 2} fill="#3A3830" opacity="0.6" />);
  }

  // Ground level line
  els.push(<line key={k()} x1={ox - drainW - 30} y1={groundY} x2={ox + wallW + 60} y2={groundY} stroke="#4A4030" strokeWidth="2" />);
  
  // Ground fill (below ground level, right side only - open side)
  els.push(<rect key={k()} x={ox} y={groundY} width={wallW + 60} height={foundH + 40} fill="#1A1810" />);
  
  // Ground texture (right side)
  for (let i = 0; i < 15; i++) {
    const gx = ox + wallW + 10 + Math.random() * 40;
    const gy = groundY + 10 + Math.random() * (foundH + 20);
    els.push(<circle key={k()} cx={gx} cy={gy} r={1 + Math.random() * 2} fill="#2A2820" opacity="0.6" />);
  }
  
  // Foundation
  const foundX = ox - (foundW - wallW) / 2;
  els.push(<rect key={k()} x={foundX} y={groundY} width={foundW} height={foundH} fill="#5A6268" stroke="#6A7278" strokeWidth="1" />);
  // Foundation concrete texture
  for (let i = 0; i < 8; i++) {
    els.push(<circle key={k()} cx={foundX + 20 + Math.random() * (foundW - 40)} cy={groundY + 10 + Math.random() * (foundH - 20)} r={2 + Math.random() * 3} fill="#4A5258" opacity="0.5" />);
  }
  
  // DPC layer
  const dpcY = groundY - 2;
  els.push(<rect key={k()} x={ox} y={dpcY} width={wallW} height={4} fill="#2A2A2A" />);
  els.push(<text key={k()} x={ox + wallW + 10} y={dpcY + 3} fill="#5A5A5A" fontFamily="IBM Plex Mono" fontSize="7">DPC</text>);
  
  // Drainage gravel (LEFT side - behind wall, against retained earth)
  const drainX = ox - drainW - 5;
  els.push(<rect key={k()} x={drainX} y={groundY - drainH} width={drainW} height={drainH + foundH} fill="#6A6050" stroke="#7A7060" strokeWidth="1" rx="2" />);
  // Gravel texture
  for (let i = 0; i < 15; i++) {
    const gx = drainX + 5 + Math.random() * (drainW - 10);
    const gy = groundY - drainH + 10 + Math.random() * (drainH + foundH - 20);
    els.push(<circle key={k()} cx={gx} cy={gy} r={2 + Math.random() * 3} fill="#5A5040" opacity="0.7" />);
  }
  els.push(<text key={k()} x={drainX + drainW / 2} y={groundY + foundH / 2} textAnchor="middle" fill="#8A8070" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="500">DRAIN</text>);
  
  // Wall
  const wallX = ox;
  const wallY = PAD_T + copingH;
  
  // Draw wall based on type
  if (wallType === "solid-flat") {
    // Single skin solid blocks flat
    els.push(<rect key={k()} x={wallX} y={wallY} width={wallW} height={wallH} fill="#7A8590" stroke="#8A95A0" strokeWidth="1" />);
    // Draw course lines
    const courseH = (courses.height + 10) * scale;
    for (let c = 1; c < courses.count; c++) {
      const cy = wallY + c * courseH;
      els.push(<line key={k()} x1={wallX} y1={cy} x2={wallX + wallW} y2={cy} stroke="#5A6570" strokeWidth="1" />);
    }
  } else if (wallType === "solid-edge" || wallType === "hollow") {
    // Single skin blocks on edge or hollow
    const fill = wallType === "hollow" ? "#6A7580" : "#7A8590";
    els.push(<rect key={k()} x={wallX} y={wallY} width={wallW} height={wallH} fill={fill} stroke="#8A95A0" strokeWidth="1" />);
    const courseH = (courses.height + 10) * scale;
    for (let c = 1; c < courses.count; c++) {
      const cy = wallY + c * courseH;
      els.push(<line key={k()} x1={wallX} y1={cy} x2={wallX + wallW} y2={cy} stroke="#5A6570" strokeWidth="1" />);
    }
    // Hollow block cavities
    if (wallType === "hollow") {
      for (let c = 0; c < courses.count; c++) {
        const cy = wallY + c * courseH + courseH / 2;
        els.push(<rect key={k()} x={wallX + wallW * 0.2} y={cy - courseH * 0.3} width={wallW * 0.25} height={courseH * 0.6} fill="#4A5560" rx="2" />);
        els.push(<rect key={k()} x={wallX + wallW * 0.55} y={cy - courseH * 0.3} width={wallW * 0.25} height={courseH * 0.6} fill="#4A5560" rx="2" />);
      }
    }
  } else if (wallType === "solid-double") {
    // Double skin solid blocks
    const skinW = (wallW - 10 * scale) / 2;
    els.push(<rect key={k()} x={wallX} y={wallY} width={skinW} height={wallH} fill="#7A8590" stroke="#8A95A0" strokeWidth="1" />);
    els.push(<rect key={k()} x={wallX + skinW + 10 * scale} y={wallY} width={skinW} height={wallH} fill="#7A8590" stroke="#8A95A0" strokeWidth="1" />);
    // Cavity
    els.push(<rect key={k()} x={wallX + skinW} y={wallY} width={10 * scale} height={wallH} fill="#3A4048" />);
    // Course lines
    const courseH = (courses.height + 10) * scale;
    for (let c = 1; c < courses.count; c++) {
      const cy = wallY + c * courseH;
      els.push(<line key={k()} x1={wallX} y1={cy} x2={wallX + skinW} y2={cy} stroke="#5A6570" strokeWidth="1" />);
      els.push(<line key={k()} x1={wallX + skinW + 10 * scale} y1={cy} x2={wallX + wallW} y2={cy} stroke="#5A6570" strokeWidth="1" />);
    }
    // Wall ties
    for (let c = 0; c < courses.count; c += 2) {
      const cy = wallY + c * courseH + courseH / 2;
      els.push(<line key={k()} x1={wallX + skinW} y1={cy} x2={wallX + skinW + 10 * scale} y2={cy} stroke="#5A6570" strokeWidth="2" />);
    }
  } else if (wallType === "brick-block") {
    // Brick face with block backing
    const brickW = 102.5 * scale;
    const blockW = wallW - brickW - 10 * scale;
    // Block backing
    els.push(<rect key={k()} x={wallX} y={wallY} width={blockW} height={wallH} fill="#7A8590" stroke="#8A95A0" strokeWidth="1" />);
    // Cavity
    els.push(<rect key={k()} x={wallX + blockW} y={wallY} width={10 * scale} height={wallH} fill="#3A4048" />);
    // Brick face
    els.push(<rect key={k()} x={wallX + blockW + 10 * scale} y={wallY} width={brickW} height={wallH} fill="#B86850" stroke="#C87860" strokeWidth="1" />);
    // Brick courses (65mm + 10mm mortar)
    const brickCourseH = 75 * scale;
    for (let c = 1; c < Math.ceil(wallH / brickCourseH); c++) {
      const cy = wallY + c * brickCourseH;
      if (cy < wallY + wallH) {
        els.push(<line key={k()} x1={wallX + blockW + 10 * scale} y1={cy} x2={wallX + wallW} y2={cy} stroke="#8A4838" strokeWidth="1" />);
      }
    }
    // Block courses
    const courseH = (courses.height + 10) * scale;
    for (let c = 1; c < courses.count; c++) {
      const cy = wallY + c * courseH;
      els.push(<line key={k()} x1={wallX} y1={cy} x2={wallX + blockW} y2={cy} stroke="#5A6570" strokeWidth="1" />);
    }
    // Wall ties
    for (let c = 0; c < courses.count; c += 2) {
      const cy = wallY + c * courseH + courseH / 2;
      els.push(<line key={k()} x1={wallX + blockW} y1={cy} x2={wallX + blockW + 10 * scale} y2={cy} stroke="#5A6570" strokeWidth="2" />);
    }
  }
  
  // Coping
  if (coping.enabled) {
    const copingW = coping.width * scale;
    const copingX = wallX - (copingW - wallW) / 2;
    els.push(<rect key={k()} x={copingX} y={PAD_T} width={copingW} height={copingH} fill="#9AA0A8" stroke="#AAB0B8" strokeWidth="1" rx="2" />);
    // Coping drip edge
    els.push(<line key={k()} x1={copingX + 5} y1={PAD_T + copingH - 3} x2={copingX + copingW - 5} y2={PAD_T + copingH - 3} stroke="#7A8088" strokeWidth="1" />);
  }
  
  // ─── DIMENSION ANNOTATIONS ───────────────────────────────────────────────
  const dimColor = "#C87840";
  const dimColorLight = "#E09860";
  
  // Wall height (right side)
  const dimX1 = wallX + wallW + 25;
  els.push(<line key={k()} x1={dimX1} y1={wallY} x2={dimX1} y2={groundY} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={dimX1 - 4} y1={wallY} x2={dimX1 + 4} y2={wallY} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={dimX1 - 4} y1={groundY} x2={dimX1 + 4} y2={groundY} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<text key={k()} x={dimX1 + 8} y={(wallY + groundY) / 2} textAnchor="start" dominantBaseline="middle" fill={dimColor} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600" transform={`rotate(-90,${dimX1 + 8},${(wallY + groundY) / 2})`}>{fmm(calc.wallHeight)}</text>);
  
  // Foundation depth (right side, below ground)
  const dimX2 = wallX + wallW + 50;
  els.push(<line key={k()} x1={dimX2} y1={groundY} x2={dimX2} y2={groundY + foundH} stroke={dimColorLight} strokeWidth="1" />);
  els.push(<line key={k()} x1={dimX2 - 3} y1={groundY} x2={dimX2 + 3} y2={groundY} stroke={dimColorLight} strokeWidth="1" />);
  els.push(<line key={k()} x1={dimX2 - 3} y1={groundY + foundH} x2={dimX2 + 3} y2={groundY + foundH} stroke={dimColorLight} strokeWidth="1" />);
  els.push(<text key={k()} x={dimX2 + 6} y={groundY + foundH / 2} textAnchor="start" dominantBaseline="middle" fill={dimColorLight} fontFamily="IBM Plex Mono" fontSize="8">{fmm(foundation.depth)}</text>);
  
  // Wall width (top)
  const dimY1 = wallY - 20;
  els.push(<line key={k()} x1={wallX} y1={dimY1} x2={wallX + wallW} y2={dimY1} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={wallX} y1={dimY1 - 4} x2={wallX} y2={dimY1 + 4} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={wallX + wallW} y1={dimY1 - 4} x2={wallX + wallW} y2={dimY1 + 4} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<text key={k()} x={wallX + wallW / 2} y={dimY1 - 8} textAnchor="middle" fill={dimColor} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600">{fmm(calc.wallWidth)}</text>);
  
  // Foundation width (bottom)
  const dimY2 = groundY + foundH + 20;
  els.push(<line key={k()} x1={foundX} y1={dimY2} x2={foundX + foundW} y2={dimY2} stroke={dimColorLight} strokeWidth="1" />);
  els.push(<line key={k()} x1={foundX} y1={dimY2 - 3} x2={foundX} y2={dimY2 + 3} stroke={dimColorLight} strokeWidth="1" />);
  els.push(<line key={k()} x1={foundX + foundW} y1={dimY2 - 3} x2={foundX + foundW} y2={dimY2 + 3} stroke={dimColorLight} strokeWidth="1" />);
  els.push(<text key={k()} x={foundX + foundW / 2} y={dimY2 + 14} textAnchor="middle" fill={dimColorLight} fontFamily="IBM Plex Mono" fontSize="8">{fmm(foundation.width)} foundation</text>);
  
  // Drainage width (left side)
  const drainDimY = groundY - drainH - 15;
  els.push(<line key={k()} x1={drainX} y1={drainDimY} x2={drainX + drainW} y2={drainDimY} stroke="#8A7860" strokeWidth="1" />);
  els.push(<text key={k()} x={drainX + drainW / 2} y={drainDimY - 6} textAnchor="middle" fill="#8A7860" fontFamily="IBM Plex Mono" fontSize="7">{fmm(drainage.width)}</text>);
  
  // Retained earth label
  els.push(<text key={k()} x={drainX - 10} y={wallY + wallH / 2} textAnchor="middle" fill="#5A5850" fontFamily="IBM Plex Mono" fontSize="8" fontWeight="500" transform={`rotate(-90,${drainX - 10},${wallY + wallH / 2})`}>RETAINED EARTH</text>);
  
  // Labels
  els.push(
    <g key={k()} transform={`translate(${PAD_L - 85}, ${PAD_T})`}>
      <rect x="0" y="0" width="70" height="50" fill="rgba(14,16,18,0.85)" rx="4" stroke="var(--border)" strokeWidth="1" />
      <text x="8" y="14" fontFamily="IBM Plex Mono" fontSize="6" fill="var(--text-mute)" letterSpacing="0.1em">SECTION VIEW</text>
      <text x="8" y="28" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--stone-lt)" fontWeight="600">{calc.courses.count}</text>
      <text x="22" y="28" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">courses</text>
      <text x="8" y="42" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--moss-lt)" fontWeight="600">{r2(calc.wallArea)}m²</text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "100%" }}>
      {els}
    </svg>
  );
}

/* ─── SVG ELEVATION VIEW ─────────────────────────────────────────────────── */
function WallElevation({ calc, wallType }) {
  if (!calc) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="20" width="48" height="32" rx="2" stroke="#2A3038" strokeWidth="2" />
        <line x1="8" y1="36" x2="56" y2="36" stroke="#3A4450" strokeWidth="1" />
        <line x1="24" y1="20" x2="24" y2="52" stroke="#3A4450" strokeWidth="1" />
        <line x1="40" y1="20" x2="40" y2="52" stroke="#3A4450" strokeWidth="1" />
      </svg>
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>ENTER DIMENSIONS TO GENERATE ELEVATION</span>
    </div>
  );

  const { wallLength, wallHeight, courses, coping, spec } = calc;
  
  // SVG layout
  const PAD_L = 80, PAD_R = 60, PAD_T = 60, PAD_B = 80;
  const SVG_W = 800, SVG_H = 400;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;
  
  const totalHeight = wallHeight + (coping.enabled ? 50 : 0);
  
  const scaleX = drawW / wallLength;
  const scaleY = drawH / totalHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85;
  
  const wallW = wallLength * scale;
  const wallH = wallHeight * scale;
  const copingH = coping.enabled ? 50 * scale : 0;
  
  const ox = PAD_L + (drawW - wallW) / 2;
  const oy = PAD_T + copingH;
  
  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;

  // Ground line
  els.push(<line key={k()} x1={ox - 30} y1={oy + wallH} x2={ox + wallW + 30} y2={oy + wallH} stroke="#4A4030" strokeWidth="2" />);
  
  // Wall background
  const wallFill = wallType === "brick-block" ? "#B86850" : "#7A8590";
  els.push(<rect key={k()} x={ox} y={oy} width={wallW} height={wallH} fill={wallFill} stroke="#8A95A0" strokeWidth="1" />);
  
  // Draw block/brick pattern
  const courseH = (courses.height + 10) * scale;
  const blockW = (spec.length + 10) * scale;
  
  if (wallType === "brick-block") {
    // Brick stretcher bond pattern
    const brickCourseH = 75 * scale;
    const brickW = 225 * scale; // 215mm brick + 10mm mortar
    for (let c = 0; c < Math.ceil(wallH / brickCourseH); c++) {
      const cy = oy + c * brickCourseH;
      if (cy < oy + wallH - 1) {
        els.push(<line key={k()} x1={ox} y1={cy + brickCourseH} x2={ox + wallW} y2={cy + brickCourseH} stroke="#8A4838" strokeWidth="1" />);
      }
      // Vertical joints (staggered)
      const offset = (c % 2) * (brickW / 2);
      for (let b = 0; b < Math.ceil(wallW / brickW) + 1; b++) {
        const bx = ox + offset + b * brickW;
        if (bx > ox && bx < ox + wallW) {
          els.push(<line key={k()} x1={bx} y1={cy} x2={bx} y2={Math.min(cy + brickCourseH, oy + wallH)} stroke="#8A4838" strokeWidth="1" />);
        }
      }
    }
  } else {
    // Block pattern (stretcher bond)
    for (let c = 0; c < courses.count; c++) {
      const cy = oy + c * courseH;
      if (c > 0) {
        els.push(<line key={k()} x1={ox} y1={cy} x2={ox + wallW} y2={cy} stroke="#5A6570" strokeWidth="1" />);
      }
      // Vertical joints (staggered)
      const offset = (c % 2) * (blockW / 2);
      for (let b = 0; b < Math.ceil(wallW / blockW) + 1; b++) {
        const bx = ox + offset + b * blockW;
        if (bx > ox && bx < ox + wallW) {
          els.push(<line key={k()} x1={bx} y1={cy} x2={bx} y2={Math.min(cy + courseH, oy + wallH)} stroke="#5A6570" strokeWidth="1" />);
        }
      }
    }
  }
  
  // Coping
  if (coping.enabled) {
    els.push(<rect key={k()} x={ox - 10} y={PAD_T} width={wallW + 20} height={copingH} fill="#9AA0A8" stroke="#AAB0B8" strokeWidth="1" rx="2" />);
    // Coping joints
    const copingStoneW = 600 * scale;
    for (let s = 1; s < Math.ceil(wallW / copingStoneW); s++) {
      const sx = ox + s * copingStoneW;
      if (sx < ox + wallW) {
        els.push(<line key={k()} x1={sx} y1={PAD_T} x2={sx} y2={PAD_T + copingH} stroke="#7A8088" strokeWidth="1" />);
      }
    }
  }
  
  // ─── DIMENSION ANNOTATIONS ───────────────────────────────────────────────
  const dimColor = "#C87840";
  
  // Wall length (bottom)
  const dimY1 = oy + wallH + 25;
  els.push(<line key={k()} x1={ox} y1={dimY1} x2={ox + wallW} y2={dimY1} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={ox} y1={dimY1 - 4} x2={ox} y2={dimY1 + 4} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={ox + wallW} y1={dimY1 - 4} x2={ox + wallW} y2={dimY1 + 4} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<text key={k()} x={ox + wallW / 2} y={dimY1 + 16} textAnchor="middle" fill={dimColor} fontFamily="IBM Plex Mono" fontSize="11" fontWeight="600">{fmm(wallLength)}</text>);
  
  // Wall height (left)
  const dimX1 = ox - 25;
  els.push(<line key={k()} x1={dimX1} y1={oy} x2={dimX1} y2={oy + wallH} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={dimX1 - 4} y1={oy} x2={dimX1 + 4} y2={oy} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={dimX1 - 4} y1={oy + wallH} x2={dimX1 + 4} y2={oy + wallH} stroke={dimColor} strokeWidth="1.5" />);
  els.push(<text key={k()} x={dimX1 - 8} y={oy + wallH / 2} textAnchor="end" dominantBaseline="middle" fill={dimColor} fontFamily="IBM Plex Mono" fontSize="11" fontWeight="600" transform={`rotate(-90,${dimX1 - 8},${oy + wallH / 2})`}>{fmm(wallHeight)}</text>);
  
  // Summary box
  els.push(
    <g key={k()} transform={`translate(${ox + wallW + 20}, ${oy})`}>
      <rect x="0" y="0" width="90" height="65" fill="rgba(14,16,18,0.85)" rx="4" stroke="var(--border)" strokeWidth="1" />
      <text x="8" y="14" fontFamily="IBM Plex Mono" fontSize="6" fill="var(--text-mute)" letterSpacing="0.1em">ELEVATION</text>
      <text x="8" y="30" fontFamily="IBM Plex Mono" fontSize="10" fill="var(--stone-lt)" fontWeight="600">{calc.blocks.count}</text>
      <text x="8" y="42" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">blocks</text>
      {calc.bricks.count > 0 && (
        <>
          <text x="8" y="56" fontFamily="IBM Plex Mono" fontSize="10" fill="var(--brick-col)" fontWeight="600">{calc.bricks.count}</text>
          <text x="50" y="56" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">bricks</text>
        </>
      )}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "100%" }}>
      {els}
    </svg>
  );
}

/* ─── CUTTING LIST ───────────────────────────────────────────────────────── */
function MaterialsList({ calc }) {
  if (!calc) return null;
  
  const { wallType, blocks, bricks, mortar, foundation, drainage, coping, hardware, totals, spec } = calc;
  const hasBricks = wallType === "brick-block";
  const hasWallTies = hardware.wallTies > 0;
  
  const sections = [
    {
      title: "BLOCKS",
      color: "var(--block-col)",
      rows: [
        { 
          item: spec.name, 
          qty: blocks.count, 
          unit: "blocks",
          note: `${spec.blocksPerM2} per m² + ${Math.round((mm(calc.userMode === "diy" ? "10" : calc.waste) || 10))}% waste`
        },
      ]
    },
    ...(hasBricks ? [{
      title: "BRICKS",
      color: "var(--brick-col)",
      rows: [
        { 
          item: bricks.name, 
          qty: bricks.count, 
          unit: "bricks",
          note: `${spec.bricksPerM2} per m² + waste`
        },
      ]
    }] : []),
    {
      title: "MORTAR (Wall)",
      color: "var(--mortar-col)",
      rows: [
        { item: `Cement (${mortar.ratio} mix)`, qty: mortar.cementBags, unit: "bags ×25kg", note: `${mortar.volume}m³ mortar vol` },
        { item: "Building sand", qty: Math.ceil(mortar.sandKg / 25), unit: "bags ×25kg", note: `${mortar.sandKg}kg total` },
      ]
    },
    {
      title: "FOUNDATION (1:2:4 mix)",
      color: "var(--concrete-col)",
      rows: [
        { item: "Cement", qty: foundation.cementBags, unit: "bags ×25kg", note: `${foundation.volume}m³ concrete` },
        { item: "Sharp sand", qty: Math.ceil(foundation.sandKg / 25), unit: "bags ×25kg", note: `${foundation.sandKg}kg` },
        { item: "Gravel/aggregate", qty: Math.ceil(foundation.gravelKg / 25), unit: "bags ×25kg", note: `${foundation.gravelKg}kg` },
      ]
    },
    {
      title: "DRAINAGE",
      color: "var(--gravel-col)",
      rows: [
        { item: "Drainage gravel (20mm)", qty: Math.ceil(drainage.gravelKg / 25), unit: "bags ×25kg", note: `${drainage.volume}m³ behind wall` },
      ]
    },
  ];

  const hwRows = [
    { item: "DPC (damp proof course)", qty: hardware.dpcLength, unit: "m (roll)" },
    ...(hasWallTies ? [{ item: "Wall ties", qty: hardware.wallTies, unit: "no." }] : []),
    ...(coping.enabled ? [{ item: "Coping stones (600mm)", qty: coping.stones, unit: "no." }] : []),
  ].filter(h => h.qty > 0);

  const totalRows = [
    { item: "Total Cement", qty: totals.cementBags, unit: "bags ×25kg", color: "var(--mortar-col)" },
    { item: "Total Sand", qty: Math.ceil(totals.sandKg / 25), unit: "bags ×25kg", color: "var(--sand-col)" },
    { item: "Total Gravel", qty: Math.ceil(totals.gravelKg / 25), unit: "bags ×25kg", color: "var(--gravel-col)" },
  ];

  return (
    <div style={{ fontFamily: "var(--mono)" }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border)", marginBottom: 1 }}>
        {[
          { l: "Wall Area", v: `${calc.wallArea} m²`, c: "var(--moss-lt)" },
          { l: "Blocks", v: blocks.count, c: "var(--block-col)" },
          ...(hasBricks ? [{ l: "Bricks", v: bricks.count, c: "var(--brick-col)" }] : [{ l: "Courses", v: calc.courses.count, c: "var(--stone-lt)" }]),
          { l: "Foundation", v: `${foundation.volume} m³`, c: "var(--concrete-col)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--surface)", padding: "14px 16px" }}>
            <div style={{ fontSize: "0.6rem", color: "var(--text-mute)", letterSpacing: "0.1em", marginBottom: 6 }}>{s.l}</div>
            <div style={{ fontSize: "1.3rem", color: s.c, fontWeight: 600 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Materials tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
        {sections.map((sec, si) => (
          <div key={si} style={{ background: "var(--surface)" }}>
            <div style={{ padding: "8px 16px", fontSize: "0.6rem", letterSpacing: "0.14em", color: sec.color, borderBottom: `2px solid ${sec.color}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "block", width: 8, height: 8, borderRadius: 2, background: sec.color }} />{sec.title}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["MATERIAL", "QTY", "UNIT", "NOTE"].map(h => (
                    <th key={h} style={{ padding: "6px 12px", fontSize: "0.58rem", color: "var(--text-mute)", letterSpacing: "0.1em", textAlign: h === "QTY" ? "center" : "left", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sec.rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "9px 12px", fontSize: "0.75rem", color: "var(--text)" }}>{row.item}</td>
                    <td style={{ padding: "9px 12px", fontSize: "0.9rem", color: sec.color, fontWeight: 600, textAlign: "center" }}>{row.qty}</td>
                    <td style={{ padding: "9px 12px", fontSize: "0.72rem", color: "var(--cream)" }}>{row.unit}</td>
                    <td style={{ padding: "9px 12px", fontSize: "0.68rem", color: "var(--text-dim)" }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ background: "var(--surface)", marginTop: 1 }}>
        <div style={{ padding: "8px 16px", fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--cream)", borderBottom: "2px solid var(--cream)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "block", width: 8, height: 8, borderRadius: 2, background: "var(--cream)" }} />COMBINED TOTALS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${totalRows.length}, 1fr)`, gap: 0 }}>
          {totalRows.map((t, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRight: i < totalRows.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 6 }}>{t.item}</div>
              <div style={{ fontSize: "1.2rem", color: t.color, fontWeight: 600 }}>{t.qty}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-mute)", marginTop: 2 }}>{t.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hardware */}
      {hwRows.length > 0 && (
        <div style={{ background: "var(--surface)", marginTop: 1 }}>
          <div style={{ padding: "8px 16px", fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--straw)", borderBottom: "2px solid var(--straw)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "block", width: 8, height: 8, borderRadius: 2, background: "var(--straw)" }} />ACCESSORIES
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${hwRows.length}, 1fr)`, gap: 0 }}>
            {hwRows.map((h, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRight: i < hwRows.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 6, lineHeight: 1.4 }}>{h.item}</div>
                <div style={{ fontSize: "1.1rem", color: "var(--straw)", fontWeight: 600 }}>{h.qty}</div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-mute)", marginTop: 2 }}>{h.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ padding: "10px 16px", fontSize: "0.68rem", color: "var(--text-dim)", background: "var(--panel)", borderTop: "1px solid var(--border)", lineHeight: 1.7 }}>
        ⚠ All quantities include waste allowance. Foundation depth assumes stable soil — increase for soft/clay soils. Walls over 1m high may require engineering design. Check local building regulations for retaining walls.
      </div>
    </div>
  );
}

/* ─── UI COMPONENTS ──────────────────────────────────────────────────────── */
function Field({ label, value, onChange, min, max, unit, hint, small, locked, lockedReason, disabled }) {
  const isLocked = locked === true;
  const isDisabled = disabled === true;
  return (
    <div style={{ marginBottom: small ? 8 : 12, opacity: isLocked || isDisabled ? 0.52 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <label style={{ fontSize: small ? "0.68rem" : "0.72rem", color: isLocked ? "var(--locked-txt)" : "var(--text-dim)", fontFamily: "var(--mono)", letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
          {label}{isLocked && <span style={{ fontSize: "0.55rem", color: "var(--locked-txt)" }}>— AUTO</span>}
        </label>
        {unit && <span style={{ fontSize: "0.62rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{unit}</span>}
      </div>
      <input 
        type="number" 
        value={value} 
        onChange={e => !isLocked && !isDisabled && onChange(e.target.value)} 
        readOnly={isLocked || isDisabled} 
        min={min} 
        max={max}
        style={{ 
          width: "100%", 
          background: isLocked ? "var(--locked)" : "var(--bg)", 
          border: `1px solid ${isLocked ? "var(--border)" : "var(--border2)"}`, 
          borderRadius: 4, 
          padding: small ? "5px 8px" : "7px 10px", 
          color: isLocked ? "var(--locked-txt)" : "var(--white)", 
          fontFamily: "var(--mono)", 
          fontSize: small ? "0.85rem" : "0.9rem", 
          outline: "none", 
          cursor: isLocked || isDisabled ? "not-allowed" : "text" 
        }}
        onFocus={e => { if (!isLocked && !isDisabled) e.target.style.borderColor = "var(--stone-lt)"; }}
        onBlur={e => { e.target.style.borderColor = isLocked ? "var(--border)" : "var(--border2)"; }}
      />
      {hint && !isLocked && <div style={{ fontSize: "0.62rem", color: "var(--text-mute)", marginTop: 3, fontFamily: "var(--mono)" }}>{hint}</div>}
      {isLocked && lockedReason && <div style={{ fontSize: "0.60rem", color: "var(--locked-txt)", marginTop: 3, fontFamily: "var(--mono)" }}>{lockedReason}</div>}
    </div>
  );
}

function PanelSection({ title, children, accent = "var(--stone)" }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
        <span style={{ display: "block", width: 3, height: 14, background: accent, borderRadius: 2 }} />
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-dim)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function SegControl({ options, value, onChange, accentMap }) {
  return (
    <div style={{ display: "flex", background: "var(--bg)", borderRadius: 6, padding: 2, border: "1px solid var(--border)", gap: 2 }}>
      {options.map(o => {
        const active = value === o.id;
        const col = accentMap?.[o.id] || "var(--stone)";
        return (
          <button 
            key={o.id} 
            onClick={() => onChange(o.id)} 
            style={{ 
              flex: 1, 
              padding: "5px 10px", 
              borderRadius: 4, 
              border: "none", 
              background: active ? "var(--panel)" : "transparent", 
              color: active ? col : "var(--text-dim)", 
              fontFamily: "var(--mono)", 
              fontSize: "0.64rem", 
              letterSpacing: "0.1em", 
              cursor: "pointer", 
              transition: "all 0.15s", 
              fontWeight: active ? 600 : 400, 
              boxShadow: active ? `inset 0 0 0 1px ${col}40` : "none" 
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, checked, onChange, accent = "var(--stone)", sub }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 10 }}>
      <div 
        onClick={() => onChange(!checked)} 
        style={{ 
          width: 36, 
          height: 19, 
          borderRadius: 10, 
          background: checked ? accent : "var(--border2)", 
          position: "relative", 
          transition: "background 0.2s", 
          flexShrink: 0, 
          cursor: "pointer", 
          marginTop: 1 
        }}
      >
        <div style={{ 
          position: "absolute", 
          top: 2.5, 
          left: checked ? 18 : 2.5, 
          width: 14, 
          height: 14, 
          borderRadius: 7, 
          background: "white", 
          transition: "left 0.18s", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)" 
        }} />
      </div>
      <div>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.69rem", color: checked ? "var(--text)" : "var(--text-dim)", display: "block" }}>{label}</span>
        {sub && <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-mute)", display: "block", marginTop: 2, lineHeight: 1.4 }}>{sub}</span>}
      </div>
    </label>
  );
}

function WallTypeCard({ type, selected, onClick }) {
  const isSelected = selected === type.id;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: isSelected ? "rgba(138,154,160,0.12)" : "var(--bg)",
        border: `1px solid ${isSelected ? "var(--stone)" : "var(--border)"}`,
        borderRadius: 6,
        cursor: "pointer",
        transition: "all 0.15s",
        width: "100%",
        textAlign: "left",
        marginBottom: 6,
      }}
    >
      <span style={{ 
        fontSize: "1.4rem", 
        color: isSelected ? "var(--stone-lt)" : "var(--text-mute)",
        width: 28,
        textAlign: "center",
      }}>
        {type.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontFamily: "var(--mono)", 
          fontSize: "0.72rem", 
          color: isSelected ? "var(--cream)" : "var(--text-dim)",
          fontWeight: isSelected ? 600 : 400,
          marginBottom: 2,
        }}>
          {type.label}
        </div>
        <div style={{ 
          fontFamily: "var(--mono)", 
          fontSize: "0.58rem", 
          color: "var(--text-mute)",
          lineHeight: 1.4,
        }}>
          {type.desc}
        </div>
      </div>
      {isSelected && (
        <span style={{ color: "var(--stone-lt)", fontSize: "0.9rem" }}>✓</span>
      )}
    </button>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function RetainingWallCalculator() {
  const [wallType, setWallType] = useState("solid-flat");
  const [view, setView] = useState("SECTION");
  const [showList, setShowList] = useState(false);
  const [tab, setTab] = useState("wall");
  const [userMode, setUserMode] = useState("pro");
  const [specTier, setSpecTier] = useState("full");

  const [d, setD] = useState({
    wallLength: "3000",
    wallHeight: "600",
    foundationDepth: "200",
    foundationWidth: "400",
    gravelDepth: "150",
    gravelWidth: "300",
    mortarRatio: "1:4",
    copingOverhang: "40",
    waste: "10",
  });

  const [extras, setExtras] = useState({
    addCoping: true,
  });

  const set = k => v => setD(p => ({ ...p, [k]: v }));
  const isDIY = userMode === "diy";

  const diySpec = isDIY ? resolveDIYSpec(specTier, wallType, d.wallHeight) : null;
  const effectiveD = isDIY ? { ...d, ...diySpec, ...extras } : { ...d, ...extras };

  const result = useCallback(() => {
    try {
      return calcWall({ ...effectiveD, wallType, userMode });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [effectiveD, wallType, userMode])();

  const fval = k => {
    if (isDIY && diySpec && k in diySpec) return diySpec[k];
    return d[k];
  };

  const isLocked = k => {
    if (!isDIY) return false;
    const alwaysLocked = ["foundationDepth", "foundationWidth", "gravelDepth", "gravelWidth", "mortarRatio", "copingOverhang"];
    return alwaysLocked.includes(k);
  };

  const lockReason = k => {
    if (!isDIY) return "";
    if (k === "foundationDepth") return diySpec ? `Auto: ${diySpec.foundationDepth}mm` : "";
    if (k === "foundationWidth") return diySpec ? `Auto: ${diySpec.foundationWidth}mm` : "";
    if (k === "gravelDepth") return diySpec ? `Auto: ${diySpec.gravelDepth}mm` : "";
    if (k === "gravelWidth") return diySpec ? `Auto: ${diySpec.gravelWidth}mm` : "";
    if (k === "mortarRatio") return diySpec ? `Auto: ${diySpec.mortarRatio}` : "";
    if (k === "copingOverhang") return diySpec ? `Auto: ${diySpec.copingOverhang}mm` : "";
    return "";
  };

  const TABS = [
    { id: "wall", label: "WALL" },
    { id: "foundation", label: "FOUNDATION" },
    { id: "materials", label: "MATERIALS" },
    ...(!isDIY ? [{ id: "extras", label: "EXTRAS" }] : []),
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - var(--nav-height, 0px))",background:"var(--bg)",overflow:"hidden"}}>
      <GlobalStyle />

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 48, background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, background: "var(--moss)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌿</div>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--cream)", letterSpacing: "0.08em" }}>LANDSCAPECALC</span>
          <span style={{ color: "var(--border2)", fontSize: "0.8rem" }}>›</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--stone-lt)", letterSpacing: "0.06em" }}>RETAINING WALL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SegControl 
            options={[{ id: "diy", label: "DIY" }, { id: "pro", label: "PRO" }]} 
            value={userMode} 
            onChange={m => { setUserMode(m); setTab("wall"); }} 
            accentMap={{ diy: "var(--diy-col)", pro: "var(--pro-col)" }} 
          />
          <SegControl 
            options={[{ id: "full", label: "FULL" }, { id: "budget", label: "BUDGET" }]} 
            value={specTier} 
            onChange={setSpecTier} 
            accentMap={{ full: "var(--full-col)", budget: "var(--budget-col)" }} 
          />
          <div style={{ width: 1, height: 24, background: "var(--border)" }} />
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 6, padding: 2, border: "1px solid var(--border)", gap: 2 }}>
            {VIEWS.map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                style={{ 
                  padding: "4px 10px", 
                  borderRadius: 4, 
                  border: "none", 
                  background: view === v ? "var(--panel)" : "transparent", 
                  color: view === v ? "var(--cream)" : "var(--text-dim)", 
                  fontFamily: "var(--mono)", 
                  fontSize: "0.62rem", 
                  letterSpacing: "0.1em", 
                  cursor: "pointer", 
                  transition: "all 0.15s" 
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowList(s => !s)}
            style={{
              padding: "5px 12px",
              borderRadius: 5,
              border: "none",
              background: showList ? "var(--stone)" : "var(--panel)",
              color: showList ? "var(--bg)" : "var(--cream)",
              fontFamily: "var(--mono)",
              fontSize: "0.64rem",
              letterSpacing: "0.08em",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {showList ? "HIDE LIST" : "MATERIALS"}
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* LEFT — INPUT PANEL */}
        <div style={{ width: 320, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden", flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: tab === t.id ? "var(--panel)" : "transparent",
                  border: "none",
                  borderBottom: tab === t.id ? "2px solid var(--stone-lt)" : "2px solid transparent",
                  color: tab === t.id ? "var(--stone-lt)" : "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {/* WALL TAB */}
            {tab === "wall" && (
              <>
                <PanelSection title="Wall Type" accent="var(--stone-lt)">
                  {WALL_TYPES.map(type => (
                    <WallTypeCard
                      key={type.id}
                      type={type}
                      selected={wallType}
                      onClick={() => setWallType(type.id)}
                    />
                  ))}
                </PanelSection>

                <PanelSection title="Dimensions" accent="var(--stone)">
                  <Field label="Wall Length" value={d.wallLength} onChange={set("wallLength")} unit="mm" hint="total length of wall" />
                  <Field label="Wall Height" value={d.wallHeight} onChange={set("wallHeight")} unit="mm" hint="above ground level (max ~1200mm without engineering)" />
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(138,154,160,0.08)", border: "1px solid rgba(138,154,160,0.2)", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>WALL SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Wall Area", v: `${result.wallArea} m²` },
                        { l: "Wall Width", v: fmm(result.wallWidth) },
                        { l: "Courses", v: result.courses.count },
                        { l: "Blocks", v: result.blocks.count },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--stone-lt)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* FOUNDATION TAB */}
            {tab === "foundation" && (
              <>
                <PanelSection title="Foundation" accent="var(--concrete-col)">
                  <Field 
                    label="Foundation Depth" 
                    value={fval("foundationDepth")} 
                    onChange={set("foundationDepth")} 
                    unit="mm" 
                    hint="min 150mm or 25% of wall height"
                    small 
                    locked={isLocked("foundationDepth")} 
                    lockedReason={lockReason("foundationDepth")} 
                  />
                  <Field 
                    label="Foundation Width" 
                    value={fval("foundationWidth")} 
                    onChange={set("foundationWidth")} 
                    unit="mm" 
                    hint="typically wall width + 200mm"
                    small 
                    locked={isLocked("foundationWidth")} 
                    lockedReason={lockReason("foundationWidth")} 
                  />
                </PanelSection>

                <PanelSection title="Drainage Layer" accent="var(--gravel-col)">
                  <Field 
                    label="Gravel Depth" 
                    value={fval("gravelDepth")} 
                    onChange={set("gravelDepth")} 
                    unit="mm" 
                    hint="drainage behind wall"
                    small 
                    locked={isLocked("gravelDepth")} 
                    lockedReason={lockReason("gravelDepth")} 
                  />
                  <Field 
                    label="Gravel Width" 
                    value={fval("gravelWidth")} 
                    onChange={set("gravelWidth")} 
                    unit="mm" 
                    hint="width of drainage layer"
                    small 
                    locked={isLocked("gravelWidth")} 
                    lockedReason={lockReason("gravelWidth")} 
                  />
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(106,122,138,0.1)", border: "1px solid rgba(106,122,138,0.25)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>FOUNDATION SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Concrete Vol", v: `${result.foundation.volume} m³` },
                        { l: "Cement Bags", v: result.foundation.cementBags },
                        { l: "Drainage Vol", v: `${result.drainage.volume} m³` },
                        { l: "Gravel", v: `${Math.ceil(result.drainage.gravelKg / 25)} bags` },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--concrete-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MATERIALS TAB */}
            {tab === "materials" && (
              <>
                <PanelSection title="Mortar Mix" accent="var(--mortar-col)">
                  {!isDIY ? (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "var(--mono)", marginBottom: 6 }}>CEMENT : SAND RATIO</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["1:3", "1:4", "1:5", "1:6"].map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => set("mortarRatio")(ratio)}
                            style={{
                              flex: 1,
                              padding: "8px 0",
                              background: d.mortarRatio === ratio ? "var(--mortar-col)" : "var(--bg)",
                              border: `1px solid ${d.mortarRatio === ratio ? "var(--mortar-col)" : "var(--border)"}`,
                              borderRadius: 4,
                              color: d.mortarRatio === ratio ? "var(--bg)" : "var(--text-dim)",
                              fontFamily: "var(--mono)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: d.mortarRatio === ratio ? 600 : 400,
                            }}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", marginTop: 6, fontFamily: "var(--mono)" }}>
                        1:3 strongest (load-bearing) → 1:6 general purpose
                      </div>
                    </div>
                  ) : (
                    <Field 
                      label="Mortar Ratio" 
                      value={fval("mortarRatio")} 
                      onChange={() => {}} 
                      small 
                      locked={true} 
                      lockedReason={lockReason("mortarRatio")} 
                    />
                  )}
                </PanelSection>

                <PanelSection title="Waste Allowance" accent="var(--straw)">
                  <Field 
                    label="Waste Factor" 
                    value={d.waste} 
                    onChange={set("waste")} 
                    unit="%" 
                    hint="typically 10% for blocks"
                    small 
                  />
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(184,160,128,0.1)", border: "1px solid rgba(184,160,128,0.25)", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>MORTAR SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Mortar Vol", v: `${result.mortar.volume} m³` },
                        { l: "Cement", v: `${result.mortar.cementBags} bags` },
                        { l: "Sand", v: `${result.mortar.sandKg} kg` },
                        { l: "Mix Ratio", v: result.mortar.ratio },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--mortar-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* EXTRAS TAB (Pro mode only) */}
            {tab === "extras" && !isDIY && (
              <>
                <PanelSection title="Coping Stones" accent="var(--stone-lt)">
                  <Toggle 
                    label="Add coping stones" 
                    checked={extras.addCoping} 
                    onChange={v => setExtras(e => ({ ...e, addCoping: v }))} 
                    accent="var(--stone-lt)"
                    sub="Weather cap on top of wall"
                  />
                  {extras.addCoping && (
                    <Field 
                      label="Coping Overhang" 
                      value={d.copingOverhang} 
                      onChange={set("copingOverhang")} 
                      unit="mm" 
                      hint="each side (typically 25-50mm)"
                      small
                    />
                  )}
                </PanelSection>

                {extras.addCoping && result && (
                  <div style={{ background: "rgba(168,184,192,0.1)", border: "1px solid rgba(168,184,192,0.25)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>COPING SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Coping Stones", v: `${result.coping.stones} pcs` },
                        { l: "Coping Width", v: fmm(result.coping.width) },
                        { l: "Overhang", v: fmm(result.coping.overhang) },
                        { l: "Total Length", v: fmm(result.coping.length) },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--stone-lt)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <PanelSection title="More Options" accent="var(--text-mute)">
                  <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-mute)", lineHeight: 1.6 }}>
                    Future extras: weep holes, geotextile membrane, drainage pipe calculations.
                  </p>
                </PanelSection>
              </>
            )}
          </div>

          {/* Status bar */}
          <div style={{ padding: "8px 14px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: result ? "var(--moss-lt)" : "var(--text-mute)", letterSpacing: "0.1em" }}>
              {result ? `● ${result.wallArea}m² CALCULATED` : "○ AWAITING INPUT"}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>
              {userMode.toUpperCase()} · {WALL_TYPES.find(t => t.id === wallType)?.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RIGHT — VIEWS + MATERIALS LIST */}
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
              {view === "SECTION" && (
                <WallSection calc={result} wallType={wallType} />
              )}
              {view === "ELEVATION" && (
                <WallElevation calc={result} wallType={wallType} />
              )}
              {view === "BOTH" && (
                <div style={{ display: "flex", width: "100%", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border)" }}>
                    <WallSection calc={result} wallType={wallType} />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <WallElevation calc={result} wallType={wallType} />
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ position: "absolute", top: 14, right: 14, fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-mute)", letterSpacing: "0.14em", background: "rgba(14,16,18,0.7)", padding: "4px 10px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              {view === "SECTION" ? "CROSS SECTION" : view === "ELEVATION" ? "ELEVATION VIEW" : "SECTION + ELEVATION"}
            </div>
            
            <div style={{ position: "absolute", top: 14, left: 14, fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.1em", background: "rgba(14,16,18,0.75)", padding: "4px 10px", borderRadius: 4, display: "flex", gap: 8, alignItems: "center", backdropFilter: "blur(4px)" }}>
              <span style={{ color: isDIY ? "var(--diy-col)" : "var(--pro-col)", fontWeight: 700 }}>{isDIY ? "DIY" : "PRO"}</span>
              <span style={{ color: "var(--border2)" }}>·</span>
              <span style={{ color: "var(--stone-lt)", fontWeight: 700 }}>{WALL_TYPES.find(t => t.id === wallType)?.label.toUpperCase()}</span>
            </div>
            
            {result && (
              <div style={{ position: "absolute", bottom: 14, right: 14, fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-mute)", letterSpacing: "0.1em", background: "rgba(14,16,18,0.7)", padding: "4px 10px", borderRadius: 4 }}>
                {fmm(result.wallLength)} × {fmm(result.wallHeight)} · {result.blocks.count} blocks
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
