import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const documents = [
  {
    id: "work-order",
    title: "Work Order",
    subtitle: "Job assignments & instructions",
    path: "/paperwork/work-order",
    icon: "📋",
    color: "#2D5A27",
    position: { top: "8%", left: "12%" },
    rotation: -4,
    zBase: 10,
  },
  {
    id: "schedule",
    title: "Schedule",
    subtitle: "Project timelines & dates",
    path: "/paperwork/schedule",
    icon: "📅",
    color: "#1E4A6D",
    position: { top: "6%", left: "52%" },
    rotation: 3,
    zBase: 11,
  },
  {
    id: "quote",
    title: "Quote",
    subtitle: "Cost estimates & proposals",
    path: "/paperwork/quote",
    icon: "💰",
    color: "#6B4423",
    position: { top: "38%", left: "8%" },
    rotation: -2,
    zBase: 12,
  },
  {
    id: "invoice",
    title: "Invoice",
    subtitle: "Billing & payment requests",
    path: "/paperwork/invoice",
    icon: "📄",
    color: "#4A3B6B",
    position: { top: "36%", left: "56%" },
    rotation: 5,
    zBase: 13,
  },
  {
    id: "payment-reminder",
    title: "Payment Reminder",
    subtitle: "Follow-up notices",
    path: "/paperwork/payment-reminder",
    icon: "⏰",
    color: "#8B4513",
    position: { top: "66%", left: "18%" },
    rotation: -3,
    zBase: 14,
  },
  {
    id: "deposit-receipt",
    title: "Deposit Receipt",
    subtitle: "Payment confirmations",
    path: "/paperwork/deposit-receipt",
    icon: "🧾",
    color: "#2D4A3E",
    position: { top: "64%", left: "48%" },
    rotation: 2,
    zBase: 15,
  },
];

