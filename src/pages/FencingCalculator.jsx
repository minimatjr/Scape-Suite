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
      --locked:#232C34; --locked-txt:#ffffff;
      --pro-col:#7A9EC8; --diy-col:#6AAA60;
      --full-col:#C87840; --budget-col:#8A7CC0;
      --post-col:#5A8A50; --rail-col:#4A78B0; --board-col:#C87840;
      --gravel-col:#8A7860; --concrete-col:#6A7A8A;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;
    }

    /*
      IMPORTANT:
      - Make the document roots measurable (prevents flex children mis-sizing)
      - Do NOT lock body scrolling globally (overflow:hidden) — it can cause bottom clipping
        with 100vh on mobile and with nested flex layouts.
      - Your app can still use internal scroll panels; this just prevents the browser viewport
        from clipping content.
    */
    html, body, #root { height: 100%; }
    body { font-family:var(--sans); background:var(--bg); color:var(--text); overflow:auto; -webkit-text-size-adjust: 100%; }

    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const FENCE_TYPES = [
  { id: "panel", label: "Panel Fence", icon: "▦", desc: "Pre-made panels between posts" },
  { id: "featheredge", label: "Featheredge", icon: "▤", desc: "Overlapping vertical boards" },
  { id: "hit-miss", label: "Hit & Miss", icon: "▥", desc: "Alternating boards both sides" },
];

const PANEL_SIZES = [
  { id: "1830x1800", label: "6ft × 6ft", width: 1830, height: 1800 },
  { id: "1830x1500", label: "6ft × 5ft", width: 1830, height: 1500 },
  { id: "1830x1200", label: "6ft × 4ft", width: 1830, height: 1200 },
  { id: "1830x900", label: "6ft × 3ft", width: 1830, height: 900 },
];

const POST_TYPES = [
  { id: "concrete", label: "Concrete", size: "100×100mm", width: 100 },
  { id: "timber-75", label: "Timber 75mm", size: "75×75mm", width: 75 },
  { id: "timber-100", label: "Timber 100mm", size: "100×100mm", width: 100 },
];

const VIEWS = ["ELEVATION", "PLAN", "BOTH"];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const mm = v => parseFloat(v) || 0;
const r2 = n => Math.round(n * 100) / 100;
const CEI = Math.ceil;
const FLR = Math.floor;
const fmm = v => (v >= 1000 ? `${r2(v / 1000).toFixed(2)}m` : `${Math.round(v)}mm`);

/* ─── DIY SPEC RESOLVER ──────────────────────────────────────────────────── */
function resolveDIYSpec(tier, fenceType, panelHeight) {
  // In DIY mode, post depth = 33% of panel height, rounded to nearest 50mm
  const height = mm(panelHeight) || 1800;
  const autoPostDepth = Math.round((height * 0.33) / 50) * 50;

  // Concrete: 1 bag per 300mm in ground, rounded up to nearest 0.33
  const rawConcrete = autoPostDepth / 300;
  const concretePerPost = Math.ceil(rawConcrete * 3) / 3; // Round up to nearest .33

  if (tier === "budget") {
    return {
      postType: "timber-75",
      railDepth: "75",
      railThick: "38",
      railCount: "3", // Fixed at 3 for featheredge/hit-miss in DIY
      boardThick: fenceType === "featheredge" ? "22" : "19",
      boardOverlap: "25",
      postDepth: String(autoPostDepth),
      concretePerPost: String(concretePerPost),
    };
  }
  return {
    postType: "timber-100",
    railDepth: "100",
    railThick: "47",
    railCount: "3", // Fixed at 3 for featheredge/hit-miss in DIY
    boardThick: fenceType === "featheredge" ? "22" : "22",
    boardOverlap: "30",
    postDepth: String(autoPostDepth),
    concretePerPost: String(concretePerPost),
  };
}

/* ─── CALCULATION ENGINE ─────────────────────────────────────────────────── */
function calcFence(s) {
  const sides = [
    { len: mm(s.side1), enabled: s.side1Enabled },
    { len: mm(s.side2), enabled: s.side2Enabled },
    { len: mm(s.side3), enabled: s.side3Enabled },
    { len: mm(s.side4), enabled: s.side4Enabled },
  ].filter(side => side.enabled && side.len > 0);

  if (sides.length === 0) return null;

  const totalLength = sides.reduce((sum, side) => sum + side.len, 0);
  const fenceHeight = mm(s.fenceHeight);
  const postSpacing = mm(s.postSpacing);
  const railCount = parseInt(s.railCount) || 3;
  const boardWidth = mm(s.boardWidth);
  const boardThick = mm(s.boardThick);
  const boardOverlap = mm(s.boardOverlap);
  const railDepth = mm(s.railDepth);
  const railThick = mm(s.railThick);
  const postDepth = mm(s.postDepth);
  const waste = 1 + mm(s.waste) / 100;
  const isDIY = s.userMode === "diy";
  const postType = POST_TYPES.find(p => p.id === s.postType) || POST_TYPES[1];
  const panelSize = PANEL_SIZES.find(p => p.id === s.panelSize) || PANEL_SIZES[0];
  const postWidth = postType.width;

  // Calculate per-side details
  const sideDetails = sides.map((side, idx) => {
    const len = side.len;
    let posts, panels, boards, rails, actualSpacing;
    let fullPanels = 0;
    let cutPanelWidth = 0;
    let panelWidths = []; // Array of actual panel widths for this side

    if (s.fenceType === "panel") {
      // Panel fence: fixed 1830mm panels, posts have width, last panel cut to fit
      const standardPanelWidth = panelSize.width; // 1830mm
      const bayWidth = standardPanelWidth + postWidth; // one panel + one post
      const numFullBays = Math.floor(len / bayWidth);
      const remainder = len - numFullBays * bayWidth;

      if (remainder > postWidth + 100) {
        fullPanels = numFullBays;
        cutPanelWidth = remainder - postWidth;
        panels = fullPanels + 1;
        posts = panels + 1;
      } else if (numFullBays > 0) {
        fullPanels = numFullBays - 1;
        cutPanelWidth = len - (fullPanels + 2) * postWidth - fullPanels * standardPanelWidth;
        if (cutPanelWidth < 100) {
          fullPanels = numFullBays;
          cutPanelWidth = 0;
          panels = fullPanels;
        } else {
          panels = fullPanels + 1;
        }
        posts = panels + 1;
      } else {
        fullPanels = 0;
        cutPanelWidth = len - 2 * postWidth;
        if (cutPanelWidth < 100) cutPanelWidth = len - postWidth;
        panels = 1;
        posts = 2;
      }

      for (let i = 0; i < fullPanels; i++) panelWidths.push(standardPanelWidth);
      if (cutPanelWidth > 0) panelWidths.push(Math.round(cutPanelWidth));

      actualSpacing = standardPanelWidth + postWidth;
      boards = 0;
      rails = 0;
    } else {
      // Featheredge or Hit & Miss: posts at regular intervals
      posts = CEI(len / postSpacing) + 1;
      actualSpacing = len / (posts - 1);
      panels = 0;
      fullPanels = 0;
      cutPanelWidth = 0;

      const effectiveBoardWidth = s.fenceType === "featheredge" ? boardWidth - boardOverlap : boardWidth;

      if (s.fenceType === "hit-miss") {
        const boardsPerMetre = 1000 / (boardWidth * 2 - 20);
        boards = CEI((len / 1000) * boardsPerMetre * 2);
      } else {
        boards = CEI(len / effectiveBoardWidth);
      }

      rails = (posts - 1) * railCount;
    }

    return {
      sideNum: idx + 1,
      length: len,
      posts,
      panels,
      fullPanels,
      cutPanelWidth: Math.round(cutPanelWidth),
      panelWidths,
      boards,
      rails,
      actualSpacing,
    };
  });

  // Aggregate totals
  const totalPosts = sideDetails.reduce((sum, s) => sum + s.posts, 0);
  const sharedCorners = Math.max(0, sides.length - 1);
  const netPosts = totalPosts - sharedCorners;

  const totalFullPanels = sideDetails.reduce((sum, s) => sum + s.fullPanels, 0);
  const totalCutPanels = sideDetails.filter(s => s.cutPanelWidth > 0).length;
  const totalPanels = totalFullPanels + totalCutPanels;
  const totalBoards = CEI(sideDetails.reduce((sum, s) => sum + s.boards, 0) * waste);
  const totalRails = sideDetails.reduce((sum, s) => sum + s.rails, 0);

  const postCaps = netPosts;

  const concretePerPost = mm(s.concretePerPost) || 2;
  const concreteBags = netPosts * concretePerPost;

  const gravelKg = netPosts * 10;

  const nailsPerBoard = s.fenceType === "panel" ? 0 : 6;
  const screwsPerRail = 4;
  const totalNails = totalBoards * nailsPerBoard;
  const totalScrews = totalRails * screwsPerRail;
  const nailBoxes = CEI(totalNails / 500);
  const screwBoxes = CEI(totalScrews / 200);

  const panelClips = s.fenceType === "panel" ? totalPanels * 4 : 0;

  const postHeight = fenceHeight + postDepth;

  return {
    totalLength: r2(totalLength / 1000),
    fenceHeight,
    fenceType: s.fenceType,
    sides: sideDetails,
    posts: {
      count: netPosts,
      type: postType,
      height: postHeight,
      depthInGround: postDepth,
      aboveGround: fenceHeight,
      width: postWidth,
    },
    panels: {
      count: totalPanels,
      fullPanels: totalFullPanels,
      cutPanels: totalCutPanels,
      size: panelSize,
    },
    boards: {
      count: totalBoards,
      width: boardWidth,
      thick: boardThick,
      height: fenceHeight,
    },
    rails: {
      count: totalRails,
      depth: railDepth,
      thick: railThick,
      railsPerBay: railCount,
    },
    hardware: {
      postCaps,
      concreteBags,
      gravelKg,
      nailBoxes,
      screwBoxes,
      totalNails,
      totalScrews,
      panelClips,
    },
    spec: {
      postSpacing: postSpacing,
      boardWidth,
      boardThick,
      boardOverlap,
      railDepth,
      railThick,
      postWidth: postType.width,
    },
    userMode: s.userMode,
  };
}

