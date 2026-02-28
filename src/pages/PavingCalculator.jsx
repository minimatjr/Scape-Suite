import { useState, useCallback } from "react";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#0E1012; --surface:#161A1D; --panel:#1C2126;
      --border:#2A3038; --border2:#323C46;
      --text:#C8CDD4; --text-dim:#5A6472; --text-mute:#3A4450;
      --stone:#8A9AA8; --stone-lt:#A8B8C8; --stone-dk:#5A6A78;
      --sand:#C8A868; --sand-lt:#E0C080; --cement:#7A8898;
      --cream:#E8DCC8; --white:#F2EEE6;
      --locked:#232C34; --locked-txt:#3A4A58;
      --subbase-col:#6A8A5A; --mortar-col:#B89060;
      --mono:'IBM Plex Mono',monospace; --sans:'IBM Plex Sans',sans-serif;
    }
    body { font-family:var(--sans); background:var(--bg); color:var(--text); min-height:100vh; overflow:hidden; }
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
    select{-webkit-appearance:none;-moz-appearance:none;appearance:none}
  `}</style>
);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const SHAPES = [
  {id:"rectangle",label:"Rectangle",icon:"▬"},
  {id:"l-shape",label:"L-Shape",icon:"⌐"},
  {id:"t-shape",label:"T-Shape",icon:"⊤"},
  {id:"circle",label:"Circle",icon:"●"},
  {id:"semicircle",label:"Semi-Circle",icon:"◗"},
  {id:"quarter",label:"Quarter Circle",icon:"◔"},
];

const PAVING_TYPES = [
  {id:"slabs",label:"Paving Slabs"},
  {id:"blocks",label:"Block Paving"},
  {id:"natural",label:"Natural Stone"},
];

const MIX_RATIOS = [
  {id:"4:1",label:"4:1 (Standard)",sand:4,cement:1,desc:"General purpose patio laying"},
  {id:"3:1",label:"3:1 (Strong)",sand:3,cement:1,desc:"Heavy traffic or large slabs"},
  {id:"5:1",label:"5:1 (Lean)",sand:5,cement:1,desc:"Bedding layer for blocks"},
  {id:"6:1",label:"6:1 (Weak)",sand:6,cement:1,desc:"Brushing mix for block joints"},
];

const SUBBASE_TYPES = [
  {id:"type1",label:"MOT Type 1",density:2.1,desc:"Crushed limestone/granite"},
  {id:"scalpings",label:"Scalpings",density:1.8,desc:"Quarry waste material"},
  {id:"hardcore",label:"Hardcore",density:1.9,desc:"Recycled crusite"},
];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const mm  = v => parseFloat(v)||0;
const r2  = n => Math.round(n*100)/100;
const r3  = n => Math.round(n*1000)/1000;
const fmm = v => v>=1000?`${r2(v/1000).toFixed(2)}m`:`${Math.round(v)}mm`;

/* ─── CALCULATION ENGINE ─────────────────────────────────────────────────── */
function calcPaving(s) {
  const W=mm(s.width), L=mm(s.length), R=mm(s.radius);
  if (s.shape==="circle"||s.shape==="semicircle"||s.shape==="quarter") {
    if (!R) return null;
  } else if (!W||!L) return null;

  const cW=mm(s.cutW), cL=mm(s.cutL), c2W=mm(s.cut2W), c2L=mm(s.cut2L);

  // Calculate area in mm²
  let area = 0;
  if (s.shape==="rectangle") area = W*L;
  else if (s.shape==="l-shape") area = W*L - cW*cL;
  else if (s.shape==="t-shape") area = W*L + c2W*c2L;
  else if (s.shape==="circle") area = Math.PI*R*R;
  else if (s.shape==="semicircle") area = (Math.PI*R*R)/2;
  else if (s.shape==="quarter") area = (Math.PI*R*R)/4;

  const areaM2 = area/1e6; // Convert to m²
  const waste = 1 + mm(s.waste)/100;

  // Paving calculations
  const slabW = mm(s.slabWidth);
  const slabL = mm(s.slabLength);
  const jointW = mm(s.jointWidth);
  
  const slabPitch = (slabW + jointW) * (slabL + jointW);
  const slabsNeeded = slabPitch > 0 ? Math.ceil((area / slabPitch) * waste) : 0;
  const slabAreaEach = (slabW * slabL) / 1e6;
  const totalSlabArea = r2(slabsNeeded * slabAreaEach);

  // Mortar bed calculations
  const bedDepth = mm(s.bedDepth); // mm
  const bedVolume = (area * bedDepth) / 1e9; // m³
  const mixRatio = MIX_RATIOS.find(m=>m.id===s.mixRatio) || MIX_RATIOS[0];
  const totalParts = mixRatio.sand + mixRatio.cement;
  
  // Sand: 1m³ ≈ 1.6 tonnes (sharp sand)
  // Cement: 25kg bags, ~1440kg/m³
  const sandVolume = bedVolume * (mixRatio.sand / totalParts);
  const cementVolume = bedVolume * (mixRatio.cement / totalParts);
  const sandTonnes = r3(sandVolume * 1.6 * waste);
  const cementKg = r2(cementVolume * 1440 * waste);
  const cementBags = Math.ceil(cementKg / 25);

  // Sub-base calculations
  const subbaseDepth = mm(s.subbaseDepth); // mm
  const subbaseType = SUBBASE_TYPES.find(t=>t.id===s.subbaseType) || SUBBASE_TYPES[0];
  const subbaseVolume = (area * subbaseDepth) / 1e9; // m³
  const subbaseTonnes = r3(subbaseVolume * subbaseType.density * waste);

  // Jointing sand (for blocks) or pointing mortar
  const jointVolume = (area * jointW * mm(s.slabThick||20)) / (slabPitch || 1) / 1e9;
  const jointingSandKg = r2(jointVolume * 1600 * waste);

  // Membrane
  const membraneM2 = r2(areaM2 * 1.1); // 10% overlap

  return {
    area: r2(areaM2),
    areaWithWaste: r2(areaM2 * waste),
    W, L, R, cW, cL, c2W, c2L,
    shape: s.shape,
    slabs: {
      count: slabsNeeded,
      width: slabW,
      length: slabL,
      thickness: mm(s.slabThick),
      jointWidth: jointW,
      totalArea: totalSlabArea,
    },
    mortar: {
      depth: bedDepth,
      volume: r3(bedVolume),
      mixRatio: mixRatio,
      sandTonnes,
      cementKg,
      cementBags,
    },
    subbase: {
      type: subbaseType,
      depth: subbaseDepth,
      volume: r3(subbaseVolume),
      tonnes: subbaseTonnes,
    },
    jointing: {
      sandKg: jointingSandKg,
    },
    membrane: {
      m2: membraneM2,
    },
    waste: mm(s.waste),
  };
}

/* ─── SVG PLAN ───────────────────────────────────────────────────────────── */
function PavingPlan({calc}) {
  if (!calc) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:16}}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="8" width="48" height="48" rx="4" stroke="#2A3038" strokeWidth="2" strokeDasharray="6 4"/>
        <path d="M20 32h24M32 20v24" stroke="#3A4450" strokeWidth="1.5"/>
      </svg>
      <span style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:"var(--text-mute)",letterSpacing:"0.1em"}}>ENTER DIMENSIONS TO GENERATE PLAN</span>
    </div>
  );

  const {W,L,R,cW,cL,c2W,c2L,shape,slabs} = calc;

  const PAD_L=60, PAD_R=60, PAD_T=50, PAD_B=50;
  const SVG_W=700, SVG_H=500;
  const drawW=SVG_W-PAD_L-PAD_R;
  const drawH=SVG_H-PAD_T-PAD_B;
  
  let maxDim;
  if (shape==="circle"||shape==="semicircle"||shape==="quarter") {
    maxDim = R*2;
  } else {
    maxDim = Math.max(W,L);
  }
  
  const scale = Math.min(drawW/maxDim, drawH/maxDim) * 0.85;
  
  let dw, dh;
  if (shape==="circle") { dw=R*2*scale; dh=R*2*scale; }
  else if (shape==="semicircle") { dw=R*2*scale; dh=R*scale; }
  else if (shape==="quarter") { dw=R*scale; dh=R*scale; }
  else { dw=W*scale; dh=L*scale; }
  
  const ox=PAD_L+(drawW-dw)/2;
  const oy=PAD_T+(drawH-dh)/2;

  const els=[]; let ki=0; const k=()=>`e${ki++}`;
  const AC="#8A9AA8";

  // Draw shape
  if (shape==="rectangle") {
    els.push(<rect key={k()} x={ox} y={oy} width={dw} height={dh} fill="#4A5A68" stroke={AC} strokeWidth="2"/>);
  } else if (shape==="l-shape") {
    const cw=cW*scale, ch=cL*scale;
    els.push(<path key={k()} d={`M${ox},${oy} h${dw} v${dh-ch} h${-cw} v${ch} h${-(dw-cw)}Z`} fill="#4A5A68" stroke={AC} strokeWidth="2"/>);
  } else if (shape==="t-shape") {
    const ew=c2W*scale, eh=c2L*scale;
    els.push(<path key={k()} d={`M${ox},${oy} h${dw} v${dh} h${-(dw-ew)/2} v${eh} h${-ew} v${-eh} h${-(dw-ew)/2}Z`} fill="#4A5A68" stroke={AC} strokeWidth="2"/>);
  } else if (shape==="circle") {
    els.push(<circle key={k()} cx={ox+dw/2} cy={oy+dh/2} r={dw/2} fill="#4A5A68" stroke={AC} strokeWidth="2"/>);
  } else if (shape==="semicircle") {
    els.push(<path key={k()} d={`M${ox},${oy+dh} a${dw/2},${dh} 0 0,1 ${dw},0 Z`} fill="#4A5A68" stroke={AC} strokeWidth="2"/>);
  } else if (shape==="quarter") {
    els.push(<path key={k()} d={`M${ox},${oy+dh} v${-dh} a${dw},${dh} 0 0,1 ${dw},${dh} Z`} fill="#4A5A68" stroke={AC} strokeWidth="2"/>);
  }

  // Draw paving pattern overlay
  if (slabs.width > 0 && slabs.length > 0) {
    const sw = slabs.width * scale;
    const sl = slabs.length * scale;
    const jw = slabs.jointWidth * scale;
    
    // Clip path for the shape
    let clipId = "pavingClip";
    let clipPath;
    if (shape==="rectangle") {
      clipPath = <rect x={ox} y={oy} width={dw} height={dh}/>;
    } else if (shape==="l-shape") {
      const cw=cW*scale, ch=cL*scale;
      clipPath = <path d={`M${ox},${oy} h${dw} v${dh-ch} h${-cw} v${ch} h${-(dw-cw)}Z`}/>;
    } else if (shape==="t-shape") {
      const ew=c2W*scale, eh=c2L*scale;
      clipPath = <path d={`M${ox},${oy} h${dw} v${dh} h${-(dw-ew)/2} v${eh} h${-ew} v${-eh} h${-(dw-ew)/2}Z`}/>;
    } else if (shape==="circle") {
      clipPath = <circle cx={ox+dw/2} cy={oy+dh/2} r={dw/2}/>;
    } else if (shape==="semicircle") {
      clipPath = <path d={`M${ox},${oy+dh} a${dw/2},${dh} 0 0,1 ${dw},0 Z`}/>;
    } else if (shape==="quarter") {
      clipPath = <path d={`M${ox},${oy+dh} v${-dh} a${dw},${dh} 0 0,1 ${dw},${dh} Z`}/>;
    }

    els.push(
      <defs key={k()}>
        <clipPath id={clipId}>{clipPath}</clipPath>
      </defs>
    );

    // Draw grid pattern
    const extentX = shape==="circle" ? ox+dw : shape==="semicircle" ? ox+dw : ox+dw+sw;
    const extentY = shape==="circle" ? oy+dh : shape==="semicircle" ? oy+dh : shape==="t-shape" ? oy+dh+(c2L*scale)+sl : oy+dh+sl;
    
    for (let x=ox; x<extentX; x+=sw+jw) {
      for (let y=oy; y<extentY; y+=sl+jw) {
        els.push(
          <rect 
            key={k()} 
            x={x} y={y} 
            width={sw} height={sl} 
            fill="#5A6A78" 
            stroke="#3A4A58" 
            strokeWidth="0.5"
            clipPath={`url(#${clipId})`}
          />
        );
      }
    }
  }

  // Dimension annotations
  const tick = 4;
  
  if (shape==="circle") {
    // Diameter line
    els.push(<line key={k()} x1={ox} y1={oy+dh/2} x2={ox+dw} y2={oy+dh/2} stroke={AC} strokeWidth="1" strokeDasharray="4 2"/>);
    els.push(<text key={k()} x={ox+dw/2} y={oy+dh/2-8} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="500">⌀ {fmm(R*2)}</text>);
    // Radius annotation
    els.push(<line key={k()} x1={ox+dw/2} y1={oy+dh/2} x2={ox+dw} y2={oy+dh/2} stroke="#C8A868" strokeWidth="1.5"/>);
    els.push(<text key={k()} x={ox+dw*0.75} y={oy+dh/2+14} textAnchor="middle" fill="#C8A868" fontFamily="IBM Plex Mono" fontSize="9">r = {fmm(R)}</text>);
  } else if (shape==="semicircle") {
    els.push(<line key={k()} x1={ox} y1={oy+dh+20} x2={ox+dw} y2={oy+dh+20} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox} y1={oy+dh+20-tick} x2={ox} y2={oy+dh+20+tick} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox+dw} y1={oy+dh+20-tick} x2={ox+dw} y2={oy+dh+20+tick} stroke={AC} strokeWidth="1"/>);
    els.push(<text key={k()} x={ox+dw/2} y={oy+dh+34} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="500">{fmm(R*2)}</text>);
  } else if (shape==="quarter") {
    els.push(<line key={k()} x1={ox} y1={oy+dh+20} x2={ox+dw} y2={oy+dh+20} stroke={AC} strokeWidth="1"/>);
    els.push(<text key={k()} x={ox+dw/2} y={oy+dh+34} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10">{fmm(R)}</text>);
    els.push(<line key={k()} x1={ox-20} y1={oy} x2={ox-20} y2={oy+dh} stroke={AC} strokeWidth="1"/>);
    els.push(<text key={k()} x={ox-30} y={oy+dh/2} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" transform={`rotate(-90,${ox-30},${oy+dh/2})`}>{fmm(R)}</text>);
  } else {
    // Width dimension (top)
    els.push(<line key={k()} x1={ox} y1={oy-20} x2={ox+dw} y2={oy-20} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox} y1={oy-20-tick} x2={ox} y2={oy-20+tick} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox+dw} y1={oy-20-tick} x2={ox+dw} y2={oy-20+tick} stroke={AC} strokeWidth="1"/>);
    els.push(<text key={k()} x={ox+dw/2} y={oy-26} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="500">{fmm(W)}</text>);
    
    // Length dimension (right)
    els.push(<line key={k()} x1={ox+dw+20} y1={oy} x2={ox+dw+20} y2={oy+dh} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox+dw+20-tick} y1={oy} x2={ox+dw+20+tick} y2={oy} stroke={AC} strokeWidth="1"/>);
    els.push(<line key={k()} x1={ox+dw+20-tick} y1={oy+dh} x2={ox+dw+20+tick} y2={oy+dh} stroke={AC} strokeWidth="1"/>);
    els.push(<text key={k()} x={ox+dw+32} y={oy+dh/2} textAnchor="middle" fill={AC} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="500" transform={`rotate(90,${ox+dw+32},${oy+dh/2})`}>{fmm(L)}</text>);
  }

  // Cutout dimensions for L and T shapes
  if (shape==="l-shape" && cW && cL) {
    const cw=cW*scale, ch=cL*scale;
    els.push(<rect key={k()} x={ox+dw-cw} y={oy+dh-ch} width={cw} height={ch} fill="var(--bg)" stroke="var(--border2)" strokeWidth="1" strokeDasharray="4 3"/>);
    els.push(<text key={k()} x={ox+dw-cw/2} y={oy+dh-ch/2} textAnchor="middle" fill="var(--text-mute)" fontFamily="IBM Plex Mono" fontSize="8">{fmm(cW)}×{fmm(cL)}</text>);
  }
  if (shape==="t-shape" && c2W && c2L) {
    const ew=c2W*scale, eh=c2L*scale;
    els.push(<text key={k()} x={ox+dw/2} y={oy+dh+eh/2+8} textAnchor="middle" fill="var(--subbase-col)" fontFamily="IBM Plex Mono" fontSize="8">+{fmm(c2W)}×{fmm(c2L)}</text>);
  }

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{width:"100%",height:"100%"}}>
      <defs>
        <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="none"/>
          <circle cx="10" cy="10" r="0.5" fill="#3A4450"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pg)" opacity="0.5"/>
      {els}
    </svg>
  );
}