function DocumentCard({ doc, isHovered, onHover, onLeave }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100 + Math.random() * 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Link
      to={doc.path}
      style={{
        ...styles.document,
        top: doc.position.top,
        left: doc.position.left,
        transform: `rotate(${doc.rotation}deg) scale(${isHovered ? 1.08 : 1}) translateY(${isHovered ? -8 : 0}px)`,
        zIndex: isHovered ? 100 : doc.zBase,
        opacity: mounted ? 1 : 0,
        boxShadow: isHovered
          ? "0 20px 40px rgba(0,0,0,0.2), 0 0 0 3px " + doc.color
          : "0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={() => onHover(doc.id)}
      onMouseLeave={onLeave}
    >
      {/* Paper clip */}
      <div style={{ ...styles.paperClip, background: doc.color }} />

      {/* Fold corner */}
      <div style={styles.foldCorner} />

      {/* Header band */}
      <div style={{ ...styles.headerBand, background: doc.color }}>
        <span style={styles.icon}>{doc.icon}</span>
      </div>

      {/* Content */}
      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{doc.title}</h3>
        <p style={styles.cardSubtitle}>{doc.subtitle}</p>

        {/* Fake lines */}
        <div style={styles.fakeLines}>
          <div style={{ ...styles.line, width: "80%" }} />
          <div style={{ ...styles.line, width: "65%" }} />
          <div style={{ ...styles.line, width: "70%" }} />
        </div>
      </div>

      {/* Click hint */}
      <div
        style={{
          ...styles.clickHint,
          opacity: isHovered ? 1 : 0,
          transform: `translateY(${isHovered ? 0 : 4}px)`,
        }}
      >
        Click to open →
      </div>
    </Link>
  );
}

export default function OfficeLanding() {
  const [hoveredDoc, setHoveredDoc] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div style={styles.container}>
        {/* Desk surface */}
        <div style={styles.deskSurface}>
          {/* Wood grain texture overlay */}
          <div style={styles.woodGrain} />

          {/* Desk items */}
          <div style={styles.coffeeStain} />
          <div style={styles.penHolder}>
            <div style={styles.pen} />
            <div style={{ ...styles.pen, background: "#1E4A6D", transform: "rotate(8deg)" }} />
            <div style={{ ...styles.pen, background: "#6B4423", transform: "rotate(-5deg)" }} />
          </div>

          {/* Sticky note */}
          <div style={styles.stickyNote}>
            <span style={styles.stickyText}>Paperwork</span>
            <span style={styles.stickySubtext}>Select a document</span>
          </div>

          {/* Clock */}
          <div style={styles.clock}>
            <span style={styles.clockTime}>
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span style={styles.clockDate}>
              {time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>

          {/* Document cards */}
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isHovered={hoveredDoc === doc.id}
              onHover={setHoveredDoc}
              onLeave={() => setHoveredDoc(null)}
            />
          ))}

          {/* Scattered paper clips */}
          <div style={{ ...styles.loosePaperClip, top: "82%", left: "78%", transform: "rotate(45deg)" }} />
          <div style={{ ...styles.loosePaperClip, top: "28%", left: "82%", transform: "rotate(-20deg)", background: "#C8973A" }} />
          <div style={{ ...styles.loosePaperClip, top: "75%", left: "5%", transform: "rotate(90deg)", background: "#8B5E3C" }} />

          {/* Rubber band */}
          <div style={styles.rubberBand} />
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #2C2416 0%, #1A1208 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },

  deskSurface: {
    position: "relative",
    width: "100%",
    maxWidth: "1100px",
    height: "85vh",
    minHeight: "700px",
    background: "linear-gradient(145deg, #B8956A 0%, #9A7B52 50%, #8A6B42 100%)",
    borderRadius: "8px",
    boxShadow: `
      0 30px 60px rgba(0,0,0,0.4),
      0 15px 30px rgba(0,0,0,0.3),
      inset 0 2px 4px rgba(255,255,255,0.1),
      inset 0 -2px 4px rgba(0,0,0,0.2)
    `,
    overflow: "hidden",
  },

  woodGrain: {
    position: "absolute",
    inset: 0,
    opacity: 0.15,
    backgroundImage: `repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.1) 2px,
      rgba(0,0,0,0.1) 4px
    )`,
    pointerEvents: "none",
  },

  coffeeStain: {
    position: "absolute",
    bottom: "8%",
    right: "8%",
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(101, 67, 33, 0.15) 0%, transparent 70%)",
    transform: "rotate(15deg) scaleX(1.2)",
  },

  penHolder: {
    position: "absolute",
    top: "4%",
    right: "6%",
    width: "50px",
    height: "60px",
    background: "linear-gradient(180deg, #3B3B3B 0%, #2A2A2A 100%)",
    borderRadius: "4px 4px 6px 6px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "5px",
    gap: "3px",
  },

  pen: {
    width: "6px",
    height: "45px",
    background: "#2D5A27",
    borderRadius: "2px 2px 1px 1px",
    transform: "rotate(-3deg)",
  },

  stickyNote: {
    position: "absolute",
    top: "3%",
    left: "4%",
    width: "130px",
    padding: "14px 12px",
    background: "linear-gradient(180deg, #FFEB99 0%, #FFE066 100%)",
    boxShadow: "2px 3px 8px rgba(0,0,0,0.15)",
    transform: "rotate(-2deg)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  stickyText: {
    fontFamily: "'Crimson Pro', serif",
    fontSize: "18px",
    fontWeight: "600",
    color: "#2C2416",
  },

  stickySubtext: {
    fontSize: "11px",
    color: "#6B5A3C",
    fontWeight: "500",
  },

  clock: {
    position: "absolute",
    bottom: "4%",
    right: "4%",
    background: "rgba(26, 18, 8, 0.85)",
    padding: "12px 18px",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },

  clockTime: {
    fontFamily: "'IBM Plex Sans', monospace",
    fontSize: "24px",
    fontWeight: "600",
    color: "#C8973A",
    letterSpacing: "2px",
  },

  clockDate: {
    fontSize: "11px",
    color: "#9C9580",
    fontWeight: "500",
    marginTop: "2px",
  },

  document: {
    position: "absolute",
    width: "200px",
    height: "260px",
    background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F0 100%)",
    borderRadius: "3px",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
    overflow: "hidden",
  },

  paperClip: {
    position: "absolute",
    top: "-8px",
    left: "20px",
    width: "30px",
    height: "50px",
    borderRadius: "15px 15px 0 0",
    border: "3px solid",
    borderColor: "inherit",
    borderBottom: "none",
    background: "transparent",
    zIndex: 2,
  },

  foldCorner: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "30px",
    height: "30px",
    background: "linear-gradient(135deg, transparent 50%, #E8E4D9 50%)",
    boxShadow: "-2px 2px 3px rgba(0,0,0,0.05)",
  },

  headerBand: {
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "2px solid rgba(0,0,0,0.1)",
  },

  icon: {
    fontSize: "28px",
  },

  cardContent: {
    padding: "16px",
  },

  cardTitle: {
    fontFamily: "'Crimson Pro', serif",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1A1208",
    marginBottom: "4px",
    margin: 0,
  },

  cardSubtitle: {
    fontSize: "12px",
    color: "#6B5A3C",
    marginBottom: "16px",
    fontWeight: "500",
    margin: "4px 0 16px 0",
  },

  fakeLines: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "12px",
  },

  line: {
    height: "6px",
    background: "linear-gradient(90deg, #E8E4D9 0%, #F0EDE5 100%)",
    borderRadius: "2px",
  },

  clickHint: {
    position: "absolute",
    bottom: "14px",
    right: "14px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#6B5A3C",
    transition: "all 0.2s ease",
  },

  loosePaperClip: {
    position: "absolute",
    width: "20px",
    height: "35px",
    borderRadius: "10px 10px 0 0",
    border: "2px solid #6B8F5E",
    borderBottom: "none",
    background: "transparent",
    opacity: 0.7,
  },

  rubberBand: {
    position: "absolute",
    bottom: "18%",
    left: "85%",
    width: "45px",
    height: "12px",
    background: "#D4A853",
    borderRadius: "6px",
    transform: "rotate(-25deg)",
    opacity: 0.6,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
};
