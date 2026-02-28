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
      --building:#4A6888; --border-col:#A08840;
      --noggin-col:#7A5CA0;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;
    }

    /* IMPORTANT:
       - Make the document roots measurable (prevents flex children mis-sizing)
       - Keep body overflow hidden so ONLY internal panels scroll (left panel / cutting list)
    */
    html, body { height: 100%; }
    #root, #__next { height: 100%; }

    body { font-family:var(--sans); background:var(--bg); color:var(--text); overflow:hidden; }

    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const SHAPES    = [{id:"rectangle",label:"Rectangle",icon:"▬"},{id:"l-shape",label:"L-Shape",icon:"⌐"},{id:"t-shape",label:"T-Shape",icon:"⊤"},{id:"u-shape",label:"U-Shape",icon:"∪"}];
const BOARD_DIRS= [{id:"horizontal",label:"← → Across Width"},{id:"vertical",label:"↑ ↓ Along Length"},{id:"diagonal",label:"⟋  Diagonal 45°"}];
const VIEWS     = ["BOARDS","SUBFRAME","BOTH"];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const mm  = v => parseFloat(v)||0;
const r2  = n => Math.round(n*100)/100;
const CEI = Math.ceil;
const fmm = v => v>=1000?`${r2(v/1000).toFixed(2)}m`:`${Math.round(v)}mm`;

/* ─── DIY SPEC RESOLVER ──────────────────────────────────────────────────── */
function resolveDIYSpec(tier, postH) {
  const h = mm(postH);
  if (tier==="budget") return {
    joistDepth:"100", joistThick:"50", joistSpacing:"600",
    beamDepth:"100", beamThick:"50", postWidth:h>500?"100":"75",
  };
  return {
    joistDepth:"150", joistThick:"50", joistSpacing:"400",
    beamDepth:"150", beamThick:"50", postWidth:"100",
  };
}

/* ─── DIY BEAM SPACING ───────────────────────────────────────────────────── */
function calcDIYBeamSpacing(span) {
  if (!span||span<=0) return 1500;
  let n = CEI(span/1800);
  while (span/n>1800) n++;
  return Math.round(span/n);
}

/* ─── CALCULATION ENGINE ─────────────────────────────────────────────────── */
function calcDeck(s) {
  const W=mm(s.width), L=mm(s.length);
  if (!W||!L) return null;
  const cW=mm(s.cutW), cL=mm(s.cutL), c2W=mm(s.cut2W), c2L=mm(s.cut2L);
  const cutPos=s.cutPos||"right"; // "left" | "right"
  const cutOffset=mm(s.cutOffset)||0; // offset from selected side
  const extPos=s.extPos||"left"; // "left" | "right"
  const extOffset=mm(s.extOffset)||0; // offset from selected side

  let area=W*L;
  if (s.shape==="l-shape") area-=cW*cL;
  if (s.shape==="u-shape") area-=cW*cL;
  if (s.shape==="t-shape") area+=c2W*c2L;

  const boardW=mm(s.boardWidth), boardT=mm(s.boardThick), gapW=mm(s.boardGap);
  const pitch=boardW+gapW;
  const joistDepth=mm(s.joistDepth), joistThick=mm(s.joistThick), joistSpacing=mm(s.joistSpacing);
  const beamDepth=mm(s.beamDepth), beamThick=mm(s.beamThick);
  const postW=mm(s.postWidth), postH=mm(s.postHeight), postSpacing=mm(s.postSpacing);
  const nogginSpacing=mm(s.nogginSpacing)||1200;
  const waste=1+mm(s.waste)/100;
  const isDIY=s.userMode==="diy";
  const hasBorder=!isDIY&&!!s.extras?.borderBoard;
  // Building sides and exclusion toggle are independent
  const buildingSides=s.extras?.buildingSides||[];
  const excludeBorderAtBuilding=!isDIY&&!!s.extras?.excludeBorderAtBuilding;

  // Board counts - account for shape complexity
  let boardCount, boardLength;
  // For T-shape, extension adds to total length in one direction
  const effectiveL = s.shape==="t-shape" ? L + c2L : L;
  
  if (s.boardDir==="horizontal") {
    boardCount=CEI(W/pitch);
    boardLength=effectiveL;
  } else if (s.boardDir==="vertical") {
    boardCount=CEI(effectiveL/pitch);
    boardLength=W;
  } else {
    const d=Math.sqrt(W*W+effectiveL*effectiveL);
    boardCount=CEI(d/pitch*1.15);
    boardLength=d;
  }
  
  // Adjust board count for cutouts (L and U shapes reduce board coverage area)
  // This is a rough approximation - some boards will be shorter due to cutouts
  if (s.shape==="l-shape" || s.shape==="u-shape") {
    // Reduce estimated boards based on cutout proportion
    const cutoutRatio = (cW * cL) / (W * L);
    // Don't reduce count, but the area calculation already handles this
  }
  
  const boardsWithWaste=CEI(boardCount*waste);

  // Joists — run perpendicular to boards
  const joistSpan   = s.boardDir==="vertical"?L:W;
  const joistRunLen = s.boardDir==="vertical"?W:L;

  // Border: a single joist is placed at the border inset (one board-width in from perimeter)
  // No doubling — just an extra joist at that position
  const borderOffset = hasBorder ? boardW+gapW : 0;

  // Build joist positions
  const joistPositions = [0];
  if (hasBorder && borderOffset>0) joistPositions.push(borderOffset);
  const innerStart = hasBorder ? borderOffset : 0;
  const innerEnd   = hasBorder ? joistRunLen - borderOffset : joistRunLen;
  const innerSpan  = innerEnd - innerStart;
  const nInner     = CEI(innerSpan/joistSpacing);
  for (let i=1;i<nInner;i++) joistPositions.push(innerStart + i*(innerSpan/nInner));
  if (hasBorder && borderOffset>0) joistPositions.push(joistRunLen - borderOffset);
  joistPositions.push(joistRunLen);
  const uniqueJoistPos = [...new Set(joistPositions.map(p=>Math.round(p)))].sort((a,b)=>a-b);
  const numJoists = uniqueJoistPos.length;

  // Border board rows — respects excludeBorderAtBuilding toggle
  let borderBoardRows = [];
  if (hasBorder) {
    const excN = excludeBorderAtBuilding && buildingSides.includes("north");
    const excS = excludeBorderAtBuilding && buildingSides.includes("south");
    const excE = excludeBorderAtBuilding && buildingSides.includes("east");
    const excW = excludeBorderAtBuilding && buildingSides.includes("west");
    const longLen  = s.boardDir==="vertical"?W:L;
    const shortLen = s.boardDir==="vertical"?L:W;
    const longCount  = (excN?0:1)+(excS?0:1);
    const shortCount = (excE?0:1)+(excW?0:1);
    if (longCount>0)  borderBoardRows.push({label:"Border — long sides",  qty:longCount,  length:Math.round(longLen)});
    if (shortCount>0) borderBoardRows.push({label:"Border — short sides", qty:shortCount, length:Math.round(shortLen)});
  }

  // Beam spacing
  const actualBeamSpacing = isDIY ? calcDIYBeamSpacing(joistSpan) : postSpacing;

  // Posts — DIY: every other joist, Pro: at every joist
  let numPosts;
  if (isDIY) {
    const beamCount    = CEI(joistSpan/actualBeamSpacing)+1;
    const postsPerBeam = CEI(numJoists/2)+1;
    numPosts = beamCount * postsPerBeam;
  } else {
    const postsPerBeam = CEI(joistRunLen/actualBeamSpacing)+1;
    const numBeams     = CEI(joistSpan/actualBeamSpacing)+1;
    numPosts = postsPerBeam * numBeams;
  }
  const numBeams = CEI(joistSpan/actualBeamSpacing)+1;

  // Noggins (Pro only) — staggered between joists, spanning between beams
  // noggins run perpendicular to joists, between each pair of adjacent joists
  // Each bay between joists gets a row of noggins at nogginSpacing intervals
  // Stagger: odd bays offset by half nogginSpacing
  let nogginCount = 0;
  let nogginLength = 0;
  if (!isDIY) {
    nogginLength = Math.round(joistSpacing * 0.9); // approx cut length = joist spacing minus kerf
    const numBays   = uniqueJoistPos.length - 1;
    const beamSpanS = actualBeamSpacing; // span between beams = nogging span
    for (let bay=0; bay<numBays; bay++) {
      const bayStart = uniqueJoistPos[bay];
      const bayEnd   = uniqueJoistPos[bay+1];
      const bayGap   = bayEnd - bayStart;
      if (bayGap < 10) continue; // skip collapsed gaps
      // Count noggings in this bay along the beam span direction
      const offset = (bay%2===1) ? nogginSpacing/2 : 0; // stagger odd rows
      let nogPos = offset;
      while (nogPos < beamSpanS) { nogginCount++; nogPos += nogginSpacing; }
    }
    // Multiply by number of beam spans
    nogginCount = nogginCount * (numBeams - 1 || 1);
  }

  const fasciaBoards=[
    {label:"Long fascia",  qty:2, length:Math.max(W,L)},
    {label:"Short fascia", qty:2, length:Math.min(W,L)},
  ];

  const joistHangers     = numJoists*2;
  const postBases        = numPosts;
  const rimJoistBrackets = (numJoists+1)*2;
  const screwsPerBoard   = CEI(boardLength/joistSpacing)*2;
  const screwsTotal      = CEI(boardsWithWaste*screwsPerBoard);
  const screwsBoxes      = CEI(screwsTotal/200);
  const concreteBags     = CEI(Math.PI*0.04*0.6*numPosts/0.012);

  return {
    area:r2(area/1e6), W,L,cW,cL,c2W,c2L,cutPos,cutOffset,extPos,extOffset,pitch,
    actualBeamSpacing, joistPositions:uniqueJoistPos,
    hasBorder, borderOffset, buildingSides, excludeBorderAtBuilding,
    boards:{count:boardsWithWaste, length:Math.round(boardLength), totalLineal:r2(boardsWithWaste*boardLength/1000)},
    borderBoardRows,
    joists:{count:numJoists, positions:uniqueJoistPos, span:Math.round(joistSpan), runLen:Math.round(joistRunLen), rimLen:Math.round(joistRunLen)},
    beams:{count:numBeams, length:Math.round(joistSpan)},
    posts:{count:numPosts, height:postH},
    noggins:{count:nogginCount, length:Math.round(nogginLength), spacing:nogginSpacing},
    fascia:fasciaBoards, hardware:{joistHangers,postBases,rimJoistBrackets,screwsBoxes,screwsTotal,concreteBags},
    spec:{boardW,boardT,gapW,joistDepth,joistThick,beamDepth,beamThick,postW,postSpacing:actualBeamSpacing,joistSpacing,nogginSpacing},
    userMode:s.userMode,
  };
}