/* ─── SVG ELEVATION VIEW ─────────────────────────────────────────────────── */
function FenceElevation({ calc, fenceType }) {
  if (!calc)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="16" width="8" height="40" rx="2" stroke="#2A3038" strokeWidth="2" />
          <rect x="28" y="16" width="8" height="40" rx="2" stroke="#2A3038" strokeWidth="2" />
          <rect x="48" y="16" width="8" height="40" rx="2" stroke="#2A3038" strokeWidth="2" />
          <line x1="8" y1="24" x2="56" y2="24" stroke="#3A4450" strokeWidth="1.5" />
          <line x1="8" y1="48" x2="56" y2="48" stroke="#3A4450" strokeWidth="1.5" />
        </svg>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>ENTER DIMENSIONS TO GENERATE ELEVATION</span>
      </div>
    );

  const { posts, panels, boards, rails, spec, fenceHeight, sides } = calc;
  const isPanelFence = fenceType === "panel";

  const previewSide = sides[0];
  const previewLength = previewSide.length;
  const numPosts = previewSide.posts;
  const panelWidths = previewSide.panelWidths || [];
  const postDepthInGround = posts.depthInGround;
  const postAboveGround = posts.aboveGround;
  const postTotalHeight = posts.height;
  const postWidth = posts.width;

  const PAD_L = 90,
    PAD_R = 70,
    PAD_T = 60,
    PAD_B = 100;
  const SVG_W = 900,
    SVG_H = 480;
  const drawW = SVG_W - PAD_L - PAD_R;
  const drawH = SVG_H - PAD_T - PAD_B;

  const totalVertical = postTotalHeight;
  const scaleX = drawW / previewLength;
  const scaleY = drawH / totalVertical;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  const fenceW = previewLength * scale;
  const fenceH = fenceHeight * scale;
  const groundDepthScaled = postDepthInGround * scale;

  const ox = PAD_L + (drawW - fenceW) / 2;
  const oy = PAD_T + 20;

  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;

  // Ground
  els.push(<rect key={k()} x={ox - 30} y={oy + fenceH} width={fenceW + 60} height={groundDepthScaled + 30} fill="#1A1810" />);
  els.push(<line key={k()} x1={ox - 30} y1={oy + fenceH} x2={ox + fenceW + 30} y2={oy + fenceH} stroke="#4A4030" strokeWidth="2" />);

  for (let i = 0; i < 15; i++) {
    const gx = ox - 20 + Math.random() * (fenceW + 40);
    const gy = oy + fenceH + 10 + Math.random() * groundDepthScaled;
    els.push(<circle key={k()} cx={gx} cy={gy} r={1 + Math.random() * 2} fill="#2A2820" opacity="0.6" />);
  }

  const postWScaled = postWidth * scale;

  // Post positions
  let postPositions = [];
  if (isPanelFence && panelWidths.length > 0) {
    let currentX = ox;
    postPositions.push(currentX);
    for (let i = 0; i < panelWidths.length; i++) {
      currentX += postWScaled + panelWidths[i] * scale;
      postPositions.push(currentX);
    }
  } else {
    const postSpacingScaled = previewSide.actualSpacing * scale;
    for (let i = 0; i < numPosts; i++) postPositions.push(ox + i * postSpacingScaled);
  }

  // Posts
  for (let i = 0; i < numPosts; i++) {
    const postCenterX = postPositions[i];
    const px = postCenterX - postWScaled / 2;
    const py = oy;

    els.push(<rect key={k()} x={px - 8} y={oy + fenceH} width={postWScaled + 16} height={groundDepthScaled} fill="#3A4048" rx="2" />);
    for (let j = 0; j < 3; j++) {
      els.push(<circle key={k()} cx={px + postWScaled / 2 + (Math.random() - 0.5) * postWScaled} cy={oy + fenceH + groundDepthScaled * (0.3 + Math.random() * 0.5)} r={2} fill="#4A5058" />);
    }

    els.push(<rect key={k()} x={px} y={py} width={postWScaled} height={fenceH + groundDepthScaled} fill="#5A4030" stroke="#7A5A40" strokeWidth="1" rx="2" />);
    els.push(<rect key={k()} x={px - 3} y={py - 6} width={postWScaled + 6} height={8} fill="#6A5040" stroke="#8A6A50" strokeWidth="1" rx="2" />);
  }

  // Infill
  if (isPanelFence && panelWidths.length > 0) {
    let panelStartX = ox + postWScaled / 2;

    for (let i = 0; i < panelWidths.length; i++) {
      const panelW = panelWidths[i] * scale;
      const panelX = panelStartX + 5;
      const panelDrawW = panelW - 10;
      const panelY = oy + 15;
      const panelH = fenceH - 30;

      const isLastPanel = i === panelWidths.length - 1;
      const isCutPanel = isLastPanel && previewSide.cutPanelWidth > 0;

      els.push(<rect key={k()} x={panelX} y={panelY} width={panelDrawW} height={panelH} fill={isCutPanel ? "#3A3020" : "#4A3828"} stroke="#5A4838" strokeWidth="1" rx="3" />);

      const slatCount = 12;
      for (let s = 0; s < slatCount; s++) {
        const sy = panelY + (s + 0.5) * (panelH / slatCount);
        els.push(<line key={k()} x1={panelX + 5} y1={sy} x2={panelX + panelDrawW - 5} y2={sy} stroke="#3A2818" strokeWidth="1" opacity="0.6" />);
      }

      els.push(<rect key={k()} x={panelX} y={panelY} width={panelDrawW} height={panelH} fill="none" stroke={isCutPanel ? "#8A6A40" : "#6A5040"} strokeWidth="2" rx="3" />);

      if (isCutPanel) {
        els.push(
          <text key={k()} x={panelX + panelDrawW / 2} y={panelY + panelH / 2} textAnchor="middle" fill="#B89848" fontFamily="IBM Plex Mono" fontSize="9" fontWeight="600">
            CUT
          </text>
        );
        els.push(
          <text key={k()} x={panelX + panelDrawW / 2} y={panelY + panelH / 2 + 12} textAnchor="middle" fill="#B89848" fontFamily="IBM Plex Mono" fontSize="8">
            {fmm(previewSide.cutPanelWidth)}
          </text>
        );
      }

      panelStartX += panelW + postWScaled;
    }
  } else if (fenceType === "featheredge") {
    const railPositions = [0.15, 0.5, 0.85];
    railPositions.forEach(rp => {
      const ry = oy + fenceH * rp;
      const railH = spec.railDepth * scale;
      els.push(<rect key={k()} x={ox} y={ry - railH / 2} width={fenceW} height={railH} fill="#4A5868" stroke="#5A6878" strokeWidth="1" />);
    });

    const boardW = spec.boardWidth * scale;
    const overlap = spec.boardOverlap * scale;
    const effectiveW = boardW - overlap;
    const numBoards = Math.ceil(fenceW / effectiveW);

    for (let b = 0; b < numBoards; b++) {
      const bx = ox + b * effectiveW;
      const thickness = b % 2 === 0 ? 0.9 : 1;
      els.push(<rect key={k()} x={bx} y={oy + 10} width={boardW} height={fenceH - 20} fill={`rgba(140,90,50,${thickness})`} stroke="#6A4A30" strokeWidth="0.5" />);
    }
  } else if (fenceType === "hit-miss") {
    const railPositions = [0.15, 0.5, 0.85];
    railPositions.forEach(rp => {
      const ry = oy + fenceH * rp;
      const railH = spec.railDepth * scale;
      els.push(<rect key={k()} x={ox} y={ry - railH / 2} width={fenceW} height={railH} fill="#4A5868" stroke="#5A6878" strokeWidth="1" />);
    });

    const boardW = spec.boardWidth * scale;
    const gap = boardW * 0.8;
    const pitch = boardW + gap;
    const numBoards = Math.ceil(fenceW / pitch) * 2;

    for (let b = 0; b < numBoards / 2; b++) {
      const bx = ox + b * pitch;
      els.push(<rect key={k()} x={bx} y={oy + 10} width={boardW} height={fenceH - 20} fill="#8C5A32" stroke="#6A4A30" strokeWidth="0.5" />);
    }

    for (let b = 0; b < numBoards / 2; b++) {
      const bx = ox + boardW / 2 + gap / 2 + b * pitch;
      els.push(<rect key={k()} x={bx} y={oy + 10} width={boardW} height={fenceH - 20} fill="#6A4828" stroke="#5A3820" strokeWidth="0.5" />);
    }
  }

  // DIMENSIONS
  const AC = "#C87840",
    AP = "#5A8A50",
    AR = "#4A78B0",
    AY = "#B89848",
    AM = "#9A7ACC";
  const tick = 5;

  const topDimY = oy - 20;
  const fenceStartX = ox - postWScaled / 2;
  const fenceEndX = postPositions[postPositions.length - 1] + postWScaled / 2;
  els.push(<line key={k()} x1={fenceStartX} y1={topDimY} x2={fenceEndX} y2={topDimY} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={fenceStartX} y1={topDimY - tick} x2={fenceStartX} y2={topDimY + tick} stroke={AC} strokeWidth="1.5" />);
  els.push(<line key={k()} x1={fenceEndX} y1={topDimY - tick} x2={fenceEndX} y2={topDimY + tick} stroke={AC} strokeWidth="1.5" />);
  els.push(
    <text key={k()} x={(fenceStartX + fenceEndX) / 2} y={topDimY - 8} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="12" fontWeight="600">
      {fmm(previewLength)} TOTAL (END TO END)
    </text>
  );

  if (numPosts > 1 && postPositions.length >= 2) {
    const botDimY = oy + fenceH + groundDepthScaled + 25;
    const p1 = postPositions[0];
    const p2 = postPositions[1];

    els.push(<line key={k()} x1={p1} y1={botDimY} x2={p2} y2={botDimY} stroke={AP} strokeWidth="1" />);
    els.push(<line key={k()} x1={p1} y1={botDimY - tick} x2={p1} y2={botDimY + tick} stroke={AP} strokeWidth="1" />);
    els.push(<line key={k()} x1={p2} y1={botDimY - tick} x2={p2} y2={botDimY + tick} stroke={AP} strokeWidth="1" />);
    els.push(<circle key={k()} cx={p1} cy={botDimY} r="3" fill={AP} />);
    els.push(<circle key={k()} cx={p2} cy={botDimY} r="3" fill={AP} />);

    if (isPanelFence && panelWidths.length > 0) {
      const firstPanelW = panelWidths[0];
      els.push(
        <text key={k()} x={(p1 + p2) / 2} y={botDimY + 14} textAnchor="middle" fill={AP} fontFamily="IBM Plex Mono" fontSize="9" fontWeight="500">
          {fmm(firstPanelW)} panel + {postWidth}mm post
        </text>
      );
    } else {
      els.push(
        <text key={k()} x={(p1 + p2) / 2} y={botDimY + 14} textAnchor="middle" fill={AP} fontFamily="IBM Plex Mono" fontSize="9" fontWeight="500">
          {fmm(previewSide.actualSpacing)} POST c/c
        </text>
      );
    }
  }

  const postTopY = oy - 6;
  const postBotY = oy + fenceH + groundDepthScaled;

  const leftX1 = fenceStartX - 50;
  els.push(<line key={k()} x1={leftX1} y1={postTopY} x2={leftX1} y2={postBotY} stroke={AM} strokeWidth="1" />);
  els.push(<line key={k()} x1={leftX1 - tick} y1={postTopY} x2={leftX1 + tick} y2={postTopY} stroke={AM} strokeWidth="1" />);
  els.push(<line key={k()} x1={leftX1 - tick} y1={postBotY} x2={leftX1 + tick} y2={postBotY} stroke={AM} strokeWidth="1" />);
  els.push(
    <text
      key={k()}
      x={leftX1 - 8}
      y={(postTopY + postBotY) / 2}
      textAnchor="middle"
      fill={AM}
      fontFamily="IBM Plex Mono"
      fontSize="9"
      fontWeight="500"
      transform={`rotate(-90,${leftX1 - 8},${(postTopY + postBotY) / 2})`}
    >
      POST {fmm(postTotalHeight)}
    </text>
  );

  const leftX2 = fenceStartX - 25;
  els.push(<line key={k()} x1={leftX2} y1={oy} x2={leftX2} y2={oy + fenceH} stroke={AC} strokeWidth="1" />);
  els.push(<line key={k()} x1={leftX2 - tick} y1={oy} x2={leftX2 + tick} y2={oy} stroke={AC} strokeWidth="1" />);
  els.push(<line key={k()} x1={leftX2 - tick} y1={oy + fenceH} x2={leftX2 + tick} y2={oy + fenceH} stroke={AC} strokeWidth="1" />);
  els.push(
    <text
      key={k()}
      x={leftX2 - 8}
      y={oy + fenceH / 2}
      textAnchor="middle"
      fill={AC}
      fontFamily="IBM Plex Mono"
      fontSize="10"
      fontWeight="500"
      transform={`rotate(-90,${leftX2 - 8},${oy + fenceH / 2})`}
    >
      {fmm(fenceHeight)}
    </text>
  );

  const rightX1 = fenceEndX + 20;
  els.push(<line key={k()} x1={rightX1} y1={oy + fenceH} x2={rightX1} y2={postBotY} stroke={AR} strokeWidth="1" />);
  els.push(<line key={k()} x1={rightX1 - tick} y1={oy + fenceH} x2={rightX1 + tick} y2={oy + fenceH} stroke={AR} strokeWidth="1" />);
  els.push(<line key={k()} x1={rightX1 - tick} y1={postBotY} x2={rightX1 + tick} y2={postBotY} stroke={AR} strokeWidth="1" />);
  els.push(
    <text
      key={k()}
      x={rightX1 + 8}
      y={oy + fenceH + groundDepthScaled / 2}
      textAnchor="middle"
      fill={AR}
      fontFamily="IBM Plex Mono"
      fontSize="8"
      fontWeight="500"
      transform={`rotate(90,${rightX1 + 8},${oy + fenceH + groundDepthScaled / 2})`}
    >
      {fmm(postDepthInGround)} IN GROUND
    </text>
  );

  if (isPanelFence && panelWidths.length > 0) {
    const firstPanelStartX = ox + postWScaled / 2 + 5;
    const firstPanelW = panelWidths[0] * scale - 10;
    const panelY = oy + 15;
    const panelH = fenceH - 30;

    const panelHDimX = firstPanelStartX + firstPanelW + 12;
    els.push(<line key={k()} x1={panelHDimX} y1={panelY} x2={panelHDimX} y2={panelY + panelH} stroke={AY} strokeWidth="1" strokeDasharray="3,2" />);
    els.push(<line key={k()} x1={panelHDimX - 3} y1={panelY} x2={panelHDimX + 3} y2={panelY} stroke={AY} strokeWidth="1" />);
    els.push(<line key={k()} x1={panelHDimX - 3} y1={panelY + panelH} x2={panelHDimX + 3} y2={panelY + panelH} stroke={AY} strokeWidth="1" />);
    els.push(
      <text key={k()} x={panelHDimX + 6} y={panelY + panelH / 2} textAnchor="middle" fill={AY} fontFamily="IBM Plex Mono" fontSize="8" transform={`rotate(90,${panelHDimX + 6},${panelY + panelH / 2})`}>
        {fmm(panels.size.height)} PANEL
      </text>
    );
  }

  const postWidthDimY = oy + fenceH - 20;
  const firstPostX = ox - postWScaled / 2;
  els.push(<line key={k()} x1={firstPostX} y1={postWidthDimY} x2={firstPostX + postWScaled} y2={postWidthDimY} stroke="#8A8A8A" strokeWidth="0.75" />);
  els.push(<line key={k()} x1={firstPostX} y1={postWidthDimY - 3} x2={firstPostX} y2={postWidthDimY + 3} stroke="#8A8A8A" strokeWidth="0.75" />);
  els.push(<line key={k()} x1={firstPostX + postWScaled} y1={postWidthDimY - 3} x2={firstPostX + postWScaled} y2={postWidthDimY + 3} stroke="#8A8A8A" strokeWidth="0.75" />);
  els.push(<text key={k()} x={firstPostX + postWScaled / 2} y={postWidthDimY - 5} textAnchor="middle" fill="#8A8A8A" fontFamily="IBM Plex Mono" fontSize="7">{postWidth}mm</text>);

  els.push(<text key={k()} x={fenceEndX + 45} y={oy + fenceH + 4} fontFamily="IBM Plex Mono" fontSize="7" fill="#6A6050" letterSpacing="0.08em">GROUND</text>);
  els.push(<text key={k()} x={fenceEndX + 45} y={oy + fenceH + 13} fontFamily="IBM Plex Mono" fontSize="7" fill="#6A6050" letterSpacing="0.08em">LEVEL</text>);

  const legX = ox - 20;
  const legY = oy + fenceH + groundDepthScaled + 50;
  els.push(
    <g key={k()} transform={`translate(${legX}, ${legY})`}>
      <rect x="-10" y="-12" width="320" height="28" fill="rgba(14,16,18,0.8)" rx="4" />
      <circle cx="0" cy="0" r="4" fill={AC} />
      <text x="8" y="3" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">Fence</text>
      <circle cx="55" cy="0" r="4" fill={AP} />
      <text x="63" y="3" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">Posts</text>
      <circle cx="105" cy="0" r="4" fill={AM} />
      <text x="113" y="3" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">Post length</text>
      <circle cx="175" cy="0" r="4" fill={AR} />
      <text x="183" y="3" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">Ground</text>
      <circle cx="230" cy="0" r="4" fill={AY} />
      <text x="238" y="3" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-dim)">Panel</text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "100%" }}>
      <defs>
        <pattern id="groundHatch" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0,8 L8,0" stroke="#2A2820" strokeWidth="0.5" />
        </pattern>
      </defs>
      {els}
    </svg>
  );
}