/* ─── MATERIALS LIST ─────────────────────────────────────────────────────── */
function MaterialsList({calc}) {
  if (!calc) return null;
  const {area,slabs,mortar,subbase,jointing,membrane,waste} = calc;
  
  const sections = [
    { title:"PAVING", color:"#8A9AA8",
      rows:[
        {item:`Paving ${slabs.width}×${slabs.length}×${slabs.thickness}mm`,qty:slabs.count,unit:"slabs",note:`${slabs.totalArea}m² coverage`},
      ]
    },
    { title:"MORTAR BED", color:"#B89060",
      rows:[
        {item:`Sharp sand`,qty:mortar.sandTonnes,unit:"tonnes",note:`${mortar.mixRatio.id} mix`},
        {item:`Cement (25kg bags)`,qty:mortar.cementBags,unit:"bags",note:`${mortar.cementKg}kg total`},
      ]
    },
    { title:"SUB-BASE", color:"#6A8A5A",
      rows:[
        {item:`${subbase.type.label}`,qty:subbase.tonnes,unit:"tonnes",note:`${subbase.depth}mm depth`},
      ]
    },
    { title:"SUNDRIES", color:"#7A8898",
      rows:[
        {item:`Jointing sand`,qty:Math.ceil(jointing.sandKg),unit:"kg",note:"for joints"},
        {item:`Weed membrane`,qty:membrane.m2,unit:"m²",note:"10% overlap inc."},
      ]
    },
  ];

  return (
    <div style={{fontFamily:"var(--mono)"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"var(--border)",marginBottom:1}}>
        {[
          {label:"PATIO AREA",val:`${area} m²`},
          {label:"TOTAL SLABS",val:`${slabs.count} pcs`},
          {label:"SUB-BASE",val:`${subbase.tonnes} t`},
          {label:"MORTAR VOL",val:`${mortar.volume} m³`}
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--panel)",padding:"14px 18px"}}>
            <div style={{fontSize:"0.6rem",color:"var(--text-dim)",letterSpacing:"0.14em",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:"1.15rem",color:"var(--stone)",fontWeight:600}}>{s.val}</div>
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
              <thead><tr>{["MATERIAL","QTY","UNIT","NOTE"].map(h=>(
                <th key={h} style={{padding:"6px 12px",fontSize:"0.58rem",color:"var(--text-mute)",letterSpacing:"0.1em",textAlign:h==="QTY"?"center":"left",borderBottom:"1px solid var(--border)"}}>{h}</th>
              ))}</tr></thead>
              <tbody>{sec.rows.map((row,ri)=>(
                <tr key={ri} style={{borderBottom:"1px solid var(--border)"}}>
                  <td style={{padding:"9px 12px",fontSize:"0.78rem",color:"var(--text)"}}>{row.item}</td>
                  <td style={{padding:"9px 12px",fontSize:"0.9rem",color:sec.color,fontWeight:600,textAlign:"center"}}>{row.qty}</td>
                  <td style={{padding:"9px 12px",fontSize:"0.78rem",color:"var(--cream)"}}>{row.unit}</td>
                  <td style={{padding:"9px 12px",fontSize:"0.7rem",color:"var(--text-dim)"}}>{row.note}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 16px",fontSize:"0.68rem",color:"var(--text-dim)",background:"var(--panel)",borderTop:"1px solid var(--border)",lineHeight:1.7}}>
        ⚠ All quantities include {waste}% waste allowance. Sub-base tonnage based on {subbase.type.density} t/m³ density. Verify excavation depth allows for sub-base + mortar bed + paving thickness.
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
      <input type="number" value={value} onChange={e=>!isLocked&&onChange(e.target.value)} readOnly={isLocked} min={min} max={max}
        style={{width:"100%",background:isLocked?"var(--locked)":"var(--bg)",border:`1px solid ${isLocked?"var(--border)":"var(--border2)"}`,borderRadius:4,padding:small?"5px 8px":"7px 10px",color:isLocked?"var(--locked-txt)":"var(--white)",fontFamily:"var(--mono)",fontSize:small?"0.85rem":"0.9rem",outline:"none",cursor:isLocked?"not-allowed":"text"}}
        onFocus={e=>{if(!isLocked)e.target.style.borderColor="var(--stone)";}}
        onBlur={e=>{e.target.style.borderColor=isLocked?"var(--border)":"var(--border2)";}}
      />
      {hint&&!isLocked&&<div style={{fontSize:"0.62rem",color:"var(--text-mute)",marginTop:3,fontFamily:"var(--mono)"}}>{hint}</div>}
      {isLocked&&lockedReason&&<div style={{fontSize:"0.60rem",color:"var(--locked-txt)",marginTop:3,fontFamily:"var(--mono)"}}>{lockedReason}</div>}
    </div>
  );
}

function SelectField({label,value,onChange,options,hint}) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
        <label style={{fontSize:"0.72rem",color:"var(--text-dim)",fontFamily:"var(--mono)",letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</label>
      </div>
      <div style={{position:"relative"}}>
        <select value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:4,padding:"7px 30px 7px 10px",color:"var(--white)",fontFamily:"var(--mono)",fontSize:"0.9rem",outline:"none",cursor:"pointer"}}>
          {options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"var(--text-dim)",fontSize:"0.7rem"}}>▼</span>
      </div>
      {hint&&<div style={{fontSize:"0.62rem",color:"var(--text-mute)",marginTop:3,fontFamily:"var(--mono)"}}>{hint}</div>}
    </div>
  );
}

function PanelSection({title,children,accent="var(--stone)"}) {
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

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function PavingCalculator() {
  const [shape, setShape] = useState("rectangle");
  const [showList, setShowList] = useState(false);
  const [tab, setTab] = useState("dimensions");

  const [d, setD] = useState({
    width:"4000", length:"3000", radius:"2000",
    cutW:"1500", cutL:"1200", cut2W:"1000", cut2L:"800",
    slabWidth:"600", slabLength:"600", slabThick:"35", jointWidth:"10",
    bedDepth:"30",
    mixRatio:"4:1",
    subbaseDepth:"100",
    subbaseType:"type1",
    waste:"10",
  });

  const set = k=>v=>setD(p=>({...p,[k]:v}));

  const result = useCallback(()=>{
    try { return calcPaving({...d, shape}); }
    catch(e){console.error(e);return null;}
  },[d, shape])();

  const TABS=[
    {id:"dimensions",label:"SHAPE"},
    {id:"paving",label:"PAVING"},
    {id:"materials",label:"MATERIALS"},
  ];

  const isCircular = shape==="circle"||shape==="semicircle"||shape==="quarter";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - var(--nav-height, 0px))",background:"var(--bg)",overflow:"hidden"}}>
      <GlobalStyle/>

      {/* TOP BAR */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:48,background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:30,height:30,background:"var(--stone-dk)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🪨</div>
          <span style={{fontFamily:"var(--mono)",fontSize:"0.78rem",color:"var(--cream)",letterSpacing:"0.08em"}}>LANDSCAPECALC</span>
          <span style={{color:"var(--border2)",fontSize:"0.8rem"}}>›</span>
          <span style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:"var(--stone)",letterSpacing:"0.06em"}}>PAVING CALCULATOR</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setShowList(s=>!s)} style={{padding:"5px 14px",background:showList?"var(--stone)":"var(--panel)",border:`1px solid ${showList?"var(--stone)":"var(--border2)"}`,borderRadius:6,color:showList?"var(--bg)":"var(--text)",fontFamily:"var(--mono)",fontSize:"0.66rem",letterSpacing:"0.1em",cursor:"pointer",transition:"all 0.2s"}}>{showList?"▲ HIDE LIST":"▼ MATERIALS LIST"}</button>
        </div>
      </div>

      {/* MAIN SPLIT */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* LEFT PANEL */}
        <div style={{width:292,flexShrink:0,background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",background:"var(--bg)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 2px",border:"none",background:tab===t.id?"var(--surface)":"transparent",color:tab===t.id?"var(--stone)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.58rem",letterSpacing:"0.1em",cursor:"pointer",borderBottom:tab===t.id?"2px solid var(--stone)":"2px solid transparent",transition:"all 0.15s"}}>{t.label}</button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"14px 14px"}}>

            {/* SHAPE TAB */}
            {tab==="dimensions"&&(
              <>
                <PanelSection title="Patio Shape">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:12}}>
                    {SHAPES.map(s=>(
                      <button key={s.id} onClick={()=>setShape(s.id)} style={{padding:"10px 6px",border:`1px solid ${shape===s.id?"var(--stone)":"var(--border)"}`,borderRadius:6,background:shape===s.id?"rgba(138,154,168,0.12)":"var(--bg)",color:shape===s.id?"var(--stone)":"var(--text-dim)",fontFamily:"var(--mono)",fontSize:"0.62rem",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>
                        <div style={{fontSize:"1.1rem",marginBottom:2}}>{s.icon}</div>{s.label}
                      </button>
                    ))}
                  </div>
                </PanelSection>
                
                {isCircular ? (
                  <PanelSection title="Radius">
                    <Field label="Radius" value={d.radius} onChange={set("radius")} unit="mm" hint="distance from centre to edge"/>
                  </PanelSection>
                ) : (
                  <PanelSection title="Overall Dimensions">
                    <Field label="Width"  value={d.width}  onChange={set("width")}  unit="mm"/>
                    <Field label="Length" value={d.length} onChange={set("length")} unit="mm"/>
                  </PanelSection>
                )}

                {shape==="l-shape"&&(
                  <PanelSection title="Cutout Dimensions" accent="var(--text-dim)">
                    <Field label="Cutout Width"  value={d.cutW} onChange={set("cutW")} unit="mm" small/>
                    <Field label="Cutout Length" value={d.cutL} onChange={set("cutL")} unit="mm" small/>
                  </PanelSection>
                )}
                {shape==="t-shape"&&(
                  <PanelSection title="Extension Dimensions" accent="var(--subbase-col)">
                    <Field label="Extension Width"  value={d.cut2W} onChange={set("cut2W")} unit="mm" small/>
                    <Field label="Extension Length" value={d.cut2L} onChange={set("cut2L")} unit="mm" small/>
                  </PanelSection>
                )}
                
                <PanelSection title="Waste Allowance">
                  <Field label="Waste %" value={d.waste} onChange={set("waste")} min={0} max={30} unit="%" hint="typically 10–15% for cuts"/>
                </PanelSection>
              </>
            )}

            {/* PAVING TAB */}
            {tab==="paving"&&(
              <>
                <PanelSection title="Slab Dimensions">
                  <Field label="Slab Width" value={d.slabWidth} onChange={set("slabWidth")} unit="mm" hint="e.g. 450, 600mm"/>
                  <Field label="Slab Length" value={d.slabLength} onChange={set("slabLength")} unit="mm" hint="e.g. 450, 600, 900mm"/>
                  <Field label="Slab Thickness" value={d.slabThick} onChange={set("slabThick")} unit="mm" hint="typically 35-50mm"/>
                  <Field label="Joint Width" value={d.jointWidth} onChange={set("jointWidth")} unit="mm" hint="typically 8-15mm"/>
                </PanelSection>
                {result&&(
                  <div style={{background:"rgba(138,154,168,0.08)",border:"1px solid rgba(138,154,168,0.2)",borderRadius:6,padding:"12px 14px",marginTop:8}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-dim)",marginBottom:8,letterSpacing:"0.1em"}}>LIVE PREVIEW</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[
                        {l:"Slabs needed",v:`${result.slabs.count} pcs`},
                        {l:"Coverage",v:`${result.slabs.totalArea}m²`},
                        {l:"Patio area",v:`${result.area}m²`},
                        {l:"Inc. waste",v:`${result.areaWithWaste}m²`}
                      ].map((it,i)=>(
                        <div key={i}><div style={{fontSize:"0.58rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>{it.l}</div><div style={{fontSize:"0.88rem",color:"var(--stone)",fontFamily:"var(--mono)",fontWeight:600}}>{it.v}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MATERIALS TAB */}
            {tab==="materials"&&(
              <>
                <PanelSection title="Mortar Bed" accent="var(--mortar-col)">
                  <Field label="Bed Depth" value={d.bedDepth} onChange={set("bedDepth")} unit="mm" hint="typically 25-40mm"/>
                  <SelectField 
                    label="Sand:Cement Mix" 
                    value={d.mixRatio} 
                    onChange={set("mixRatio")} 
                    options={MIX_RATIOS}
                    hint={MIX_RATIOS.find(m=>m.id===d.mixRatio)?.desc}
                  />
                </PanelSection>
                {result&&(
                  <div style={{background:"rgba(184,144,96,0.08)",border:"1px solid rgba(184,144,96,0.2)",borderRadius:6,padding:"12px 14px",marginBottom:16}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--mortar-col)",marginBottom:8,letterSpacing:"0.1em"}}>MORTAR CALCULATION</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[
                        {l:"Volume",v:`${result.mortar.volume}m³`},
                        {l:"Sharp sand",v:`${result.mortar.sandTonnes}t`},
                        {l:"Cement",v:`${result.mortar.cementKg}kg`},
                        {l:"Cement bags",v:`${result.mortar.cementBags}×25kg`},
                      ].map((it,i)=>(
                        <div key={i}><div style={{fontSize:"0.58rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>{it.l}</div><div style={{fontSize:"0.88rem",color:"var(--mortar-col)",fontFamily:"var(--mono)",fontWeight:600}}>{it.v}</div></div>
                      ))}
                    </div>
                  </div>
                )}

                <PanelSection title="Sub-Base" accent="var(--subbase-col)">
                  <Field label="Sub-base Depth" value={d.subbaseDepth} onChange={set("subbaseDepth")} unit="mm" hint="typically 75-150mm"/>
                  <SelectField 
                    label="Sub-base Type" 
                    value={d.subbaseType} 
                    onChange={set("subbaseType")} 
                    options={SUBBASE_TYPES}
                    hint={SUBBASE_TYPES.find(t=>t.id===d.subbaseType)?.desc}
                  />
                </PanelSection>
                {result&&(
                  <div style={{background:"rgba(106,138,90,0.08)",border:"1px solid rgba(106,138,90,0.2)",borderRadius:6,padding:"12px 14px"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--subbase-col)",marginBottom:8,letterSpacing:"0.1em"}}>SUB-BASE CALCULATION</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[
                        {l:"Volume",v:`${result.subbase.volume}m³`},
                        {l:"Weight",v:`${result.subbase.tonnes}t`},
                        {l:"Density",v:`${result.subbase.type.density}t/m³`},
                        {l:"Material",v:result.subbase.type.label},
                      ].map((it,i)=>(
                        <div key={i}><div style={{fontSize:"0.58rem",color:"var(--text-mute)",fontFamily:"var(--mono)"}}>{it.l}</div><div style={{fontSize:"0.88rem",color:"var(--subbase-col)",fontFamily:"var(--mono)",fontWeight:600}}>{it.v}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status bar */}
          <div style={{padding:"8px 14px",background:"var(--bg)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <span style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:result?"var(--subbase-col)":"var(--text-mute)",letterSpacing:"0.1em"}}>
              {result?`● ${result.area} m² CALCULATED`:"○ AWAITING INPUT"}
            </span>
            <span style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-dim)"}}>
              {shape.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RIGHT — PLAN + MATERIALS LIST */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:showList?"0 0 55%":1,background:"var(--bg)",position:"relative",overflow:"hidden",transition:"flex 0.3s ease"}}>
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
              <defs>
                <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0L0 0 0 20" fill="none" stroke="rgba(42,48,56,0.5)" strokeWidth="0.5"/></pattern>
                <pattern id="lg" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#sg)"/><path d="M100 0L0 0 0 100" fill="none" stroke="rgba(42,48,56,0.9)" strokeWidth="1"/></pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#lg)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <PavingPlan calc={result}/>
            </div>
            <div style={{position:"absolute",top:14,right:14,fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text-mute)",letterSpacing:"0.14em",background:"rgba(14,16,18,0.7)",padding:"4px 10px",borderRadius:4,backdropFilter:"blur(4px)"}}>
              TOP DOWN — PAVING LAYOUT
            </div>
            <div style={{position:"absolute",top:14,left:14,fontFamily:"var(--mono)",fontSize:"0.58rem",letterSpacing:"0.1em",background:"rgba(14,16,18,0.75)",padding:"4px 10px",borderRadius:4,display:"flex",gap:8,alignItems:"center",backdropFilter:"blur(4px)"}}>
              <span style={{color:"var(--stone)",fontWeight:700}}>{shape.toUpperCase()}</span>
              <span style={{color:"var(--border2)"}}>·</span>
              <span style={{color:"var(--mortar-col)"}}>{d.mixRatio} MIX</span>
            </div>
            {result&&(
              <div style={{position:"absolute",bottom:14,right:14,fontFamily:"var(--mono)",fontSize:"0.58rem",color:"var(--text-mute)",letterSpacing:"0.1em",background:"rgba(14,16,18,0.7)",padding:"4px 10px",borderRadius:4}}>
                {isCircular ? `⌀${result.R*2}mm` : `${result.W}×${result.L}mm`}
              </div>
            )}
          </div>
          {showList&&(
            <div style={{flex:"1 1 45%",overflowY:"auto",borderTop:"1px solid var(--border)"}}>
              <MaterialsList calc={result}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