/* ─── SVG PLAN ───────────────────────────────────────────────────────────── */
function DeckPlan({calc,view,shape,boardDir}) {
  if (!calc) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:16}}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="8" width="48" height="48" rx="4" stroke="#2A3038" strokeWidth="2" strokeDasharray="6 4"/>
        <path d="M20 32h24M32 20v24" stroke="#3A4450" strokeWidth="1.5"/>
      </svg>
      <span style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:"var(--text-mute)",letterSpacing:"0.1em"}}>ENTER DIMENSIONS TO GENERATE PLAN</span>
    </div>
  );

  const {W,L,cW,cL,c2W,c2L,cutPos,cutOffset,extPos,extOffset,spec,pitch,hasBorder,borderOffset,buildingSides,excludeBorderAtBuilding,joistPositions,actualBeamSpacing,noggins,userMode} = calc;
  const isDIY = userMode==="diy";
  const showBoards   = view==="BOARDS"  ||view==="BOTH";
  const showSubframe = view==="SUBFRAME"||view==="BOTH";

  // ── Layout: generous fixed padding so annotation layers don't collide
  const PAD_L=80, PAD_R=90, PAD_T=70, PAD_B=72;
  const SVG_W=800, SVG_H=560;
  const drawW=SVG_W-PAD_L-PAD_R;
  const drawH=SVG_H-PAD_T-PAD_B;
  
  // For T-shape, we need to account for extension in the total height
  const totalH = shape==="t-shape" ? L + c2L : L;
  const scale=Math.min(drawW/W, drawH/totalH) * 0.9; // 10% smaller
  const dw=W*scale, dh=L*scale;
  const extH = c2L*scale; // extension height for T-shape
  const ox=PAD_L+(drawW-dw)/2;
  const oy=PAD_T+(drawH-(shape==="t-shape"?dh+extH:dh))/2;

  // Calculate cutout/extension X positions with offsets
  const cw=cW*scale, ch=cL*scale;
  const ew=c2W*scale, eh=c2L*scale;
  const cutOffsetScaled = cutOffset*scale;
  const extOffsetScaled = extOffset*scale;
  
  // Cutout X position (for L and U shapes)
  let cutX;
  if (cutPos==="left") cutX = ox + cutOffsetScaled;
  else cutX = ox + dw - cw - cutOffsetScaled;
  
  // Extension X position (for T shape)
  let extX;
  if (extPos==="left") extX = ox + extOffsetScaled;
  else extX = ox + dw - ew - extOffsetScaled;

  // Clip path - properly handles offsets
  let clipD="";
  if (shape==="rectangle") {
    clipD=`M${ox},${oy} h${dw} v${dh} h${-dw}Z`;
  } else if (shape==="l-shape") {
    if (cutPos==="left") {
      const cutRight = cutOffsetScaled + cw; // right edge of cutout from left
      clipD=`M${ox},${oy} h${dw} v${dh} h${-dw+cutRight} v${-ch} h${-cw} v${ch} h${-cutOffsetScaled}Z`;
    } else {
      const cutLeft = dw - cutOffsetScaled - cw; // left edge of cutout from left
      clipD=`M${ox},${oy} h${dw} v${dh-ch} h${-cutOffsetScaled-cw} v${ch} h${-cutLeft}Z`;
    }
  } else if (shape==="t-shape") {
    const extLeft = extPos==="left" ? extOffsetScaled : dw - ew - extOffsetScaled;
    const extRight = extLeft + ew;
    clipD=`M${ox},${oy} h${dw} v${dh} h${-(dw-extRight)} v${eh} h${-ew} v${-eh} h${-extLeft}Z`;
  } else if (shape==="u-shape") {
    const cutLeft = cutPos==="left" ? cutOffsetScaled : dw - cw - cutOffsetScaled;
    const cutRight = cutLeft + cw;
    clipD=`M${ox},${oy} h${dw} v${dh} h${-(dw-cutRight)} v${-ch} h${-cw} v${ch} h${-cutLeft}Z`;
  }

  const els=[]; let ki=0; const k=()=>`e${ki++}`;

  // ── Background - covers full clipped area including extension
  els.push(<rect key={k()} x={ox} y={oy} width={dw} height={shape==="t-shape"?dh+eh:dh} fill={showBoards?"#6B3F1E":"var(--panel)"} clipPath="url(#dc)"/>);

  // ── Board stripes - extend into T-shape extension area
  if (showBoards) {
    const p=pitch*scale, bw=spec.boardW*scale;
    const totalDrawH = shape==="t-shape" ? dh+eh : dh;
    if (boardDir==="horizontal") {
      for (let x=ox;x<ox+dw;x+=p)
        els.push(<rect key={k()} x={x} y={oy} width={Math.max(bw,1)} height={totalDrawH} fill="#8B5E3A" stroke="#7A4E2A" strokeWidth="0.3" clipPath="url(#dc)"/>);
    } else if (boardDir==="vertical") {
      for (let y=oy;y<oy+totalDrawH;y+=p)
        els.push(<rect key={k()} x={ox} y={y} width={dw} height={Math.max(bw,1)} fill="#8B5E3A" stroke="#7A4E2A" strokeWidth="0.3" clipPath="url(#dc)"/>);
    } else {
      const diagH = totalDrawH;
      const steps=CEI((Math.sqrt(dw*dw+diagH*diagH)+p*2)/p)+4;
      for (let i=-steps/2;i<steps;i++)
        els.push(<line key={k()} x1={ox+i*p} y1={oy} x2={ox+i*p+diagH} y2={oy+diagH} stroke="#7A4E2A" strokeWidth={Math.max(bw*0.85,0.5)} clipPath="url(#dc)"/>);
    }
    els.push(<rect key={k()} x={ox} y={oy} width={dw} height={totalDrawH} fill="url(#wg)" clipPath="url(#dc)" opacity="0.4"/>);

    // Border highlight — show on all sides unless excluded
    if (hasBorder && borderOffset>0) {
      const bo=borderOffset*scale;
      const showN = !(excludeBorderAtBuilding && buildingSides.includes("north"));
      const showS = !(excludeBorderAtBuilding && buildingSides.includes("south"));
      const showE = !(excludeBorderAtBuilding && buildingSides.includes("east"));
      const showW = !(excludeBorderAtBuilding && buildingSides.includes("west"));
      if (showW) els.push(<rect key={k()} x={ox}       y={oy} width={bo} height={dh} fill="rgba(210,170,60,0.15)" clipPath="url(#dc)"/>);
      if (showE) els.push(<rect key={k()} x={ox+dw-bo} y={oy} width={bo} height={dh} fill="rgba(210,170,60,0.15)" clipPath="url(#dc)"/>);
      if (showN) els.push(<rect key={k()} x={ox} y={oy}       width={dw} height={bo} fill="rgba(210,170,60,0.15)" clipPath="url(#dc)"/>);
      if (showS) els.push(<rect key={k()} x={ox} y={oy+dh-bo} width={dw} height={bo} fill="rgba(210,170,60,0.15)" clipPath="url(#dc)"/>);
    }
  }

  // ── Subframe - extends into T-shape extension area
  if (showSubframe) {
    const al  = view==="BOTH"?0.72:1;
    const bal = view==="BOTH"?0.88:1;
    const jw  = Math.max(spec.joistThick*scale,1.5);
    const bw2 = Math.max(spec.beamThick*scale,2.5);
    const bs  = actualBeamSpacing*scale;
    const pr  = Math.max(spec.postW*scale/2,3.5);
    const totalDrawH = shape==="t-shape" ? dh+eh : dh;

    if (boardDir!=="vertical") {
      // Joists horizontal, positioned along Y - extend full height
      joistPositions.forEach(pos=>{
        const y=oy+pos*scale;
        els.push(<line key={k()} x1={ox} y1={y} x2={ox+dw} y2={y} stroke="#4A78B0" strokeWidth={jw} clipPath="url(#dc)" opacity={al}/>);
      });
      // Additional joists in extension area for T-shape
      if (shape==="t-shape" && eh>0) {
        const extJoistSpacing = spec.joistSpacing*scale;
        for (let y=oy+dh+extJoistSpacing; y<oy+dh+eh; y+=extJoistSpacing) {
          els.push(<line key={k()} x1={extX} y1={y} x2={extX+ew} y2={y} stroke="#4A78B0" strokeWidth={jw} clipPath="url(#dc)" opacity={al}/>);
        }
        // Extension boundary joist
        els.push(<line key={k()} x1={extX} y1={oy+dh+eh} x2={extX+ew} y2={oy+dh+eh} stroke="#4A78B0" strokeWidth={jw} clipPath="url(#dc)" opacity={al}/>);
      }
      // Beams vertical - extend into extension
      for (let x=ox;x<=ox+dw+1;x+=bs)
        els.push(<line key={k()} x1={x} y1={oy} x2={x} y2={oy+totalDrawH} stroke="#3A8040" strokeWidth={bw2} clipPath="url(#dc)" opacity={bal}/>);
      // Noggins (Pro) — short perpendicular stubs between joist pairs, staggered
      if (!isDIY && noggins.spacing>0) {
        const ns=spec.nogginSpacing*scale;
        for (let bayIdx=0;bayIdx<joistPositions.length-1;bayIdx++) {
          const y1=oy+joistPositions[bayIdx]*scale;
          const y2=oy+joistPositions[bayIdx+1]*scale;
          if ((y2-y1)<4) continue;
          const offset=(bayIdx%2===1)?(ns*0.5):0; // stagger every other bay
          for (let nx=ox+offset;nx<ox+dw;nx+=ns) {
            els.push(<line key={k()} x1={nx} y1={y1+jw/2} x2={nx} y2={y2-jw/2} stroke="#7A5CA0" strokeWidth={Math.max(jw*0.75,1.2)} clipPath="url(#dc)" opacity={al*0.85}/>);
          }
        }
      }
      // Posts - extend into extension area
      for (let xi=ox;xi<=ox+dw+1;xi+=bs) {
        joistPositions.forEach((pos,ji)=>{
          if (isDIY&&ji%2!==0) return;
          els.push(<circle key={k()} cx={xi} cy={oy+pos*scale} r={pr} fill="#1E3020" stroke="#3A8040" strokeWidth="1" clipPath="url(#dc)" opacity={al}/>);
        });
        // Posts in T-shape extension
        if (shape==="t-shape" && eh>0 && xi>=extX && xi<=extX+ew) {
          els.push(<circle key={k()} cx={xi} cy={oy+dh+eh} r={pr} fill="#1E3020" stroke="#3A8040" strokeWidth="1" clipPath="url(#dc)" opacity={al}/>);
        }
      }
    } else {
      // Joists vertical, positioned along X
      joistPositions.forEach(pos=>{
        const x=ox+pos*scale;
        els.push(<line key={k()} x1={x} y1={oy} x2={x} y2={oy+totalDrawH} stroke="#4A78B0" strokeWidth={jw} clipPath="url(#dc)" opacity={al}/>);
      });
      // Beams horizontal - extend into extension
      for (let y=oy;y<=oy+totalDrawH+1;y+=bs)
        els.push(<line key={k()} x1={ox} y1={y} x2={ox+dw} y2={y} stroke="#3A8040" strokeWidth={bw2} clipPath="url(#dc)" opacity={bal}/>);
      // Noggins staggered
      if (!isDIY && noggins.spacing>0) {
        const ns=spec.nogginSpacing*scale;
        for (let bayIdx=0;bayIdx<joistPositions.length-1;bayIdx++) {
          const x1=ox+joistPositions[bayIdx]*scale;
          const x2=ox+joistPositions[bayIdx+1]*scale;
          if ((x2-x1)<4) continue;
          const offset=(bayIdx%2===1)?(ns*0.5):0;
          for (let ny=oy+offset;ny<oy+totalDrawH;ny+=ns) {
            els.push(<line key={k()} x1={x1+jw/2} y1={ny} x2={x2-jw/2} y2={ny} stroke="#7A5CA0" strokeWidth={Math.max(jw*0.75,1.2)} clipPath="url(#dc)" opacity={al*0.85}/>);
          }
        }
      }
      // Posts
      for (let yi=oy;yi<=oy+totalDrawH+1;yi+=bs) {
        joistPositions.forEach((pos,ji)=>{
          if (isDIY&&ji%2!==0) return;
          els.push(<circle key={k()} cx={ox+pos*scale} cy={yi} r={pr} fill="#1E3020" stroke="#3A8040" strokeWidth="1" clipPath="url(#dc)" opacity={al}/>);
        });
      }
    }
  }

  // ── Deck outline
  els.push(<path key={k()} d={clipD} fill="none" stroke="#C87840" strokeWidth="2"/>);

  // ── Cutout overlays - show the removed area
  if (shape==="l-shape"&&cW&&cL) {
    els.push(<rect key={k()} x={cutX} y={oy+dh-ch} width={cw} height={ch} fill="var(--bg)" stroke="var(--border2)" strokeWidth="1" strokeDasharray="4 3"/>);
  }
  if (shape==="u-shape"&&cW&&cL) {
    const uCutX = cutPos==="left" ? ox + cutOffsetScaled : ox + dw - cw - cutOffsetScaled;
    els.push(<rect key={k()} x={uCutX} y={oy+dh-ch} width={cw} height={ch} fill="var(--bg)" stroke="var(--border2)" strokeWidth="1" strokeDasharray="4 3"/>);
  }

  // ── Building walls
  const wallT=11;
  buildingSides.forEach(side=>{
    if (side==="north") {
      els.push(<rect key={k()} x={ox} y={oy-wallT} width={dw} height={wallT} fill="#1A2A38" stroke="#3A5870" strokeWidth="1"/>);
      for (let hx=ox-wallT;hx<ox+dw+wallT;hx+=8) els.push(<line key={k()} x1={hx} y1={oy-wallT} x2={hx+wallT} y2={oy} stroke="#2E4A60" strokeWidth="0.8"/>);
      els.push(<text key={k()} x={ox+dw/2} y={oy-wallT-5} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7.5" fill="#4A7090" letterSpacing="0.14em">BUILDING</text>);
    } else if (side==="south") {
      els.push(<rect key={k()} x={ox} y={oy+dh} width={dw} height={wallT} fill="#1A2A38" stroke="#3A5870" strokeWidth="1"/>);
      for (let hx=ox-wallT;hx<ox+dw+wallT;hx+=8) els.push(<line key={k()} x1={hx} y1={oy+dh} x2={hx+wallT} y2={oy+dh+wallT} stroke="#2E4A60" strokeWidth="0.8"/>);
      els.push(<text key={k()} x={ox+dw/2} y={oy+dh+wallT+10} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7.5" fill="#4A7090" letterSpacing="0.14em">BUILDING</text>);
    } else if (side==="west") {
      els.push(<rect key={k()} x={ox-wallT} y={oy} width={wallT} height={dh} fill="#1A2A38" stroke="#3A5870" strokeWidth="1"/>);
      for (let hy=oy-wallT;hy<oy+dh+wallT;hy+=8) els.push(<line key={k()} x1={ox-wallT} y1={hy} x2={ox} y2={hy+wallT} stroke="#2E4A60" strokeWidth="0.8"/>);
      els.push(<text key={k()} x={ox-wallT-6} y={oy+dh/2} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7.5" fill="#4A7090" letterSpacing="0.14em" transform={`rotate(-90,${ox-wallT-6},${oy+dh/2})`}>BUILDING</text>);
    } else if (side==="east") {
      els.push(<rect key={k()} x={ox+dw} y={oy} width={wallT} height={dh} fill="#1A2A38" stroke="#3A5870" strokeWidth="1"/>);
      for (let hy=oy-wallT;hy<oy+dh+wallT;hy+=8) els.push(<line key={k()} x1={ox+dw} y1={hy} x2={ox+dw+wallT} y2={hy+wallT} stroke="#2E4A60" strokeWidth="0.8"/>);
      els.push(<text key={k()} x={ox+dw+wallT+6} y={oy+dh/2} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7.5" fill="#4A7090" letterSpacing="0.14em" transform={`rotate(90,${ox+dw+wallT+6},${oy+dh/2})`}>BUILDING</text>);
    }
  });

  // ── DIMENSION ANNOTATIONS ─────────────────────────────────────────────────
  const AC="#C87840", AJ="#3A6898", AB="#2E6838", AN="#7A5CA0";
  const tick=4;

  const isVert = boardDir==="vertical";

  // ── OVERALL WIDTH
  const owTopY = isVert ? oy-46 : oy-28;
  els.push(<line key={k()} x1={ox} y1={owTopY} x2={ox+dw} y2={owTopY} stroke={AC} strokeWidth="1"/>);
  els.push(<line key={k()} x1={ox}    y1={owTopY-tick} x2={ox}    y2={owTopY+tick} stroke={AC} strokeWidth="1"/>);
  els.push(<line key={k()} x1={ox+dw} y1={owTopY-tick} x2={ox+dw} y2={owTopY+tick} stroke={AC} strokeWidth="1"/>);
  els.push(<line key={k()} x1={ox}    y1={oy} x2={ox}    y2={owTopY+tick} stroke={AC} strokeWidth="0.4" strokeDasharray="3 3" opacity="0.35"/>);
  els.push(<line key={k()} x1={ox+dw} y1={oy} x2={ox+dw} y2={owTopY+tick} stroke={AC} strokeWidth="0.4" strokeDasharray="3 3" opacity="0.35"/>);
  els.push(<text key={k()} x={ox+dw/2} y={owTopY-7} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="500">{fmm(W)}</text>);

  // Bottom overall-W (secondary, dimmer)
  const owBotY = oy+dh + (showSubframe && !isVert ? 44 : 26);
  els.push(<line key={k()} x1={ox} y1={owBotY} x2={ox+dw} y2={owBotY} stroke={AC} strokeWidth="0.8" opacity="0.5"/>);
  [ox,ox+dw].forEach(x=>els.push(<line key={k()} x1={x} y1={owBotY-tick} x2={x} y2={owBotY+tick} stroke={AC} strokeWidth="0.8" opacity="0.5"/>));
  els.push(<text key={k()} x={ox+dw/2} y={owBotY+12} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="9" opacity="0.5">{fmm(W)}</text>);

  // ── OVERALL LENGTH — right side lane 2
  const olRX = ox+dw + (showSubframe && isVert ? 50 : 30);
  els.push(<line key={k()} x1={olRX} y1={oy} x2={olRX} y2={oy+dh} stroke={AC} strokeWidth="1"/>);
  [oy,oy+dh].forEach(y=>{
    els.push(<line key={k()} x1={olRX-tick} y1={y} x2={olRX+tick} y2={y} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox+dw} y1={y} x2={olRX-tick} y2={y} stroke={AC} strokeWidth="0.4" strokeDasharray="3 3" opacity="0.35"/>);
  });
  const olRTX=olRX+14;
  els.push(<text key={k()} x={olRTX} y={oy+dh/2} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="500" transform={`rotate(90,${olRTX},${oy+dh/2})`}>{fmm(L)}</text>);

  // Left overall-L (secondary, dimmer) — lane 2 on left
  const olLX = ox - (showSubframe && !isVert ? 52 : 30);
  els.push(<line key={k()} x1={olLX} y1={oy} x2={olLX} y2={oy+dh} stroke={AC} strokeWidth="0.8" opacity="0.5"/>);
  [oy,oy+dh].forEach(y=>els.push(<line key={k()} x1={olLX-tick} y1={y} x2={olLX+tick} y2={y} stroke={AC} strokeWidth="0.8" opacity="0.5"/>));
  const olLTX=olLX-14;
  els.push(<text key={k()} x={olLTX} y={oy+dh/2} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="9" opacity="0.5" transform={`rotate(-90,${olLTX},${oy+dh/2})`}>{fmm(L)}</text>);

  // ── JOIST SPACING callouts
  if (joistPositions.length>1 && showSubframe) {
    if (!isVert) {
      const axJ = ox - 16;
      joistPositions.forEach((pos,i)=>{
        if (i===0) return;
        const prev=joistPositions[i-1], gap=pos-prev;
        const y1=oy+prev*scale, y2=oy+pos*scale, mid=(y1+y2)/2;
        els.push(<line key={k()} x1={axJ} y1={y1} x2={axJ} y2={y2} stroke={AJ} strokeWidth="0.7"/>);
        els.push(<line key={k()} x1={axJ-3} y1={y1} x2={axJ+3} y2={y1} stroke={AJ} strokeWidth="0.7"/>);
        els.push(<line key={k()} x1={axJ-3} y1={y2} x2={axJ+3} y2={y2} stroke={AJ} strokeWidth="0.7"/>);
        if ((y2-y1)>13) els.push(<text key={k()} x={axJ-5} y={mid+3.5} textAnchor="end" fontFamily="IBM Plex Mono" fontSize="7" fill={AJ}>{fmm(gap)}</text>);
      });
      els.push(<text key={k()} x={axJ-26} y={oy+dh/2} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="6" fill={AJ} letterSpacing="0.06em" transform={`rotate(-90,${axJ-26},${oy+dh/2})`}>JOIST c/c</text>);
    } else {
      const ayJ = oy - 18;
      joistPositions.forEach((pos,i)=>{
        if (i===0) return;
        const prev=joistPositions[i-1], gap=pos-prev;
        const x1=ox+prev*scale, x2=ox+pos*scale, mid=(x1+x2)/2;
        els.push(<line key={k()} x1={x1} y1={ayJ} x2={x2} y2={ayJ} stroke={AJ} strokeWidth="0.7"/>);
        [x1,x2].forEach(x=>els.push(<line key={k()} x1={x} y1={ayJ-3} x2={x} y2={ayJ+3} stroke={AJ} strokeWidth="0.7"/>));
        if ((x2-x1)>13) els.push(<text key={k()} x={mid} y={ayJ-5} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7" fill={AJ}>{fmm(gap)}</text>);
      });
      els.push(<text key={k()} x={ox+dw/2} y={ayJ-16} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="6" fill={AJ} letterSpacing="0.06em">JOIST c/c</text>);
    }
  }

  // ── BEAM SPACING callouts
  if (showSubframe && actualBeamSpacing>0) {
    const bs2=actualBeamSpacing*scale;
    if (!isVert) {
      const beamPos=[];
      for (let x=ox;x<=ox+dw+1;x+=bs2) beamPos.push(x);
      const ayB=oy+dh+16;
      beamPos.forEach((bx,i)=>{
        if (i===0) return;
        const prev=beamPos[i-1], mid=(prev+bx)/2;
        els.push(<line key={k()} x1={prev} y1={ayB} x2={bx} y2={ayB} stroke={AB} strokeWidth="0.7"/>);
        [prev,bx].forEach(x=>els.push(<line key={k()} x1={x} y1={ayB-3} x2={x} y2={ayB+3} stroke={AB} strokeWidth="0.7"/>));
        if ((bx-prev)>16) els.push(<text key={k()} x={mid} y={ayB+11} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7" fill={AB}>{fmm(actualBeamSpacing)}</text>);
      });
      els.push(<text key={k()} x={ox+dw/2} y={ayB+21} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="6" fill={AB} letterSpacing="0.06em">BEAM c/c</text>);
    } else {
      const beamPos=[];
      for (let y=oy;y<=oy+dh+1;y+=bs2) beamPos.push(y);
      const axB=ox+dw+18;
      beamPos.forEach((by,i)=>{
        if (i===0) return;
        const prev=beamPos[i-1], mid=(prev+by)/2;
        els.push(<line key={k()} x1={axB} y1={prev} x2={axB} y2={by} stroke={AB} strokeWidth="0.7"/>);
        [prev,by].forEach(y=>els.push(<line key={k()} x1={axB-3} y1={y} x2={axB+3} y2={y} stroke={AB} strokeWidth="0.7"/>));
        if ((by-prev)>16) els.push(<text key={k()} x={axB+5} y={mid+3.5} textAnchor="start" fontFamily="IBM Plex Mono" fontSize="7" fill={AB}>{fmm(actualBeamSpacing)}</text>);
      });
      els.push(<text key={k()} x={axB+24} y={oy+dh/2} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="6" fill={AB} letterSpacing="0.06em" transform={`rotate(90,${axB+24},${oy+dh/2})`}>BEAM c/c</text>);
    }
  }

  // ── North arrow (bottom-right of deck area)
  els.push(
    <g key={k()} transform={`translate(${ox+dw-20},${oy+dh+48})`}>
      <line x1="0" y1="9" x2="0" y2="-3" stroke="var(--text-dim)" strokeWidth="1"/>
      <polygon points="0,-8 -3,2 0,-0.5 3,2" fill="var(--text-dim)"/>
      <text x="8" y="4" fontFamily="IBM Plex Mono" fontSize="8" fill="var(--text-dim)">N</text>
    </g>
  );

  // ── Legend
  if (view==="BOTH") {
    const lx=ox, ly=oy+dh+50;
    const legItems=[
      {col:"#4A78B0",label:"Joists"},
      {col:"#3A8040",label:"Beams"},
      {col:"#1E3020",stroke:"#3A8040",label:"Posts"},
      ...(!isDIY?[{col:"#7A5CA0",label:"Noggins"}]:[]),
      ...(hasBorder?[{col:"rgba(200,160,60,0.35)",label:"Border"}]:[]),
    ];
    legItems.forEach((item,i)=>{
      const lxi=lx+i*68;
      if (item.stroke) els.push(<circle key={k()} cx={lxi+4} cy={ly} r={3.5} fill={item.col} stroke={item.stroke} strokeWidth="1"/>);
      else             els.push(<rect key={k()} x={lxi} y={ly-4} width={8} height={7} fill={item.col} rx="1"/>);
      els.push(<text key={k()} x={lxi+12} y={ly+3.5} fontFamily="IBM Plex Mono" fontSize="7.5" fill="var(--text-dim)">{item.label}</text>);
    });
  }

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{width:"100%",height:"100%"}}>
      <defs>
        <clipPath id="dc"><path d={clipD}/></clipPath>
        <pattern id="wg" x="0" y="0" width="4" height="40" patternUnits="userSpaceOnUse">
          <line x1="2" y1="0" x2="2" y2="40" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      {els}
    </svg>
  );
}

/* ─── CUTTING LIST ───────────────────────────────────────────────────────── */
function CuttingList({calc}) {
  if (!calc) return null;
  const {boards,borderBoardRows,joists,beams,posts,noggins,fascia,hardware,spec,area,hasBorder,userMode} = calc;
  const isPro = userMode==="pro";
  const sections=[
    { title:"DECKING BOARDS", color:"#C87840",
      rows:[
        {item:`Decking board  ${spec.boardW}×${spec.boardT}mm`,qty:boards.count,length:boards.length,note:`${boards.totalLineal}m total lineal`},
        ...(hasBorder?borderBoardRows.map(b=>({item:`Border board  ${spec.boardW}×${spec.boardT}mm`,qty:b.qty,length:b.length,note:b.label})):[]),
      ]
    },
    { title:"JOISTS & RIM JOISTS", color:"#4A78B0",
      rows:[
        {item:`Joist  ${spec.joistDepth}×${spec.joistThick}mm`,qty:joists.count,length:joists.span,note:`${hasBorder?"incl. border joists":""}` },
        {item:`Rim joist  ${spec.joistDepth}×${spec.joistThick}mm`,qty:2,length:joists.rimLen,note:"perimeter"},
        ...(isPro&&noggins.count>0?[{item:`Noggin  ${spec.joistDepth}×${spec.joistThick}mm`,qty:noggins.count,length:noggins.length,note:`@ ${fmm(spec.nogginSpacing)} c/c staggered`}]:[]),
      ]
    },
    { title:"BEAMS & POSTS", color:"#4A9050",
      rows:[
        {item:`Beam  ${spec.beamDepth}×${spec.beamThick}mm`,qty:beams.count,length:beams.length,note:`@ ${fmm(spec.postSpacing)} c/c`},
        {item:`Post  ${spec.postW}×${spec.postW}mm`,qty:posts.count,length:posts.height,note:"above ground height"},
      ]
    },
    { title:"FASCIA & TRIM", color:"#9A7840",
      rows:fascia.map(f=>({item:`Fascia  ${spec.joistDepth}×${spec.joistThick}mm`,qty:f.qty,length:Math.round(f.length),note:f.label}))
    },
  ];
  const hwRows=[
    {item:"Joist hangers (single)",          qty:hardware.joistHangers,    unit:"no."},
    {item:"Post bases / spikes",             qty:hardware.postBases,       unit:"no."},
    {item:"Rim joist brackets",              qty:hardware.rimJoistBrackets,unit:"no."},
    {item:`Decking screws (≈${hardware.screwsTotal})`,qty:hardware.screwsBoxes,unit:"boxes ×200"},
    {item:"Concrete (post footings)",        qty:hardware.concreteBags,    unit:"bags ×20kg"},
  ];
  return (
    <div style={{fontFamily:"var(--mono)"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"var(--border)",marginBottom:1}}>
        {[{label:"DECK AREA",val:`${area} m²`},{label:"TOTAL BOARDS",val:`${boards.count} pcs`},{label:"LINEAL METRES",val:`${boards.totalLineal} m`},{label:"TOTAL POSTS",val:`${posts.count} no.`}]
          .map((s,i)=>(
            <div key={i} style={{background:"var(--panel)",padding:"14px 18px"}}>
              <div style={{fontSize:"0.6rem",color:"var(--text-dim)",letterSpacing:"0.14em",marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:"1.15rem",color:"var(--timber)",fontWeight:600}}>{s.val}</div>
            </div>
          ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:"var(--border)"}}>
        {sections.map((sec,si)=>(
          <div key={si} style={{background:"var(--surface)"}}>
            <div style={{padding:"8px 16px",fontSize:"0.6rem",letterSpacing:"0.14em",color:sec.color,borderBottom:`2px solid ${sec.color}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{display:"block",width:8,height:8,borderRadius:2,background:sec.color}}/>{sec.title}
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["COMPONENT","QTY","LENGTH","NOTE"].map(h=>(
                <th key={h} style={{padding:"6px 12px",fontSize:"0.58rem",color:"var(--text-mute)",letterSpacing:"0.1em",textAlign:h==="QTY"?"center":"left",borderBottom:"1px solid var(--border)"}}>{h}</th>
              ))}</tr></thead>
              <tbody>{sec.rows.map((row,ri)=>(
                <tr key={ri} style={{borderBottom:"1px solid var(--border)"}}>
                  <td style={{padding:"9px 12px",fontSize:"0.78rem",color:"var(--text)"}}>{row.item}</td>
                  <td style={{padding:"9px 12px",fontSize:"0.9rem",color:sec.color,fontWeight:600,textAlign:"center"}}>{row.qty}</td>
                  <td style={{padding:"9px 12px",fontSize:"0.78rem",color:"var(--cream)"}}>{fmm(row.length)}</td>
                  <td style={{padding:"9px 12px",fontSize:"0.7rem",color:"var(--text-dim)"}}>{row.note}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </div>
      <div style={{background:"var(--surface)",marginTop:1}}>
        <div style={{padding:"8px 16px",fontSize:"0.6rem",letterSpacing:"0.14em",color:"var(--straw)",borderBottom:"2px solid var(--straw)",display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"block",width:8,height:8,borderRadius:2,background:"var(--straw)"}}/>FIXINGS & HARDWARE
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:0}}>
          {hwRows.map((h,i)=>(
            <div key={i} style={{padding:"12px 14px",borderRight:i<hwRows.length-1?"1px solid var(--border)":"none"}}>
              <div style={{fontSize:"0.68rem",color:"var(--text-dim)",marginBottom:6,lineHeight:1.4}}>{h.item}</div>
              <div style={{fontSize:"1.1rem",color:"var(--straw)",fontWeight:600}}>{h.qty}</div>
              <div style={{fontSize:"0.62rem",color:"var(--text-mute)",marginTop:2}}>{h.unit}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"10px 16px",fontSize:"0.68rem",color:"var(--text-dim)",background:"var(--panel)",borderTop:"1px solid var(--border)",lineHeight:1.7}}>
        ⚠ All quantities include 10% waste allowance. Post heights are above-ground — add min. 600mm for footing depth. Verify all structural members with a qualified engineer for elevated decks.
      </div>
    </div>
  );
}

/* ─── UI COMPONENTS ──────────────────────────────────────────────────────── */
function Field({label,value,onChange,min,max,unit,hint,small,locked,lockedReason}) {
  const isLocked=locked===true;
  return (
    <div style={{marginBottom:small?8:12,opacity:isLocked?0.52:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
        <label style={{fontSize:small?"0.68rem":"0.72rem",color:isLocked?"var(--locked-txt)":"var(--text-dim)",fontFamily:"var(--mono)",letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}>
          {label}{isLocked&&<span style={{fontSize:"0.55rem",color:"var(--locked-txt)"}}>— AUTO</span>}
        </label>
        {unit&&<span style={{fontSize:"0.62rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>{unit}</span>}
      </div>
      <input
        type="number"
        value={value}
        onChange={e=>!isLocked&&onChange(e.target.value)}
        readOnly={isLocked}
        min={min}
        max={max}
        style={{
          width:"100%",
          background:isLocked?"var(--locked)":"var(--bg)",
          border:`1px solid ${isLocked?"var(--border)":"var(--border2)"}`,
          borderRadius:4,
          padding:small?"5px 8px":"7px 10px",
          color:isLocked?"var(--locked-txt)":"var(--white)",
          fontFamily:"var(--mono)",
          fontSize:small?"0.85rem":"0.9rem",
          outline:"none",
          cursor:isLocked?"not-allowed":"text"
        }}
        onFocus={e=>{if(!isLocked)e.target.style.borderColor="var(--timber)";}}
        onBlur={e=>{e.target.style.borderColor=isLocked?"var(--border)":"var(--border2)";}}
      />
      {hint&&!isLocked&&<div style={{fontSize:"0.62rem",color:"var(--text-mute)",marginTop:3,fontFamily:"var(--mono)"}}>{hint}</div>}
      {isLocked&&lockedReason&&<div style={{fontSize:"0.60rem",color:"var(--locked-txt)",marginTop:3,fontFamily:"var(--mono)"}}>{lockedReason}</div>}
    </div>
  );
}

function PanelSection({title,children,accent="var(--timber)"}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:6,borderBottom:"1px solid var(--border)"}}>
        <span style={{display:"block",width:3,height:14,background:accent,borderRadius:2}}/>
        <span style={{fontFamily:"var(--mono)",fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--text-dim)"}}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function SegControl({options,value,onChange,accentMap}) {
  return (
    <div style={{display:"flex",background:"var(--bg)",borderRadius:6,padding:2,border:"1px solid var(--border)",gap:2}}>
      {options.map(o=>{
        const active=value===o.id, col=accentMap?.[o.id]||"var(--timber)";
        return <button key={o.id} onClick={()=>onChange(o.id)} style={{flex:1,padding:"5px 10px",borderRadius:4,border:"none",background:active?"var(--panel)":"transparent",color:active?col:"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.64rem",letterSpacing:"0.1em",cursor:"pointer",transition:"all 0.15s",fontWeight:active?600:400,boxShadow:active?`inset 0 0 0 1px ${col}40`:"none"}}>{o.label}</button>;
      })}
    </div>
  );
}

function Toggle({label,checked,onChange,accent="var(--timber)",sub}) {
  return (
    <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:10}}>
      <div onClick={()=>onChange(!checked)} style={{width:36,height:19,borderRadius:10,background:checked?accent:"var(--border2)",position:"relative",transition:"background 0.2s",flexShrink:0,cursor:"pointer",marginTop:1}}>
        <div style={{position:"absolute",top:2.5,left:checked?18:2.5,width:14,height:14,borderRadius:7,background:"white",transition:"left 0.18s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}}/>
      </div>
      <div>
        <span style={{fontFamily:"var(--mono)",fontSize:"0.69rem",color:checked?"var(--text)":"var(--text-dim)",display:"block"}}>{label}</span>
        {sub&&<span style={{fontFamily:"var(--mono)",fontSize:"0.58rem",color:"var(--text-mute)",display:"block",marginTop:2,lineHeight:1.4}}>{sub}</span>}
      </div>
    </label>
  );
}

function BuildingSidePicker({sides,onChange}) {
  const toggle=side=>onChange(sides.includes(side)?sides.filter(s=>s!==side):[...sides,side]);
  const btn=(side,label)=>{
    const on=sides.includes(side);
    return <button onClick={()=>toggle(side)} style={{padding:"5px 4px",border:`1px solid ${on?"#3A5870":"var(--border)"}`,borderRadius:4,background:on?"rgba(58,88,112,0.25)":"var(--bg)",color:on?"#5A88A8":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.6rem",cursor:"pointer",transition:"all 0.15s"}}>{label}</button>;
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"auto auto auto",gap:4}}>
      <div/>{btn("north","N — Top")}<div/>
      {btn("west","W — Left")}
      <div style={{background:"rgba(200,120,64,0.06)",border:"1px solid var(--border)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",padding:"6px 0",fontSize:"0.58rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>DECK</div>
      {btn("east","E — Right")}
      <div/>{btn("south","S — Bot")}<div/>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function DeckCalculator() {
  const [shape,    setShape]    = useState("rectangle");
  const [boardDir, setBoardDir] = useState("horizontal");
  const [view,     setView]     = useState("BOARDS");
  const [showList, setShowList] = useState(false);
  const [tab,      setTab]      = useState("dimensions");
  const [userMode, setUserMode] = useState("pro");
  const [specTier, setSpecTier] = useState("full");
  const [extras,   setExtras]   = useState({
    borderBoard:false,
    excludeBorderAtBuilding:false,
    buildingSides:[],
  });

  const [d,setD] = useState({
    width:"4800",length:"3600",
    cutW:"2000",cutL:"1500",cutPos:"right",cutOffset:"0", // cutPos: "left"|"right", cutOffset from that side
    cut2W:"1200",cut2L:"800",extPos:"left",extOffset:"0", // extPos: "left"|"right", extOffset from that side
    boardWidth:"150",boardThick:"28",boardGap:"5",
    joistDepth:"200",joistThick:"50",joistSpacing:"400",
    beamDepth:"200",beamThick:"75",
    postWidth:"100",postHeight:"200",postSpacing:"1800",
    nogginSpacing:"1200",
    waste:"10",
  });

  const set  = k=>v=>setD(p=>({...p,[k]:v}));
  const setEx= k=>v=>setExtras(p=>({...p,[k]:v}));
  const isDIY = userMode==="diy";

  const diySpec = isDIY?resolveDIYSpec(specTier,d.postHeight):null;
  const effectiveD = isDIY?{...d,boardGap:"5",...diySpec}:d;

  const result = useCallback(()=>{
    try { return calcDeck({...effectiveD,shape,boardDir,userMode,extras:isDIY?{borderBoard:false,buildingSides:[],excludeBorderAtBuilding:false}:extras}); }
    catch(e){console.error(e);return null;}
  },[effectiveD,shape,boardDir,userMode,extras,isDIY])();

  const fval = k=>{
    if (isDIY&&diySpec&&k in diySpec) return diySpec[k];
    if (isDIY&&k==="boardGap") return "5";
    return d[k];
  };
  const isLocked = k=>{
    if (!isDIY) return false;
    return ["boardGap","joistDepth","joistThick","joistSpacing","beamDepth","beamThick","postWidth","postSpacing"].includes(k);
  };
  const lockReason = k=>{
    if (!isDIY) return "";
    if (k==="boardGap") return "Fixed at 5mm in DIY mode";
    if (k==="joistSpacing") return specTier==="budget"?"Auto: 600mm (budget)":"Auto: 400mm (full)";
    if (["joistDepth","beamDepth"].includes(k)) return specTier==="budget"?"Auto: 100mm":"Auto: 150mm";
    if (k==="joistThick"||k==="beamThick") return "Auto: 50mm";
    if (k==="postWidth") return mm(d.postHeight)>500?"Auto: 100mm (h>500mm)":"Auto: 75mm";
    if (k==="postSpacing") return "Auto-calculated in DIY mode";
    return "";
  };

  const TABS=[
    {id:"dimensions",label:"SHAPE"},
    {id:"boards",    label:"BOARDS"},
    {id:"subframe",  label:"FRAME"},
    ...(!isDIY?[{id:"extras",label:"EXTRAS"}]:[]),
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
        minHeight: 0,

        /* tiny safety buffer for desktop rounding */
        paddingBottom: "0px",
      }}
    >
      <GlobalStyle/>

      {/* TOP BAR */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:48,background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:30,height:30,background:"var(--moss)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🌿</div>
          <span style={{fontFamily:"var(--mono)",fontSize:"0.78rem",color:"var(--cream)",letterSpacing:"0.08em"}}>LANDSCAPECALC</span>
          <span style={{color:"var(--border2)",fontSize:"0.8rem"}}>›</span>
          <span style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:"var(--timber)",letterSpacing:"0.06em"}}>DECK DESIGNER</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <SegControl options={[{id:"diy",label:"DIY"},{id:"pro",label:"PRO"}]} value={userMode} onChange={m=>{setUserMode(m);setTab("dimensions");}} accentMap={{diy:"var(--diy-col)",pro:"var(--pro-col)"}}/>
          <SegControl options={[{id:"full",label:"FULL"},{id:"budget",label:"BUDGET"}]} value={specTier} onChange={setSpecTier} accentMap={{full:"var(--full-col)",budget:"var(--budget-col)"}}/>
          <div style={{width:1,height:24,background:"var(--border)"}}/>
          <div style={{display:"flex",background:"var(--bg)",borderRadius:6,padding:2,border:"1px solid var(--border)",gap:2}}>
            {VIEWS.map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"4px 10px",borderRadius:4,border:"none",background:view===v?"var(--panel)":"transparent",color:view===v?"var(--cream)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.62rem",letterSpacing:"0.1em",cursor:"pointer",transition:"all 0.15s"}}>{v}</button>
            ))}
          </div>
          <button onClick={()=>setShowList(s=>!s)} style={{padding:"5px 14px",background:showList?"var(--timber)":"var(--panel)",border:`1px solid ${showList?"var(--timber)":"var(--border2)"}`,borderRadius:6,color:showList?"var(--bg)":"var(--text)",fontFamily:"var(--mono)",fontSize:"0.66rem",letterSpacing:"0.1em",cursor:"pointer",transition:"all 0.2s"}}>{showList?"▲ HIDE LIST":"▼ CUTTING LIST"}</button>
        </div>
      </div>

      {/* MAIN SPLIT */}
      {/* minHeight:0 is CRITICAL so nested scroll areas can shrink instead of being clipped */}
      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>

        {/* LEFT PANEL */}
        <div style={{width:292,flexShrink:0,background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          <div style={{display:"flex",background:"var(--bg)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 2px",border:"none",background:tab===t.id?"var(--surface)":"transparent",color:tab===t.id?"var(--timber)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.58rem",letterSpacing:"0.1em",cursor:"pointer",borderBottom:tab===t.id?"2px solid var(--timber)":"2px solid transparent",transition:"all 0.15s"}}>{t.label}</button>
            ))}
          </div>

          {/* This is your main scroll region on the left */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 14px",minHeight:0}}>

            {/* Mode badge */}
            <div style={{display:"flex",gap:6,padding:"5px 10px",background:"var(--panel)",borderRadius:5,border:"1px solid var(--border)",margin:"0 0 12px 0",alignItems:"center"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:"0.62rem",fontWeight:700,color:isDIY?"var(--diy-col)":"var(--pro-col)",letterSpacing:"0.08em"}}>{isDIY?"DIY":"PRO"}</span>
              <span style={{color:"var(--border2)"}}>·</span>
              <span style={{fontFamily:"var(--mono)",fontSize:"0.62rem",fontWeight:700,color:specTier==="full"?"var(--full-col)":"var(--budget-col)",letterSpacing:"0.08em"}}>{specTier==="full"?"FULL SPEC":"BUDGET"}</span>
              {isDIY&&<><span style={{color:"var(--border2)",marginLeft:2}}>·</span><span style={{fontFamily:"var(--mono)",fontSize:"0.57rem",color:"var(--text-mute)"}}>{specTier==="budget"?"100mm/600c/c":"150mm/400c/c"}</span></>}
            </div>

            {/* SHAPE TAB */}
            {tab==="dimensions"&&(
              <>
                <PanelSection title="Deck Shape">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:12}}>
                    {SHAPES.map(s=>(
                      <button key={s.id} onClick={()=>setShape(s.id)} style={{padding:"10px 8px",border:`1px solid ${shape===s.id?"var(--timber)":"var(--border)"}`,borderRadius:6,background:shape===s.id?"rgba(200,120,64,0.12)":"var(--bg)",color:shape===s.id?"var(--timber)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.68rem",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>
                        <div style={{fontSize:"1.2rem",marginBottom:2}}>{s.icon}</div>{s.label}
                      </button>
                    ))}
                  </div>
                </PanelSection>
                <PanelSection title="Overall Dimensions">
                  <Field label="Width"  value={d.width}  onChange={set("width")}  unit="mm" hint="measured house-outward"/>
                  <Field label="Length" value={d.length} onChange={set("length")} unit="mm"/>
                </PanelSection>
                {(shape==="l-shape"||shape==="u-shape")&&(
                  <PanelSection title="Cutout Dimensions" accent="var(--text-dim)">
                    <Field label="Cutout Width"  value={d.cutW} onChange={set("cutW")} unit="mm" small/>
                    <Field label="Cutout Length" value={d.cutL} onChange={set("cutL")} unit="mm" small/>
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:"0.68rem",color:"var(--text-dim)",fontFamily:"var(--mono)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>Position From</div>
                      <div style={{display:"flex",gap:4,marginBottom:8}}>
                        {[{id:"left",label:"← Left"},{id:"right",label:"Right →"}].map(pos=>(
                          <button key={pos.id} onClick={()=>set("cutPos")(pos.id)} style={{flex:1,padding:"8px 6px",border:`1px solid ${d.cutPos===pos.id?"var(--timber)":"var(--border)"}`,borderRadius:5,background:d.cutPos===pos.id?"rgba(200,120,64,0.12)":"var(--bg)",color:d.cutPos===pos.id?"var(--timber)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.68rem",cursor:"pointer",transition:"all 0.15s"}}>{pos.label}</button>
                        ))}
                      </div>
                      <Field label="Offset from Edge" value={d.cutOffset} onChange={set("cutOffset")} unit="mm" small hint="distance from selected side"/>
                    </div>
                  </PanelSection>
                )}
                {shape==="t-shape"&&(
                  <PanelSection title="Extension Dimensions" accent="var(--moss-lt)">
                    <Field label="Extension Width"  value={d.cut2W} onChange={set("cut2W")} unit="mm" small/>
                    <Field label="Extension Length" value={d.cut2L} onChange={set("cut2L")} unit="mm" small/>
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:"0.68rem",color:"var(--text-dim)",fontFamily:"var(--mono)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>Position From</div>
                      <div style={{display:"flex",gap:4,marginBottom:8}}>
                        {[{id:"left",label:"← Left"},{id:"right",label:"Right →"}].map(pos=>(
                          <button key={pos.id} onClick={()=>set("extPos")(pos.id)} style={{flex:1,padding:"8px 6px",border:`1px solid ${d.extPos===pos.id?"var(--moss-lt)":"var(--border)"}`,borderRadius:5,background:d.extPos===pos.id?"rgba(106,170,96,0.12)":"var(--bg)",color:d.extPos===pos.id?"var(--moss-lt)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.68rem",cursor:"pointer",transition:"all 0.15s"}}>{pos.label}</button>
                        ))}
                      </div>
                      <Field label="Offset from Edge" value={d.extOffset} onChange={set("extOffset")} unit="mm" small hint="distance from selected side"/>
                    </div>
                  </PanelSection>
                )}
                <PanelSection title="Board Direction">
                  {BOARD_DIRS.map(bd=>(
                    <label key={bd.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:4,cursor:"pointer",background:boardDir===bd.id?"rgba(200,120,64,0.1)":"transparent",marginBottom:3}}>
                      <input type="radio" name="boardDir" value={bd.id} checked={boardDir===bd.id} onChange={()=>setBoardDir(bd.id)} style={{accentColor:"var(--timber)",cursor:"pointer"}}/>
                      <span style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:boardDir===bd.id?"var(--timber)":"var(--text-dim)"}}>{bd.label}</span>
                    </label>
                  ))}
                </PanelSection>
                <PanelSection title="Waste Allowance">
                  <Field label="Waste %" value={d.waste} onChange={set("waste")} min={0} max={30} unit="%" hint="typically 10–15%"/>
                </PanelSection>
              </>
            )}

            {/* BOARDS TAB */}
            {tab==="boards"&&(
              <>
                <PanelSection title="Board Specification">
                  <Field label="Board Width"        value={d.boardWidth} onChange={set("boardWidth")} unit="mm" hint={!isDIY?"face width e.g. 90, 120, 150":undefined}/>
                  <Field label="Board Thickness"    value={d.boardThick} onChange={set("boardThick")} unit="mm" hint={!isDIY?"typically 28–32mm":undefined}/>
                  <Field label="Gap Between Boards" value={fval("boardGap")} onChange={set("boardGap")} unit="mm" hint={!isDIY?"min 5mm for drainage":undefined} locked={isLocked("boardGap")} lockedReason={lockReason("boardGap")}/>
                </PanelSection>
                {result&&(
                  <div style={{background:"rgba(200,120,64,0.08)",border:"1px solid rgba(200,120,64,0.2)",borderRadius:6,padding:"12px 14px",marginTop:8}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-dim)",marginBottom:8,letterSpacing:"0.1em"}}>LIVE PREVIEW</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[{l:"Boards",v:`${result.boards.count} pcs`},{l:"Each length",v:fmm(result.boards.length)},{l:"Pitch",v:fmm(result.pitch)},{l:"Lineal m",v:`${result.boards.totalLineal}m`}].map((it,i)=>(
                        <div key={i}><div style={{fontSize:"0.58rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>{it.l}</div><div style={{fontSize:"0.88rem",color:"var(--timber)",fontFamily:"var(--mono)",fontWeight:600}}>{it.v}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* FRAME TAB */}
            {tab==="subframe"&&(
              <>
                <PanelSection title="Joists" accent="#3A5880">
                  <Field label="Joist Depth"       value={fval("joistDepth")}   onChange={set("joistDepth")}   unit="mm" hint={!isDIY?"e.g. 150, 200mm":undefined} small locked={isLocked("joistDepth")}   lockedReason={lockReason("joistDepth")}/>
                  <Field label="Joist Thickness"   value={fval("joistThick")}   onChange={set("joistThick")}   unit="mm" small locked={isLocked("joistThick")}   lockedReason={lockReason("joistThick")}/>
                  <Field label="Joist Spacing c/c" value={fval("joistSpacing")} onChange={set("joistSpacing")} unit="mm" hint={!isDIY?"max 400mm for 28mm boards":undefined} small locked={isLocked("joistSpacing")} lockedReason={lockReason("joistSpacing")}/>
                </PanelSection>

                {/* Noggins — Pro only */}
                {!isDIY&&(
                  <PanelSection title="Noggins" accent="var(--noggin-col)">
                    <Field label="Noggin Spacing c/c" value={d.nogginSpacing} onChange={set("nogginSpacing")} unit="mm" hint="default 1200mm, staggered rows" small/>
                    {result&&result.noggins.count>0&&(
                      <div style={{marginTop:6,padding:"6px 10px",background:"rgba(122,92,160,0.08)",border:"1px solid rgba(122,92,160,0.2)",borderRadius:4,fontFamily:"var(--mono)",fontSize:"0.65rem",color:"var(--noggin-col)"}}>
                        {result.noggins.count} noggins · {fmm(result.noggins.length)} each · staggered
                      </div>
                    )}
                  </PanelSection>
                )}

                <PanelSection title="Beams" accent="#2E5032">
                  <Field label="Beam Depth"     value={fval("beamDepth")} onChange={set("beamDepth")} unit="mm" small locked={isLocked("beamDepth")} lockedReason={lockReason("beamDepth")}/>
                  <Field label="Beam Thickness" value={fval("beamThick")} onChange={set("beamThick")} unit="mm" small locked={isLocked("beamThick")} lockedReason={lockReason("beamThick")}/>
                </PanelSection>
                <PanelSection title="Posts">
                  <Field label="Post Section"            value={fval("postWidth")} onChange={set("postWidth")} unit="mm" hint={!isDIY?"typically 100×100mm":undefined} small locked={isLocked("postWidth")} lockedReason={lockReason("postWidth")}/>
                  <Field label="Post Height (above gnd)" value={d.postHeight} onChange={set("postHeight")} unit="mm" hint="add 600mm for footings" small/>
                  {!isDIY?(
                    <Field label="Post / Beam Spacing" value={d.postSpacing} onChange={set("postSpacing")} unit="mm" hint="max 1800–2400mm" small/>
                  ):(
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:"0.68rem",color:"var(--locked-txt)",fontFamily:"var(--mono)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                        <span>Beam Spacing <span style={{fontSize:"0.55rem"}}>— AUTO</span></span>
                        <span style={{fontFamily:"var(--mono)",fontSize:"0.62rem",color:"var(--text-mute)"}}>mm</span>
                      </div>
                      <div style={{background:"var(--locked)",border:"1px solid var(--border)",borderRadius:4,padding:"7px 10px",fontFamily:"var(--mono)",fontSize:"0.85rem",color:"var(--locked-txt)",cursor:"not-allowed"}}>{result?result.actualBeamSpacing:"—"}</div>
                      <div style={{fontSize:"0.60rem",color:"var(--locked-txt)",marginTop:3,fontFamily:"var(--mono)"}}>Equal spacings, target ~1500mm, max 1800mm</div>
                    </div>
                  )}
                </PanelSection>
                {result&&(
                  <div style={{background:"rgba(74,120,64,0.08)",border:"1px solid rgba(74,120,64,0.2)",borderRadius:6,padding:"12px 14px"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-dim)",marginBottom:8,letterSpacing:"0.1em"}}>SUBFRAME SUMMARY</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[
                        {l:"Joists",v:`${result.joists.count} pcs`},
                        {l:"Beams",v:`${result.beams.count} pcs`},
                        {l:"Posts",v:`${result.posts.count} no.`},
                        {l:"Beam @ c/c",v:fmm(result.actualBeamSpacing)},
                        ...(!isDIY&&result.noggins.count>0?[{l:"Noggins",v:`${result.noggins.count} pcs`}]:[]),
                      ].map((it,i)=>(
                        <div key={i}><div style={{fontSize:"0.58rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>{it.l}</div><div style={{fontSize:"0.88rem",color:"var(--moss-lt)",fontFamily:"var(--mono)",fontWeight:600}}>{it.v}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* EXTRAS TAB — Pro only */}
            {tab==="extras"&&!isDIY&&(
              <>
                <PanelSection title="Border Board" accent="var(--border-col)">
                  <Toggle
                    label="Add perimeter border board"
                    sub="Adds a single run of deck boards around the perimeter, supported by a joist at the inset position."
                    checked={extras.borderBoard}
                    onChange={v=>setEx("borderBoard")(v)}
                    accent="var(--border-col)"
                  />
                  {extras.borderBoard&&extras.buildingSides.length>0&&(
                    <Toggle
                      label="Exclude border on building sides"
                      sub="When on, border boards and their joists are omitted on sides with an adjacent building."
                      checked={extras.excludeBorderAtBuilding}
                      onChange={v=>setEx("excludeBorderAtBuilding")(v)}
                      accent="var(--building)"
                    />
                  )}
                </PanelSection>

                <PanelSection title="Adjacent Buildings" accent="var(--building)">
                  <p style={{fontFamily:"var(--mono)",fontSize:"0.63rem",color:"var(--text-dim)",lineHeight:1.6,marginBottom:10}}>
                    Select sides that adjoin a building or wall. Shown as hatched walls on the plan.
                  </p>
                  <BuildingSidePicker sides={extras.buildingSides} onChange={v=>setEx("buildingSides")(v)}/>
                  {extras.buildingSides.length>0&&(
                    <div style={{marginTop:8,padding:"6px 10px",background:"rgba(58,88,112,0.12)",border:"1px solid rgba(58,88,112,0.25)",borderRadius:5,fontFamily:"var(--mono)",fontSize:"0.62rem",color:"#5A88A8"}}>
                      Building on: {extras.buildingSides.map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(", ")}
                    </div>
                  )}
                </PanelSection>
              </>
            )}
          </div>

          {/* Status bar */}
          <div style={{padding:"8px 14px",background:"var(--bg)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <span style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:result?"var(--moss-lt)":"var(--text-mute)",letterSpacing:"0.1em"}}>
              {result?`● ${result.area} m² CALCULATED`:"○ AWAITING INPUT"}
            </span>
            <span style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-dim)"}}>
              {userMode.toUpperCase()} · {specTier.toUpperCase()} · {shape.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RIGHT — PLAN + CUTTING LIST */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          <div
            style={{
              flex: showList ? "0 0 55%" : "1 1 auto",
              background:"var(--bg)",
              position:"relative",
              overflow:"hidden",
              transition:"flex 0.3s ease",
              minHeight:0
            }}
          >
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
              <defs>
                <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0L0 0 0 20" fill="none" stroke="rgba(42,48,56,0.5)" strokeWidth="0.5"/></pattern>
                <pattern id="lg" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#sg)"/><path d="M100 0L0 0 0 100" fill="none" stroke="rgba(42,48,56,0.9)" strokeWidth="1"/></pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#lg)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <DeckPlan calc={result} view={view} shape={shape} boardDir={boardDir}/>
            </div>
            <div style={{position:"absolute",top:14,right:14,fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-mute)",letterSpacing:"0.14em",background:"rgba(14,16,18,0.7)",padding:"4px 10px",borderRadius:4,backdropFilter:"blur(4px)"}}>
              {view==="BOARDS"?"TOP DOWN — DECKING BOARDS":view==="SUBFRAME"?"TOP DOWN — SUBFRAME":"TOP DOWN — COMPOSITE"}
            </div>
            <div style={{position:"absolute",top:14,left:14,fontFamily:"var(--mono)",fontSize:"0.58rem",letterSpacing:"0.1em",background:"rgba(14,16,18,0.75)",padding:"4px 10px",borderRadius:4,display:"flex",gap:8,alignItems:"center",backdropFilter:"blur(4px)"}}>
              <span style={{color:isDIY?"var(--diy-col)":"var(--pro-col)",fontWeight:700}}>{isDIY?"DIY":"PRO"}</span>
              <span style={{color:"var(--border2)"}}>·</span>
              <span style={{color:specTier==="full"?"var(--full-col)":"var(--budget-col)",fontWeight:700}}>{specTier.toUpperCase()}</span>
              {result?.hasBorder&&<><span style={{color:"var(--border2)"}}>·</span><span style={{color:"#A09040"}}>BORDER</span></>}
              {!isDIY&&<><span style={{color:"var(--border2)"}}>·</span><span style={{color:"var(--noggin-col)"}}>NOGGINS</span></>}
            </div>
            {result&&<div style={{position:"absolute",bottom:14,right:14,fontFamily:"var(--mono)",fontSize:"0.58rem",color:"var(--text-mute)",letterSpacing:"0.1em",background:"rgba(14,16,18,0.7)",padding:"4px 10px",borderRadius:4}}>{result.W}×{result.L}mm</div>}
          </div>

          {showList&&(
            <div style={{flex:"1 1 45%",overflowY:"auto",borderTop:"1px solid var(--border)",minHeight:0}}>
              <CuttingList calc={result}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}