/* ─── SVG PLAN VIEW ─────────────────────────────────────────────────────── */
function FencePlan({ calc, sides }) {
  if (!calc)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M8 56 L8 8 L56 8" stroke="#2A3038" strokeWidth="2" fill="none" />
          <circle cx="8" cy="8" r="4" fill="#3A4450" />
          <circle cx="8" cy="56" r="4" fill="#3A4450" />
          <circle cx="56" cy="8" r="4" fill="#3A4450" />
        </svg>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--text-mute)", letterSpacing: "0.1em" }}>ENABLE SIDES TO GENERATE PLAN</span>
      </div>
     );

  const { spec, posts } = calc;
  const enabledSides = calc.sides;

  const PAD = 100;
  const SVG_W = 600,
    SVG_H = 550;
  const drawSize = Math.min(SVG_W, SVG_H) - PAD * 2;

  const maxLen = Math.max(...enabledSides.map(s => s.length));
  const scale = (drawSize / maxLen) * 0.7;

  const cx = SVG_W / 2;
  const cy = SVG_H / 2 - 20;

  const els = [];
  let ki = 0;
  const k = () => `e${ki++}`;

  const postR = Math.max((spec.postWidth * scale) / 2, 5);
  const AC = "#C87840",
    AP = "#5A8A50",
    AY = "#B89848";
  const tick = 4;

  const corners = [];

  if (enabledSides.length === 1) {
    const len = enabledSides[0].length * scale;
    corners.push({ x: cx - len / 2, y: cy });
    corners.push({ x: cx + len / 2, y: cy });
  } else if (enabledSides.length === 2) {
    const len1 = enabledSides[0].length * scale;
    const len2 = enabledSides[1].length * scale;
    corners.push({ x: cx - len1 / 2, y: cy - len2 / 2 });
    corners.push({ x: cx + len1 / 2, y: cy - len2 / 2 });
    corners.push({ x: cx + len1 / 2, y: cy + len2 / 2 });
  } else if (enabledSides.length === 3) {
    const len1 = enabledSides[0].length * scale;
    const len2 = enabledSides[1].length * scale;
    const len3 = enabledSides[2].length * scale;
    corners.push({ x: cx - len1 / 2, y: cy - len2 / 2 });
    corners.push({ x: cx + len1 / 2, y: cy - len2 / 2 });
    corners.push({ x: cx + len1 / 2, y: cy + len2 / 2 });
    corners.push({ x: cx - len1 / 2 + len3, y: cy + len2 / 2 });
  } else if (enabledSides.length === 4) {
    const len1 = enabledSides[0].length * scale;
    const len2 = enabledSides[1].length * scale;
    corners.push({ x: cx - len1 / 2, y: cy - len2 / 2 });
    corners.push({ x: cx + len1 / 2, y: cy - len2 / 2 });
    corners.push({ x: cx + len1 / 2, y: cy + len2 / 2 });
    corners.push({ x: cx - len1 / 2, y: cy + len2 / 2 });
  }

  const allPostPositions = [];
  const sidePostPositions = [];

  for (let i = 0; i < enabledSides.length; i++) {
    const side = enabledSides[i];
    const c1 = corners[i];
    const c2 = corners[(i + 1) % corners.length] || corners[Math.min(i + 1, corners.length - 1)];
    if (!c1 || !c2) continue;

    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const numPosts = side.posts;
    const postsOnSide = [];

    for (let p = 0; p < numPosts; p++) {
      const t = numPosts > 1 ? p / (numPosts - 1) : 0;
      const px = c1.x + dx * t;
      const py = c1.y + dy * t;
      postsOnSide.push({ x: px, y: py, sideNum: side.sideNum, postNum: p + 1 });

      const existing = allPostPositions.find(pos => Math.abs(pos.x - px) < 1 && Math.abs(pos.y - py) < 1);
      if (!existing) allPostPositions.push({ x: px, y: py, sideNum: side.sideNum, postNum: p + 1 });
    }

    sidePostPositions.push(postsOnSide);
  }

  for (let i = 0; i < enabledSides.length; i++) {
    const c1 = corners[i];
    const c2 = corners[(i + 1) % corners.length] || corners[Math.min(i + 1, corners.length - 1)];
    if (!c1 || !c2) continue;

    els.push(<line key={k()} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#8A6A48" strokeWidth="8" strokeLinecap="round" />);
    els.push(<line key={k()} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#A07A58" strokeWidth="4" strokeLinecap="round" />);
  }

  allPostPositions.forEach(pos => {
    els.push(<circle key={k()} cx={pos.x + 2} cy={pos.y + 2} r={postR + 2} fill="rgba(0,0,0,0.3)" />);
    els.push(<circle key={k()} cx={pos.x} cy={pos.y} r={postR} fill="#3A5030" stroke="#5A8050" strokeWidth="2" />);
    els.push(<circle key={k()} cx={pos.x} cy={pos.y} r={2} fill="#8AC070" />);
  });

  for (let i = 0; i < enabledSides.length; i++) {
    const side = enabledSides[i];
    const c1 = corners[i];
    const c2 = corners[(i + 1) % corners.length] || corners[Math.min(i + 1, corners.length - 1)];
    const postsOnSide = sidePostPositions[i];
    if (!c1 || !c2 || !postsOnSide) continue;

    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const angle = Math.atan2(dy, dx);

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    let dimOffset = 35;
    if (i === 0) dimOffset = -40;
    if (i === 1) dimOffset = 40;
    if (i === 2) dimOffset = 40;
    if (i === 3) dimOffset = -40;

    const offsetX = perpX * dimOffset;
    const offsetY = perpY * dimOffset;

    const dimLineX1 = c1.x + offsetX;
    const dimLineY1 = c1.y + offsetY;
    const dimLineX2 = c2.x + offsetX;
    const dimLineY2 = c2.y + offsetY;

    els.push(<line key={k()} x1={dimLineX1} y1={dimLineY1} x2={dimLineX2} y2={dimLineY2} stroke={AC} strokeWidth="1.5" />);

    const tickX = perpX * tick;
    const tickY = perpY * tick;
    els.push(<line key={k()} x1={dimLineX1 - tickX} y1={dimLineY1 - tickY} x2={dimLineX1 + tickX} y2={dimLineY1 + tickY} stroke={AC} strokeWidth="1.5" />);
    els.push(<line key={k()} x1={dimLineX2 - tickX} y1={dimLineY2 - tickY} x2={dimLineX2 + tickX} y2={dimLineY2 + tickY} stroke={AC} strokeWidth="1.5" />);

    els.push(<line key={k()} x1={c1.x} y1={c1.y} x2={dimLineX1} y2={dimLineY1} stroke={AC} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />);
    els.push(<line key={k()} x1={c2.x} y1={c2.y} x2={dimLineX2} y2={dimLineY2} stroke={AC} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />);

    const midX = (dimLineX1 + dimLineX2) / 2;
    const midY = (dimLineY1 + dimLineY2) / 2;
    const textOffset = dimOffset > 0 ? 14 : -8;
    const textX = midX + perpX * textOffset;
    const textY = midY + perpY * textOffset;

    let textAngle = angle * (180 / Math.PI);
    if (textAngle > 90) textAngle -= 180;
    if (textAngle < -90) textAngle += 180;

    els.push(
      <text
        key={k()}
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={AC}
        fontFamily="IBM Plex Mono"
        fontSize="11"
        fontWeight="600"
        transform={`rotate(${textAngle},${textX},${textY})`}
      >
        SIDE {side.sideNum}: {fmm(side.length)}
      </text>
    );

    if (postsOnSide.length >= 2) {
      const spacingOffset = dimOffset > 0 ? dimOffset + 25 : dimOffset - 25;
      const spacingOffsetX = perpX * spacingOffset;
      const spacingOffsetY = perpY * spacingOffset;

      const p1 = postsOnSide[0];
      const p2 = postsOnSide[1];

      const sp1X = p1.x + spacingOffsetX;
      const sp1Y = p1.y + spacingOffsetY;
      const sp2X = p2.x + spacingOffsetX;
      const sp2Y = p2.y + spacingOffsetY;

      els.push(<line key={k()} x1={sp1X} y1={sp1Y} x2={sp2X} y2={sp2Y} stroke={AP} strokeWidth="1" />);
      els.push(<line key={k()} x1={sp1X - tickX * 0.7} y1={sp1Y - tickY * 0.7} x2={sp1X + tickX * 0.7} y2={sp1Y + tickY * 0.7} stroke={AP} strokeWidth="1" />);
      els.push(<line key={k()} x1={sp2X - tickX * 0.7} y1={sp2Y - tickY * 0.7} x2={sp2X + tickX * 0.7} y2={sp2Y + tickY * 0.7} stroke={AP} strokeWidth="1" />);
      els.push(<circle key={k()} cx={sp1X} cy={sp1Y} r="2" fill={AP} />);
      els.push(<circle key={k()} cx={sp2X} cy={sp2Y} r="2" fill={AP} />);
      els.push(<line key={k()} x1={p1.x} y1={p1.y} x2={sp1X} y2={sp1Y} stroke={AP} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />);
      els.push(<line key={k()} x1={p2.x} y1={p2.y} x2={sp2X} y2={sp2Y} stroke={AP} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />);

      const spMidX = (sp1X + sp2X) / 2;
      const spMidY = (sp1Y + sp2Y) / 2;
      const spTextOffset = spacingOffset > 0 ? 12 : -6;
      const spTextX = spMidX + perpX * spTextOffset;
      const spTextY = spMidY + perpY * spTextOffset;

      els.push(
        <text
          key={k()}
          x={spTextX}
          y={spTextY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={AP}
          fontFamily="IBM Plex Mono"
          fontSize="8"
          fontWeight="500"
          transform={`rotate(${textAngle},${spTextX},${spTextY})`}
        >
          {fmm(side.actualSpacing)} c/c
        </text>
      );
    }
  }

  allPostPositions.forEach((pos, idx) => {
    const labelOffset = 18;
    els.push(
      <text key={k()} x={pos.x} y={pos.y - labelOffset} textAnchor="middle" fill="#6A8A60" fontFamily="IBM Plex Mono" fontSize="7" fontWeight="500">
        P{idx + 1}
      </text>
    );
  });

  const legX = PAD - 30;
  const legY = SVG_H - PAD + 50;

  els.push(
    <g key={k()} transform={`translate(${legX}, ${legY})`}>
      <rect x="-10" y="-18" width={SVG_W - PAD * 2 + 60} height="48" fill="rgba(14,16,18,0.85)" rx="6" />
      <circle cx="10" cy="-4" r="6" fill="#3A5030" stroke="#5A8050" strokeWidth="1.5" />
      <text x="22" y="0" fontFamily="IBM Plex Mono" fontSize="8" fill="var(--text-dim)">Post</text>

      <rect x="70" y="-8" width="24" height="8" fill="#8A6A48" rx="2" />
      <text x="100" y="0" fontFamily="IBM Plex Mono" fontSize="8" fill="var(--text-dim)">Fence</text>

      <line x1="10" y1="18" x2="40" y2="18" stroke={AC} strokeWidth="1.5" />
      <text x="48" y="22" fontFamily="IBM Plex Mono" fontSize="7" fill={AC}>Side length (end to end)</text>

      <line x1="200" y1="18" x2="230" y2="18" stroke={AP} strokeWidth="1" />
      <circle cx="200" cy="18" r="2" fill={AP} />
      <circle cx="230" cy="18" r="2" fill={AP} />
      <text x="238" y="22" fontFamily="IBM Plex Mono" fontSize="7" fill={AP}>Post centres (c/c)</text>
    </g>
  );

  els.push(
    <g key={k()} transform={`translate(${SVG_W - PAD + 25}, ${PAD - 25})`}>
      <circle cx="0" cy="0" r="18" fill="rgba(14,16,18,0.7)" stroke="var(--border)" strokeWidth="1" />
      <line x1="0" y1="10" x2="0" y2="-6" stroke="var(--text-dim)" strokeWidth="1.5" />
      <polygon points="0,-12 -5,0 0,-4 5,0" fill="var(--text-dim)" />
      <text x="0" y="-18" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="8" fill="var(--text-dim)" fontWeight="600">N</text>
    </g>
  );

  els.push(
    <g key={k()} transform={`translate(${PAD - 30}, ${PAD - 30})`}>
      <rect x="0" y="0" width="120" height="50" fill="rgba(14,16,18,0.85)" rx="6" stroke="var(--border)" strokeWidth="1" />
      <text x="10" y="16" fontFamily="IBM Plex Mono" fontSize="7" fill="var(--text-mute)" letterSpacing="0.1em">TOTAL POSTS</text>
      <text x="10" y="32" fontFamily="IBM Plex Mono" fontSize="16" fill={AP} fontWeight="600">{calc.posts.count}</text>
      <text x="45" y="32" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--text-dim)">@ {spec.postWidth}mm sq</text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "100%" }}>
      {els}
    </svg>
  );
}

/* ─── CUTTING LIST ───────────────────────────────────────────────────────── */
function CuttingList({ calc }) {
  if (!calc) return null;

  const { totalLength, fenceType, posts, panels, boards, rails, hardware, spec, sides } = calc;
  const isPanelFence = fenceType === "panel";

  const sections = [
    {
      title: "POSTS",
      color: "#5A8A50",
      rows: [
        { item: `${posts.type.label} post ${posts.type.size}`, qty: posts.count, length: posts.height, note: `${fmm(posts.aboveGround)} above ground + ${fmm(posts.depthInGround)} in ground` },
        { item: "Post caps", qty: hardware.postCaps, length: "-", note: posts.type.size },
      ],
    },
    ...(isPanelFence
      ? [
          {
            title: "PANELS",
            color: "#C87840",
            rows: [
              ...(panels.fullPanels > 0
                ? [{ item: `Fence panel ${panels.size.label}`, qty: panels.fullPanels, length: panels.size.width, note: `${fmm(panels.size.height)} high — standard` }]
                : []),
              ...(panels.cutPanels > 0 ? [{ item: `Cut panel(s)`, qty: panels.cutPanels, length: "-", note: `cut to fit — see side breakdown` }] : []),
            ],
          },
        ]
      : []),
    ...(!isPanelFence
      ? [
          {
            title: "BOARDS",
            color: "#C87840",
            rows: [
              {
                item: `${fenceType === "featheredge" ? "Featheredge" : "Fence"} board ${spec.boardWidth}×${spec.boardThick}mm`,
                qty: boards.count,
                length: boards.height,
                note: fenceType === "hit-miss" ? "alternating both sides" : `${fmm(spec.boardOverlap)} overlap`,
              },
            ],
          },
        ]
      : []),
    ...(!isPanelFence
      ? [
          {
            title: "RAILS",
            color: "#4A78B0",
            rows: [{ item: `Arris rail ${spec.railDepth}×${spec.railThick}mm`, qty: rails.count, length: Math.round(spec.postSpacing), note: `${rails.railsPerBay} per bay` }],
          },
        ]
      : []),
  ];

  const hwRows = [
    ...(isPanelFence ? [{ item: "Panel clips", qty: hardware.panelClips, unit: "no." }] : []),
    ...(!isPanelFence ? [{ item: `Nails (≈${hardware.totalNails})`, qty: hardware.nailBoxes, unit: "boxes ×500" }] : []),
    { item: `Screws (≈${hardware.totalScrews})`, qty: hardware.screwBoxes || 1, unit: "boxes ×200" },
    { item: "Postcrete/concrete", qty: hardware.concreteBags, unit: "bags ×20kg" },
    { item: "Drainage gravel", qty: Math.ceil(hardware.gravelKg / 25), unit: "bags ×25kg" },
  ].filter(h => h.qty > 0);

  return (
    <div style={{ fontFamily: "var(--mono)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border)", marginBottom: 1 }}>
        {[
          { label: "TOTAL LENGTH", val: `${totalLength} m` },
          { label: "TOTAL POSTS", val: `${posts.count} no.` },
          { label: isPanelFence ? "PANELS" : "TOTAL BOARDS", val: isPanelFence ? `${panels.fullPanels}${panels.cutPanels > 0 ? ` + ${panels.cutPanels} cut` : ""} pcs` : `${boards.count} pcs` },
          { label: "FENCE TYPE", val: fenceType.toUpperCase() },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--panel)", padding: "14px 18px" }}>
            <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.14em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: "1.15rem", color: "var(--timber)", fontWeight: 600 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", marginBottom: 1 }}>
        <div style={{ padding: "8px 16px", fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--straw)", borderBottom: "2px solid var(--straw)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "block", width: 8, height: 8, borderRadius: 2, background: "var(--straw)" }} />
          SIDE-BY-SIDE BREAKDOWN
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${sides.length}, 1fr)`, gap: 0 }}>
          {sides.map((side, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRight: i < sides.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--cream)", fontWeight: 600, marginBottom: 8 }}>Side {side.sideNum}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 4 }}>
                Length: <span style={{ color: "var(--timber)" }}>{fmm(side.length)}</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 4 }}>
                Posts: <span style={{ color: "var(--post-col)" }}>{side.posts}</span>
              </div>
              {isPanelFence && (
                <>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 4 }}>
                    Full panels: <span style={{ color: "var(--board-col)" }}>{side.fullPanels}</span>
                  </div>
                  {side.cutPanelWidth > 0 && (
                    <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 4 }}>
                      Cut panel: <span style={{ color: "#B89848" }}>{fmm(side.cutPanelWidth)}</span>
                    </div>
                  )}
                </>
              )}
              {!isPanelFence && (
                <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: 4 }}>
                  Rails: <span style={{ color: "var(--rail-col)" }}>{side.rails}</span>
                </div>
              )}
              <div style={{ fontSize: "0.62rem", color: "var(--text-mute)", marginTop: 6 }}>{isPanelFence ? `${side.panels} bays` : `Post c/c: ${fmm(side.actualSpacing)}`}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
        {sections.map((sec, si) => (
          <div key={si} style={{ background: "var(--surface)" }}>
            <div style={{ padding: "8px 16px", fontSize: "0.6rem", letterSpacing: "0.14em", color: sec.color, borderBottom: `2px solid ${sec.color}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "block", width: 8, height: 8, borderRadius: 2, background: sec.color }} />
              {sec.title}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["COMPONENT", "QTY", "LENGTH", "NOTE"].map(h => (
                    <th key={h} style={{ padding: "6px 12px", fontSize: "0.58rem", color: "var(--text-mute)", letterSpacing: "0.1em", textAlign: h === "QTY" ? "center" : "left", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sec.rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "9px 12px", fontSize: "0.78rem", color: "var(--text)" }}>{row.item}</td>
                    <td style={{ padding: "9px 12px", fontSize: "0.9rem", color: sec.color, fontWeight: 600, textAlign: "center" }}>{row.qty}</td>
                    <td style={{ padding: "9px 12px", fontSize: "0.78rem", color: "var(--cream)" }}>{row.length !== "-" ? fmm(row.length) : "—"}</td>
                    <td style={{ padding: "9px 12px", fontSize: "0.7rem", color: "var(--text-dim)" }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", marginTop: 1 }}>
        <div style={{ padding: "8px 16px", fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--straw)", borderBottom: "2px solid var(--straw)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "block", width: 8, height: 8, borderRadius: 2, background: "var(--straw)" }} />
          FIXINGS & HARDWARE
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

      <div style={{ padding: "10px 16px", fontSize: "0.68rem", color: "var(--text-dim)", background: "var(--panel)", borderTop: "1px solid var(--border)", lineHeight: 1.7 }}>
        ⚠ All quantities include 10% waste allowance. Post depths assume standard soil conditions — increase to 750mm for exposed or soft ground. Check local regulations for boundary fence heights.
      </div>
    </div>
  );
}

/* ─── UI COMPONENTS ──────────────────────────────────────────────────────── */
function Field({ label, value, onChange, min, max, unit, hint, small, locked, lockedReason, disabled }) {
  const isLocked = locked === true;
  const isDisabled = disabled === true;
  const inactive = isLocked || isDisabled;

  return (
    <div style={{ marginBottom: small ? 8 : 12, opacity: inactive ? 0.52 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <label
          style={{
            fontSize: small ? "0.68rem" : "0.72rem",
            color: isLocked ? "var(--locked-txt)" : "var(--text-dim)",
            fontFamily: "var(--mono)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {label}
          {isLocked && <span style={{ fontSize: "0.55rem", color: "var(--locked-txt)" }}>— AUTO</span>}
        </label>
        {unit && <span style={{ fontSize: "0.62rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{unit}</span>}
      </div>
      <input
        type="number"
        value={value}
        onChange={e => !inactive && onChange(e.target.value)}
        readOnly={inactive}
        min={min}
        max={max}
        style={{
          width: "100%",
          background: inactive ? "var(--locked)" : "var(--bg)",
          border: `1px solid ${inactive ? "var(--border)" : "var(--border2)"}`,
          borderRadius: 4,
          padding: small ? "5px 8px" : "7px 10px",
          color: inactive ? "var(--locked-txt)" : "var(--white)",
          fontFamily: "var(--mono)",
          fontSize: small ? "0.85rem" : "0.9rem",
          outline: "none",
          cursor: inactive ? "not-allowed" : "text",
        }}
        onFocus={e => {
          if (!inactive) e.target.style.borderColor = "var(--timber)";
        }}
        onBlur={e => {
          e.target.style.borderColor = inactive ? "var(--border)" : "var(--border2)";
        }}
      />
      {hint && !inactive && <div style={{ fontSize: "0.62rem", color: "var(--text-mute)", marginTop: 3, fontFamily: "var(--mono)" }}>{hint}</div>}
      {isLocked && lockedReason && <div style={{ fontSize: "0.60rem", color: "var(--locked-txt)", marginTop: 3, fontFamily: "var(--mono)" }}>{lockedReason}</div>}
    </div>
  );
}

function PanelSection({ title, children, accent = "var(--timber)" }) {
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
        const col = accentMap?.[o.id] || "var(--timber)";
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
              boxShadow: active ? `inset 0 0 0 1px ${col}40` : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, checked, onChange, accent = "var(--timber)", sub }) {
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
          marginTop: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2.5,
            left: checked ? 18 : 2.5,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "white",
            transition: "left 0.18s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        />
      </div>
      <div>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.69rem", color: checked ? "var(--text)" : "var(--text-dim)", display: "block" }}>{label}</span>
        {sub && <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-mute)", display: "block", marginTop: 2, lineHeight: 1.4 }}>{sub}</span>}
      </div>
    </label>
  );
}

function SideInput({ sideNum, length, enabled, onLengthChange, onEnabledChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: enabled ? "rgba(200,120,64,0.08)" : "var(--bg)",
        borderRadius: 6,
        border: `1px solid ${enabled ? "rgba(200,120,64,0.25)" : "var(--border)"}`,
        marginBottom: 8,
        transition: "all 0.2s",
      }}
    >
      <Toggle label="" checked={enabled} onChange={onEnabledChange} accent="var(--timber)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.65rem", color: enabled ? "var(--timber)" : "var(--text-mute)", fontFamily: "var(--mono)", marginBottom: 3, letterSpacing: "0.1em" }}>
          SIDE {sideNum}
        </div>
        <input
          type="number"
          value={length}
          onChange={e => onLengthChange(e.target.value)}
          disabled={!enabled}
          placeholder="Length"
          style={{
            width: "100%",
            background: enabled ? "var(--panel)" : "var(--locked)",
            border: `1px solid ${enabled ? "var(--border2)" : "var(--border)"}`,
            borderRadius: 4,
            padding: "5px 8px",
            color: enabled ? "var(--white)" : "var(--locked-txt)",
            fontFamily: "var(--mono)",
            fontSize: "0.85rem",
            outline: "none",
            cursor: enabled ? "text" : "not-allowed",
          }}
        />
      </div>
      <span style={{ fontSize: "0.62rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>mm</span>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function FencingCalculator() {
  const [fenceType, setFenceType] = useState("panel");
  const [view, setView] = useState("ELEVATION");
  const [showList, setShowList] = useState(false);
  const [tab, setTab] = useState("sides");
  const [userMode, setUserMode] = useState("pro");
  const [specTier, setSpecTier] = useState("full");

  const [d, setD] = useState({
    side1: "6000",
    side1Enabled: true,
    side2: "4000",
    side2Enabled: false,
    side3: "",
    side3Enabled: false,
    side4: "",
    side4Enabled: false,
    fenceHeight: "1800",
    postSpacing: "2400",
    panelSize: "1830x1800",
    postType: "timber-100",
    railCount: "3",
    boardWidth: "150",
    boardThick: "22",
    boardOverlap: "30",
    railDepth: "100",
    railThick: "47",
    postDepth: "600",
    concretePerPost: "2",
    waste: "10",
    trellisHeight: "300",
  });

  const [extras, setExtras] = useState({
    addTrellis: false,
  });

  const set = k => v => setD(p => ({ ...p, [k]: v }));
  const isDIY = userMode === "diy";

  const currentPanelSize = PANEL_SIZES.find(p => p.id === d.panelSize) || PANEL_SIZES[0];
  const panelHeight = currentPanelSize.height;

  const diySpec = isDIY ? resolveDIYSpec(specTier, fenceType, panelHeight) : null;
  const effectiveFenceHeight = isDIY && fenceType === "panel" ? String(panelHeight) : d.fenceHeight;
  const effectiveD = isDIY ? { ...d, ...diySpec, fenceHeight: effectiveFenceHeight } : { ...d, extras };

  const result = useCallback(() => {
    try {
      return calcFence({ ...effectiveD, fenceType, userMode });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [effectiveD, fenceType, userMode])();

  const fval = k => {
    if (isDIY && diySpec && k in diySpec) return diySpec[k];
    return d[k];
  };

  const isLocked = k => {
    if (!isDIY) return false;
    const alwaysLocked = ["boardThick", "boardOverlap", "railDepth", "railThick", "postType", "postDepth", "concretePerPost"];
    if (k === "railCount" && fenceType !== "panel") return true;
    return alwaysLocked.includes(k);
  };

  const lockReason = k => {
    if (!isDIY) return "";
    if (k === "boardThick") return "Auto: 22mm";
    if (k === "boardOverlap") return specTier === "budget" ? "Auto: 25mm" : "Auto: 30mm";
    if (k === "railDepth") return specTier === "budget" ? "Auto: 75mm" : "Auto: 100mm";
    if (k === "railThick") return specTier === "budget" ? "Auto: 38mm" : "Auto: 47mm";
    if (k === "postType") return specTier === "budget" ? "Auto: 75mm timber" : "Auto: 100mm timber";
    if (k === "railCount") return "Auto: 3 rails";
    if (k === "postDepth") {
      const depth = Math.round((panelHeight * 0.33) / 50) * 50;
      return `Auto: ${depth}mm (33% of panel height)`;
    }
    if (k === "concretePerPost") {
      const depth = Math.round((panelHeight * 0.33) / 50) * 50;
      const rawConcrete = depth / 300;
      const concrete = Math.ceil(rawConcrete * 3) / 3;
      return `Auto: ${concrete.toFixed(2)} bags (1 per 300mm)`;
    }
    return "";
  };

  const isPanelFence = fenceType === "panel";

  const TABS = [
    { id: "sides", label: "SIDES" },
    { id: "posts", label: "POSTS" },
    ...(!isPanelFence ? [{ id: "boards", label: "BOARDS" }] : []),
    ...(isPanelFence ? [{ id: "panels", label: "PANELS" }] : []),
    ...(!isDIY ? [{ id: "extras", label: "EXTRAS" }] : []),
  ];

  const handlePanelSizeChange = sizeId => {
    const panelSize = PANEL_SIZES.find(p => p.id === sizeId);
    if (panelSize) {
      setD(p => ({
        ...p,
        panelSize: sizeId,
        postSpacing: String(panelSize.width),
        fenceHeight: String(panelSize.height),
      }));
    }
  };

  return (
    // Updated wrapper: dvh + safe-area padding to prevent bottom clipping on mobile
    <div
      style={{
        display: "flex",
        flexDirection: "column",

        minHeight: "calc(100dvh - var(--nav-height, 0px))",
        height: "calc(100vh - var(--nav-height, 0px))",

        background: "var(--bg)",
        overflow: "hidden",

        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <GlobalStyle />

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 48, background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, background: "var(--moss)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌿</div>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--cream)", letterSpacing: "0.08em" }}>LANDSCAPECALC</span>
          <span style={{ color: "var(--border2)", fontSize: "0.8rem" }}>›</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--timber)", letterSpacing: "0.06em" }}>FENCING CALCULATOR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SegControl
            options={[{ id: "diy", label: "DIY" }, { id: "pro", label: "PRO" }]}
            value={userMode}
            onChange={m => {
              setUserMode(m);
              setTab("sides");
            }}
            accentMap={{ diy: "var(--diy-col)", pro: "var(--pro-col)" }}
          />
          <SegControl options={[{ id: "full", label: "FULL" }, { id: "budget", label: "BUDGET" }]} value={specTier} onChange={setSpecTier} accentMap={{ full: "var(--full-col)", budget: "var(--budget-col)" }} />
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
                  transition: "all 0.15s",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowList(s => !s)}
            style={{
              padding: "5px 14px",
              background: showList ? "var(--timber)" : "var(--panel)",
              border: `1px solid ${showList ? "var(--timber)" : "var(--border2)"}`,
              borderRadius: 6,
              color: showList ? "var(--bg)" : "var(--text)",
              fontFamily: "var(--mono)",
              fontSize: "0.66rem",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {showList ? "▲ HIDE LIST" : "▼ MATERIALS LIST"}
          </button>
        </div>
      </div>

      {/* MAIN SPLIT */}
      {/* minHeight:0 is CRITICAL so nested scroll areas can shrink instead of being clipped */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT PANEL */}
        <div style={{ width: 292, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ display: "flex", background: "var(--bg)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  padding: "10px 2px",
                  border: "none",
                  background: tab === t.id ? "var(--surface)" : "transparent",
                  color: tab === t.id ? "var(--timber)" : "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderBottom: tab === t.id ? "2px solid var(--timber)" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* LEFT SCROLL REGION (added safe-area padding) */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px",
              minHeight: 0,
              paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
            }}
          >
            <div style={{ display: "flex", gap: 6, padding: "5px 10px", background: "var(--panel)", borderRadius: 5, border: "1px solid var(--border)", margin: "0 0 12px 0", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", fontWeight: 700, color: isDIY ? "var(--diy-col)" : "var(--pro-col)", letterSpacing: "0.08em" }}>{isDIY ? "DIY" : "PRO"}</span>
              <span style={{ color: "var(--border2)" }}>·</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", fontWeight: 700, color: specTier === "full" ? "var(--full-col)" : "var(--budget-col)", letterSpacing: "0.08em" }}>{specTier === "full" ? "FULL SPEC" : "BUDGET"}</span>
            </div>

            {/* ...everything below here is unchanged from your original... */}
            {tab === "sides" && (
              <>
                <PanelSection title="Fence Type">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                    {FENCE_TYPES.map(ft => (
                      <button
                        key={ft.id}
                        onClick={() => setFenceType(ft.id)}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${fenceType === ft.id ? "var(--timber)" : "var(--border)"}`,
                          borderRadius: 6,
                          background: fenceType === ft.id ? "rgba(200,120,64,0.12)" : "var(--bg)",
                          color: fenceType === ft.id ? "var(--timber)" : "var(--text-dim)",
                          fontFamily: "var(--mono)",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{ft.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{ft.label}</div>
                          <div style={{ fontSize: "0.6rem", color: "var(--text-mute)", marginTop: 2 }}>{ft.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </PanelSection>

                <PanelSection title="Fence Sides" accent="var(--moss)">
                  <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-dim)", marginBottom: 12, lineHeight: 1.5 }}>
                    Enter total length for each side (end to end, not centre to centre). Adjacent sides share corner posts.
                  </p>
                  <SideInput sideNum={1} length={d.side1} enabled={d.side1Enabled} onLengthChange={set("side1")} onEnabledChange={v => set("side1Enabled")(v)} />
                  <SideInput sideNum={2} length={d.side2} enabled={d.side2Enabled} onLengthChange={set("side2")} onEnabledChange={v => set("side2Enabled")(v)} />
                  <SideInput sideNum={3} length={d.side3} enabled={d.side3Enabled} onLengthChange={set("side3")} onEnabledChange={v => set("side3Enabled")(v)} />
                  <SideInput sideNum={4} length={d.side4} enabled={d.side4Enabled} onLengthChange={set("side4")} onEnabledChange={v => set("side4Enabled")(v)} />
                </PanelSection>

                <PanelSection title="Fence Height">
                  <Field label="Height" value={d.fenceHeight} onChange={set("fenceHeight")} unit="mm" hint="standard: 1800mm (6ft), 1500mm (5ft)" />
                </PanelSection>

                <PanelSection title="Waste Allowance">
                  <Field label="Waste %" value={d.waste} onChange={set("waste")} min={0} max={30} unit="%" hint="typically 10%" small />
                </PanelSection>
              </>
            )}

            {tab === "posts" && (
              <>
                <PanelSection title="Post Type" accent="var(--post-col)">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                    {POST_TYPES.map(pt => (
                      <button
                        key={pt.id}
                        onClick={() => !isLocked("postType") && set("postType")(pt.id)}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${fval("postType") === pt.id ? "var(--post-col)" : "var(--border)"}`,
                          borderRadius: 6,
                          background: fval("postType") === pt.id ? "rgba(90,138,80,0.12)" : "var(--bg)",
                          color: fval("postType") === pt.id ? "var(--post-col)" : "var(--text-dim)",
                          fontFamily: "var(--mono)",
                          fontSize: "0.72rem",
                          cursor: isLocked("postType") ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                          textAlign: "left",
                          opacity: isLocked("postType") && fval("postType") !== pt.id ? 0.4 : 1,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{pt.label}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-mute)", marginTop: 2 }}>{pt.size}</div>
                      </button>
                    ))}
                  </div>
                  {isLocked("postType") && <div style={{ fontSize: "0.6rem", color: "var(--locked-txt)", fontFamily: "var(--mono)", marginTop: -8, marginBottom: 8 }}>{lockReason("postType")}</div>}
                </PanelSection>

                <PanelSection title="Post Spacing">
                  <Field
                    label="Max Post Spacing"
                    value={d.postSpacing}
                    onChange={set("postSpacing")}
                    unit="mm"
                    hint={isPanelFence ? "determined by panel width" : "typical: 2400-3000mm"}
                    locked={isPanelFence}
                    lockedReason={isPanelFence ? "Determined by panel size" : undefined}
                  />
                </PanelSection>

                <PanelSection title="Post Installation">
                  <Field label="Depth in Ground" value={fval("postDepth")} onChange={set("postDepth")} unit="mm" hint="min 600mm, 750mm for exposed sites" small locked={isLocked("postDepth")} lockedReason={lockReason("postDepth")} />
                  <Field label="Concrete per Post" value={fval("concretePerPost")} onChange={set("concretePerPost")} unit="bags" hint="20kg bags of postcrete" small locked={isLocked("concretePerPost")} lockedReason={lockReason("concretePerPost")} />
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(90,138,80,0.08)", border: "1px solid rgba(90,138,80,0.2)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>POST SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Total Posts", v: `${result.posts.count} no.` },
                        { l: "Post Height", v: fmm(result.posts.height) },
                        { l: "Above Ground", v: fmm(result.posts.aboveGround) },
                        { l: "In Ground", v: fmm(result.posts.depthInGround) },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--post-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "panels" && isPanelFence && (
              <>
                <PanelSection title="Panel Size" accent="var(--board-col)">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                    {PANEL_SIZES.map(ps => (
                      <button
                        key={ps.id}
                        onClick={() => handlePanelSizeChange(ps.id)}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${d.panelSize === ps.id ? "var(--board-col)" : "var(--border)"}`,
                          borderRadius: 6,
                          background: d.panelSize === ps.id ? "rgba(200,120,64,0.12)" : "var(--bg)",
                          color: d.panelSize === ps.id ? "var(--board-col)" : "var(--text-dim)",
                          fontFamily: "var(--mono)",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{ps.label}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-mute)", marginTop: 2 }}>
                          {ps.width}mm × {ps.height}mm
                        </div>
                      </button>
                    ))}
                  </div>
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(200,120,64,0.08)", border: "1px solid rgba(200,120,64,0.2)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>PANEL SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Total Panels", v: `${result.panels.count} pcs` },
                        { l: "Panel Size", v: result.panels.size.label },
                        { l: "Panel Clips", v: `${result.hardware.panelClips} no.` },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--board-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "boards" && !isPanelFence && (
              <>
                <PanelSection title="Board Specification" accent="var(--board-col)">
                  <Field label="Board Width" value={fval("boardWidth")} onChange={set("boardWidth")} unit="mm" hint={fenceType === "featheredge" ? "face width, typically 125-150mm" : "typically 100-125mm"} locked={isLocked("boardWidth")} lockedReason={lockReason("boardWidth")} />
                  <Field label="Board Thickness" value={fval("boardThick")} onChange={set("boardThick")} unit="mm" hint="typically 19-22mm" small locked={isLocked("boardThick")} lockedReason={lockReason("boardThick")} />
                  {fenceType === "featheredge" && (
                    <Field label="Board Overlap" value={fval("boardOverlap")} onChange={set("boardOverlap")} unit="mm" hint="typically 25-30mm" small locked={isLocked("boardOverlap")} lockedReason={lockReason("boardOverlap")} />
                  )}
                </PanelSection>

                <PanelSection title="Rails" accent="var(--rail-col)">
                  <Field label="Number of Rails" value={fval("railCount")} onChange={set("railCount")} unit="per bay" hint="typically 2-3" small locked={isLocked("railCount")} lockedReason={lockReason("railCount")} />
                  <Field label="Rail Depth" value={fval("railDepth")} onChange={set("railDepth")} unit="mm" hint="arris rail: 75-100mm" small locked={isLocked("railDepth")} lockedReason={lockReason("railDepth")} />
                  <Field label="Rail Thickness" value={fval("railThick")} onChange={set("railThick")} unit="mm" small locked={isLocked("railThick")} lockedReason={lockReason("railThick")} />
                </PanelSection>

                {result && (
                  <div style={{ background: "rgba(200,120,64,0.08)", border: "1px solid rgba(200,120,64,0.2)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>BOARD & RAIL SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Total Boards", v: `${result.boards.count} pcs` },
                        { l: "Board Height", v: fmm(result.boards.height) },
                        { l: "Total Rails", v: `${result.rails.count} pcs` },
                        { l: "Rail Length", v: fmm(result.spec.postSpacing) },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--board-col)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "extras" && !isDIY && (
              <>
                <PanelSection title="Trellis Topper" accent="var(--moss-lt)">
                  <Toggle
                    label="Add trellis topper"
                    checked={extras.addTrellis}
                    onChange={v => setExtras(e => ({ ...e, addTrellis: v }))}
                    accent="var(--moss-lt)"
                    sub="Decorative lattice panel on top of fence"
                  />
                  {extras.addTrellis && <Field label="Trellis Height" value={d.trellisHeight} onChange={set("trellisHeight")} unit="mm" hint="typically 300-450mm" small />}
                </PanelSection>

                {extras.addTrellis && result && (
                  <div style={{ background: "rgba(106,170,96,0.1)", border: "1px solid rgba(106,170,96,0.25)", borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: 8, letterSpacing: "0.1em" }}>TRELLIS SUMMARY</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Trellis Panels", v: `${result.panels.count || Math.max(1, result.sides.reduce((sum, s) => sum + s.posts - 1, 0))} pcs` },
                        { l: "Trellis Height", v: fmm(mm(d.trellisHeight)) },
                        { l: "Post Extension", v: `+${fmm(mm(d.trellisHeight))}` },
                        { l: "New Post Length", v: fmm(result.posts.height + mm(d.trellisHeight)) },
                      ].map((it, i) => (
                        <div key={i}>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{it.l}</div>
                          <div style={{ fontSize: "0.88rem", color: "var(--moss-lt)", fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 4 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-dim)", lineHeight: 1.5 }}>⚠ Posts must be extended by trellis height. Order longer posts or add post extenders.</div>
                    </div>
                  </div>
                )}

                <PanelSection title="More Options Coming Soon" accent="var(--text-mute)">
                  <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-mute)", lineHeight: 1.6 }}>
                    Future extras will include: capping rails, gravel boards, kickboards, and gate openings.
                  </p>
                </PanelSection>
              </>
            )}
          </div>

          <div style={{ padding: "8px 14px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: result ? "var(--moss-lt)" : "var(--text-mute)", letterSpacing: "0.1em" }}>{result ? `● ${result.totalLength}m CALCULATED` : "○ AWAITING INPUT"}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>{userMode.toUpperCase()} · {fenceType.toUpperCase()}</span>
          </div>
        </div>

        {/* RIGHT — VIEWS + MATERIALS LIST */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div
            style={{
              flex: showList ? "0 0 55%" : "1 1 auto",
              background: "var(--bg)",
              position: "relative",
              overflow: "hidden",
              transition: "flex 0.3s ease",
              minHeight: 0,
            }}
          >
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
              {(view === "ELEVATION" || view === "BOTH") && view !== "PLAN" && <FenceElevation calc={result} fenceType={fenceType} />}
              {view === "PLAN" && <FencePlan calc={result} sides={d} />}
              {view === "BOTH" && (
                <div style={{ display: "flex", width: "100%", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border)" }}>
                    <FenceElevation calc={result} fenceType={fenceType} />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FencePlan calc={result} sides={d} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: "absolute", top: 14, right: 14, fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-mute)", letterSpacing: "0.14em", background: "rgba(14,16,18,0.7)", padding: "4px 10px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              {view === "ELEVATION" ? "ELEVATION VIEW" : view === "PLAN" ? "PLAN VIEW" : "ELEVATION + PLAN"}
            </div>

            <div style={{ position: "absolute", top: 14, left: 14, fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.1em", background: "rgba(14,16,18,0.75)", padding: "4px 10px", borderRadius: 4, display: "flex", gap: 8, alignItems: "center", backdropFilter: "blur(4px)" }}>
              <span style={{ color: isDIY ? "var(--diy-col)" : "var(--pro-col)", fontWeight: 700 }}>{isDIY ? "DIY" : "PRO"}</span>
              <span style={{ color: "var(--border2)" }}>·</span>
              <span style={{ color: "var(--timber)", fontWeight: 700 }}>{fenceType.toUpperCase()}</span>
            </div>

            {result && (
              <div style={{ position: "absolute", bottom: 14, right: 14, fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-mute)", letterSpacing: "0.1em", background: "rgba(14,16,18,0.7)", padding: "4px 10px", borderRadius: 4 }}>
                {result.totalLength}m total · {result.posts.count} posts
              </div>
            )}
          </div>

          {showList && (
            // MATERIALS LIST scroll region (added safe-area padding)
            <div
              style={{
                flex: "1 1 45%",
                overflowY: "auto",
                borderTop: "1px solid var(--border)",
                minHeight: 0,
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              <CuttingList calc={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}