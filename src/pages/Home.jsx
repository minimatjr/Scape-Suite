import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  useEffect(() => {
    // Fade-in observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    const fadeEls = document.querySelectorAll(".fade-in");
    fadeEls.forEach((el) => observer.observe(el));

    // Nav shrink on scroll (targets the global <nav> from your Navbar component)
    const onScroll = () => {
      const nav = document.querySelector("nav");
      if (!nav) return;

      if (window.scrollY > 60) {
        nav.style.padding = "12px 48px";
        nav.style.boxShadow = "0 2px 20px rgba(26,18,8,0.08)";
      } else {
        nav.style.padding = "18px 48px";
        nav.style.boxShadow = "none";
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      {/* Fonts + Page CSS */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@500;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        /* ── RESET & VARS ───────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:      #1A1208;
          --bark:     #3B2410;
          --timber:   #6B3F1E;
          --soil:     #8B5E3C;
          --clay:     #C4845A;
          --straw:    #D9B97A;
          --moss:     #3D5C35;
          --sage:     #6B8F5E;
          --fern:     #A8C49A;
          --cream:    #F4EDD8;
          --parchment:#EDE0C4;
          --white:    #FBF8F1;
          --stone:    #9C9580;
          --pro-gold: #C8973A;
          --pro-dark: #0F1A0C;
        }

        html { scroll-behavior: smooth; }

        /* NOTE: If your app already styles body globally, you can move these to index.css */
        body {
          font-family: 'Barlow', sans-serif;
          background: var(--white);
          color: var(--ink);
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* ── NOISE TEXTURE OVERLAY ──────────────────────────────── */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 999;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* ── HERO ───────────────────────────────────────────────── */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
        }

        .hero-left {
          background: var(--bark);
          padding: 140px 64px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .hero-left::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(168,196,154,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-left::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--straw), transparent);
        }

        .hero-eyebrow {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--straw);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hero-eyebrow::before {
          content: '';
          display: block;
          width: 32px; height: 1px;
          background: var(--straw);
        }

        .hero-title {
          font-family: 'Libre Baskerville', serif;
          font-size: clamp(3rem, 5vw, 4.5rem);
          line-height: 1.05;
          color: var(--cream);
          margin-bottom: 28px;
        }
        .hero-title em {
          font-style: italic;
          color: var(--straw);
        }

        .hero-body {
          font-size: 1.05rem;
          color: rgba(244,237,216,0.7);
          font-weight: 300;
          max-width: 420px;
          line-height: 1.75;
          margin-bottom: 44px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-hero-primary {
          padding: 16px 36px;
          background: var(--clay);
          color: var(--white);
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          font-family: 'Barlow', sans-serif;
          text-decoration: none;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-hero-primary:hover { background: var(--timber); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

        .btn-hero-ghost {
          padding: 16px 36px;
          background: transparent;
          color: var(--cream);
          border: 1.5px solid rgba(244,237,216,0.3);
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          font-family: 'Barlow', sans-serif;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-hero-ghost:hover { border-color: var(--cream); background: rgba(244,237,216,0.08); }

        /* Hero right — visual */
        .hero-right {
          background: var(--cream);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 120px 48px 80px;
        }

        .hero-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(59,36,16,0.06) 39px, rgba(59,36,16,0.06) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(59,36,16,0.06) 39px, rgba(59,36,16,0.06) 40px);
        }

        .hero-mockup {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 460px;
        }

        .mockup-window {
          background: var(--white);
          border-radius: 16px;
          box-shadow: 0 32px 80px rgba(59,36,16,0.25), 0 8px 24px rgba(59,36,16,0.15);
          overflow: hidden;
          border: 1px solid rgba(59,36,16,0.1);
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .mockup-bar {
          background: var(--bark);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
        .mockup-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--straw);
          margin-left: 8px;
        }

        .mockup-content { padding: 20px; }

        .mockup-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: #F0E8D4;
          padding: 4px;
          border-radius: 8px;
        }
        .mockup-tab {
          flex: 1;
          padding: 7px;
          border-radius: 6px;
          font-size: 0.68rem;
          text-align: center;
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--stone);
        }
        .mockup-tab.active {
          background: var(--white);
          color: var(--bark);
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(59,36,16,0.12);
        }

        .mockup-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .mockup-field {
          background: #F8F3E8;
          border: 1px solid #E0D4B8;
          border-radius: 6px;
          padding: 8px 10px;
        }
        .mockup-field-label { font-size: 0.6rem; color: var(--stone); font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
        .mockup-field-val { font-size: 0.82rem; color: var(--bark); font-weight: 600; margin-top: 2px; }

        .mockup-result {
          background: var(--bark);
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 12px;
        }
        .mockup-result-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .mockup-result-row:last-child { margin-bottom: 0; }
        .mockup-result-label { font-size: 0.62rem; color: rgba(212,185,122,0.7); font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
        .mockup-result-val { font-size: 0.78rem; color: var(--straw); font-weight: 700; font-family: 'Barlow Condensed', sans-serif; }

        /* Floating badges on hero */
        .hero-badge {
          position: absolute;
          background: var(--white);
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow: 0 8px 24px rgba(59,36,16,0.15);
          border: 1px solid rgba(59,36,16,0.08);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 3;
          animation: float 4s ease-in-out infinite;
        }
        .hero-badge-1 { top: 130px; right: 40px; animation-delay: 1s; }
        .hero-badge-2 { bottom: 120px; left: 20px; animation-delay: 2s; }
        .hero-badge-icon { font-size: 1.4rem; }
        .hero-badge-text { font-size: 0.72rem; }
        .hero-badge-text strong { display: block; color: var(--bark); font-weight: 700; font-size: 0.82rem; }
        .hero-badge-text span { color: var(--stone); }

        /* ── SECTION SHARED ─────────────────────────────────────── */
        section { padding: 100px 48px; }

        .section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--clay);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-label::after {
          content: '';
          display: block;
          width: 40px; height: 1px;
          background: var(--clay);
        }

        .section-title {
          font-family: 'Libre Baskerville', serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          line-height: 1.15;
          color: var(--bark);
          max-width: 640px;
          margin-bottom: 20px;
        }
        .section-title em { font-style: italic; color: var(--clay); }

        .section-body {
          font-size: 1rem;
          color: var(--stone);
          max-width: 540px;
          line-height: 1.75;
        }

        /* ── CALC FEATURES SECTION ─────────────────────────────── */
        .features {
          background: var(--parchment);
          position: relative;
          overflow: hidden;
        }
        .features::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 10%, var(--straw) 50%, transparent 90%);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 64px;
          border: 1px solid rgba(59,36,16,0.12);
          border-radius: 16px;
          overflow: hidden;
        }

        .feature-card {
          background: var(--white);
          padding: 40px 36px;
          position: relative;
          transition: background 0.3s;
        }
        .feature-card:hover { background: #FDFAF4; }
        .feature-card:hover .feature-icon { transform: scale(1.1) rotate(-4deg); }

        .feature-icon {
          font-size: 2.8rem;
          margin-bottom: 20px;
          display: block;
          transition: transform 0.3s;
        }

        .feature-name {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.2rem;
          color: var(--bark);
          margin-bottom: 10px;
        }

        .feature-desc {
          font-size: 0.88rem;
          color: var(--stone);
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .feature-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          font-family: 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
        }
        .pill-diy { background: rgba(107,143,94,0.15); color: var(--moss); border: 1px solid rgba(107,143,94,0.3); }
        .pill-pro { background: rgba(200,151,58,0.15); color: var(--pro-gold); border: 1px solid rgba(200,151,58,0.3); }

        .feature-tag {
          position: absolute;
          top: 16px; right: 16px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .tag-both { background: rgba(61,92,53,0.1); color: var(--moss); }
        .tag-pro { background: rgba(200,151,58,0.15); color: var(--pro-gold); }

        /* ── COMPARISON TABLE ───────────────────────────────────── */
        .comparison {
          background: var(--white);
        }

        .comparison-intro {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: end;
          margin-bottom: 64px;
        }

        .tier-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(59,36,16,0.08);
          border: 1px solid rgba(59,36,16,0.1);
        }

        .tier-table thead tr th {
          padding: 0;
          vertical-align: bottom;
        }

        .tier-head-blank {
          background: var(--parchment);
          padding: 28px 32px;
          border-bottom: 1px solid rgba(59,36,16,0.1);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--stone);
        }

        .tier-head {
          padding: 28px 32px;
          border-bottom: 1px solid rgba(59,36,16,0.1);
          text-align: center;
        }

        .tier-head-diy { background: #F5EFDF; }
        .tier-head-pro { background: var(--pro-dark); }

        .tier-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .tier-label-diy { color: var(--soil); }
        .tier-label-pro { color: var(--pro-gold); }

        .tier-name {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.5rem;
          margin-bottom: 12px;
        }
        .tier-name-diy { color: var(--bark); }
        .tier-name-pro { color: var(--cream); }

        .tier-price {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1;
          font-family: 'Barlow', sans-serif;
        }
        .tier-price-diy { color: var(--bark); }

        .tier-price sup { font-size: 1rem; vertical-align: super; }
        .tier-price sub { font-size: 0.7rem; color: var(--stone); font-weight: 400; vertical-align: baseline; margin-left: 2px; }

        .tier-table tbody tr:hover td { background-color: rgba(59,36,16,0.02); }

        .table-row-feature td {
          padding: 16px 32px;
          font-size: 0.88rem;
          border-bottom: 1px solid rgba(59,36,16,0.06);
          vertical-align: middle;
        }
        .table-row-feature:last-child td { border-bottom: none; }

        .feature-col {
          color: var(--bark);
          font-weight: 500;
        }
        .feature-note {
          font-size: 0.75rem;
          color: var(--stone);
          margin-top: 2px;
        }

        .check-col { text-align: center; }
        .check { font-size: 1.1rem; }
        .check-yes { color: var(--moss); }
        .check-no { color: #D0C8B8; }
        .check-pro { color: var(--pro-gold); }

        .table-section-header td {
          background: var(--parchment);
          padding: 10px 32px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--clay);
          font-weight: 700;
        }

        .table-cta-row td {
          padding: 28px 32px;
          text-align: center;
          background: var(--parchment);
        }
        .table-cta-row td:last-child { background: var(--pro-dark); }

        .btn-table-diy {
          display: inline-block;
          padding: 13px 32px;
          background: var(--moss);
          color: var(--cream);
          border: none;
          border-radius: 8px;
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: all 0.2s;
        }
        .btn-table-diy:hover { background: var(--bark); transform: translateY(-1px); }

        .btn-table-pro {
          display: inline-block;
          padding: 13px 32px;
          background: var(--pro-gold);
          color: var(--pro-dark);
          border: none;
          border-radius: 8px;
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: all 0.2s;
        }
        .btn-table-pro:hover { background: #E0A840; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(200,151,58,0.35); }

        /* ── SOCIAL PROOF ───────────────────────────────────────── */
        .social {
          background: var(--bark);
          position: relative;
          overflow: hidden;
        }
        .social::before {
          content: '"';
          position: absolute;
          top: -40px; left: 32px;
          font-family: 'Libre Baskerville', serif;
          font-size: 18rem;
          color: rgba(212,185,122,0.06);
          line-height: 1;
          pointer-events: none;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }

        .testimonial {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,185,122,0.15);
          border-radius: 16px;
          padding: 32px 28px;
          position: relative;
          transition: background 0.3s;
        }
        .testimonial:hover { background: rgba(255,255,255,0.07); }

        .testimonial-quote {
          font-family: 'Libre Baskerville', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: var(--cream);
          line-height: 1.75;
          margin-bottom: 24px;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .author-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .av-1 { background: rgba(107,143,94,0.3); }
        .av-2 { background: rgba(196,132,90,0.3); }
        .av-3 { background: rgba(200,151,58,0.3); }

        .author-name {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--straw);
        }
        .author-role {
          font-size: 0.75rem;
          color: var(--stone);
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.06em;
        }

        .testimonial-tier {
          position: absolute;
          top: 16px; right: 16px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .t-diy { background: rgba(107,143,94,0.2); color: var(--fern); }
        .t-pro { background: rgba(200,151,58,0.2); color: var(--pro-gold); }

        /* ── FAQ ─────────────────────────────────────────────────── */
        .faq { background: var(--cream); }

        .faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 64px;
        }

        .faq-item {
          border-top: 2px solid rgba(59,36,16,0.15);
          padding-top: 24px;
        }
        .faq-q {
          font-family: 'Libre Baskerville', serif;
          font-size: 1rem;
          color: var(--bark);
          margin-bottom: 12px;
        }
        .faq-a {
          font-size: 0.9rem;
          color: var(--stone);
          line-height: 1.75;
        }

        /* ── CTA BANNER ──────────────────────────────────────────── */
        .cta-banner {
          background: var(--moss);
          padding: 80px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(168,196,154,0.2) 0%, transparent 70%);
        }
        .cta-banner h2 {
          font-family: 'Libre Baskerville', serif;
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          color: var(--cream);
          margin-bottom: 16px;
          position: relative;
        }
        .cta-banner p {
          font-size: 1rem;
          color: rgba(244,237,216,0.7);
          max-width: 480px;
          margin: 0 auto 40px;
          position: relative;
        }
        .cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
        }
        .btn-cta-primary {
          padding: 16px 44px;
          background: var(--cream);
          color: var(--moss);
          border: none;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Barlow', sans-serif;
          text-decoration: none;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .btn-cta-primary:hover { background: white; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.2); }

        .btn-cta-ghost {
          padding: 16px 44px;
          background: transparent;
          color: var(--cream);
          border: 1.5px solid rgba(244,237,216,0.4);
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Barlow', sans-serif;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-cta-ghost:hover { border-color: var(--cream); background: rgba(244,237,216,0.08); }

        /* ── FOOTER ──────────────────────────────────────────────── */
        footer {
          background: var(--ink);
          padding: 60px 48px 32px;
          color: var(--stone);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }
        .footer-logo {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.2rem;
          color: var(--cream);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .footer-tagline {
          font-size: 0.85rem;
          color: var(--stone);
          line-height: 1.6;
          max-width: 260px;
        }
        .footer-col-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--straw);
          margin-bottom: 16px;
        }
        .footer-links { list-style: none; }
        .footer-links li { margin-bottom: 10px; }
        .footer-links a {
          color: var(--stone);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--cream); }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          color: rgba(156,149,128,0.6);
        }

        /* ── ANIMATIONS ──────────────────────────────────────────── */
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── RESPONSIVE ──────────────────────────────────────────── */
        @media (max-width: 960px) {
          .hero { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .hero-left { padding: 120px 32px 80px; min-height: 100vh; }
          .features-grid { grid-template-columns: 1fr; }
          .comparison-intro { grid-template-columns: 1fr; gap: 32px; }
          .tier-table { font-size: 0.85rem; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .faq-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          section { padding: 72px 24px; }
        }

        @media (max-width: 600px) {
          .tier-table { display: block; overflow-x: auto; }
          .footer-grid { grid-template-columns: 1fr; }
          .cta-banner { padding: 64px 24px; }
          footer { padding: 48px 24px 24px; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero" style={{ padding: 0 }}>
        <div className="hero-left">
          <div className="hero-eyebrow">Professional Landscaping Tools</div>
          <h1 className="hero-title">
            Calculate with
            <br />
            <em>trade precision.</em>
            <br />
            Build with
            <br />
            confidence.
          </h1>
          <p className="hero-body">
            From deck cutting lists to paving sub-bases — LandscapeCalc gives
            landscapers and serious DIYers accurate materials schedules in
            seconds, not hours.
          </p>
          <div className="hero-actions">
            <Link to="/deck" className="btn-hero-primary">
              ▶ Try Free Now
            </Link>
            <a href="#calculators" className="btn-hero-ghost">
              See All Calculators
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-badge hero-badge-1">
            <span className="hero-badge-icon">🪵</span>
            <div className="hero-badge-text">
              <strong>48 boards</strong>
              <span>Deck cutting list ready</span>
            </div>
          </div>

          <div className="hero-mockup">
            <div className="mockup-window">
              <div className="mockup-bar">
                <span className="mockup-dot" style={{ background: "#e06c5a" }} />
                <span className="mockup-dot" style={{ background: "#e0c05a" }} />
                <span className="mockup-dot" style={{ background: "#5ae07a" }} />
                <span className="mockup-title">LandscapeCalc Pro</span>
              </div>
              <div className="mockup-content">
                <div className="mockup-tabs">
                  <div className="mockup-tab active">Deck</div>
                  <div className="mockup-tab">Paving</div>
                  <div className="mockup-tab">Raised Beds</div>
                  <div className="mockup-tab" style={{ color: "#C8973A" }}>
                    + More
                  </div>
                </div>

                <div className="mockup-field-row">
                  <div className="mockup-field">
                    <div className="mockup-field-label">Width</div>
                    <div className="mockup-field-val">4,800 mm</div>
                  </div>
                  <div className="mockup-field">
                    <div className="mockup-field-label">Length</div>
                    <div className="mockup-field-val">3,600 mm</div>
                  </div>
                  <div className="mockup-field">
                    <div className="mockup-field-label">Board Width</div>
                    <div className="mockup-field-val">150 mm</div>
                  </div>
                  <div className="mockup-field">
                    <div className="mockup-field-label">Joist Spacing</div>
                    <div className="mockup-field-val">400 mm</div>
                  </div>
                </div>

                <div className="mockup-result">
                  <div className="mockup-result-row">
                    <span className="mockup-result-label">Decking Boards</span>
                    <span className="mockup-result-val">26 @ 4,800mm</span>
                  </div>
                  <div className="mockup-result-row">
                    <span className="mockup-result-label">Joists</span>
                    <span className="mockup-result-val">11 @ 4,800mm</span>
                  </div>
                  <div className="mockup-result-row">
                    <span className="mockup-result-label">Posts</span>
                    <span className="mockup-result-val">9 × 100×100</span>
                  </div>
                  <div className="mockup-result-row">
                    <span className="mockup-result-label">Deck Area</span>
                    <span className="mockup-result-val">17.28 m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-badge hero-badge-2">
            <span className="hero-badge-icon">🧱</span>
            <div className="hero-badge-text">
              <strong>4.2 tonnes MOT</strong>
              <span>Sub-base calculated</span>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULATORS */}
      <section className="features" id="calculators">
        <div className="section-label">What's Inside</div>
        <h2 className="section-title">
          Every calculator a landscaper <em>actually needs.</em>
        </h2>
        <p className="section-body">
          All three core calculators are available on both tiers. Pro unlocks
          advanced inputs, additional tools, and an ad-free experience.
        </p>

        <div className="features-grid fade-in">
          <Link to="/deck" className="feature-card" style={{ textDecoration: "none" }}>
            <span className="feature-tag tag-both">DIY + Pro</span>
            <span className="feature-icon">🪵</span>
            <div className="feature-name">Deck Calculator</div>
            <p className="feature-desc">
              Rectangle, L-shape and T-shape decks. Full cutting list for decking
              boards, joists, rim joists, beams and posts — with hardware counts.
            </p>
            <div className="feature-pills">
              <span className="pill pill-diy">Basic Shapes</span>
              <span className="pill pill-pro">Complex Shapes</span>
              <span className="pill pill-pro">PDF Export</span>
              <span className="pill pill-pro">Angled Decks</span>
            </div>
          </Link>

          <Link to="/paving" className="feature-card" style={{ textDecoration: "none" }}>
            <span className="feature-tag tag-both">DIY + Pro</span>
            <span className="feature-icon">🧱</span>
            <div className="feature-name">Paving Calculator</div>
            <p className="feature-desc">
              Input your patio shape and tile size. Get square meterage, tile
              count, laying pattern previews, MOT sub-base tonnage and bedding mortar.
            </p>
            <div className="feature-pills">
              <span className="pill pill-diy">3 Shapes</span>
              <span className="pill pill-diy">5 Patterns</span>
              <span className="pill pill-pro">Custom Shapes</span>
              <span className="pill pill-pro">Multiple Areas</span>
            </div>
          </Link>

          <div className="feature-card">
            <span className="feature-tag tag-both">DIY + Pro</span>
            <span className="feature-icon">🌱</span>
            <div className="feature-name">Raised Bed Calculator</div>
            <p className="feature-desc">
              Sleeper cutting lengths for rectangular, square and circular raised beds,
              with topsoil and compost volumes by bulk bag or tonne.
            </p>
            <div className="feature-pills">
              <span className="pill pill-diy">3 Shapes</span>
              <span className="pill pill-pro">Multi-Bed Projects</span>
              <span className="pill pill-pro">Hex & Polygon</span>
            </div>
          </div>

          <Link to="/fencing" className="feature-card" style={{ textDecoration: "none", background: "#FBF8F1" }}>
            <span className="feature-tag tag-pro">Pro Only</span>
            <span className="feature-icon">🚧</span>
            <div className="feature-name">Fencing Calculator</div>
            <p className="feature-desc">
              Post spacings, rail lengths, board counts and concrete footing volumes
              for close-board, picket and panel fencing.
            </p>
            <div className="feature-pills">
              <span className="pill pill-pro">Coming Soon</span>
            </div>
          </Link>

          <Link to="/retainingwall" className="feature-card" style={{ textDecoration: "none", background: "#FBF8F1" }}>
            <span className="feature-tag tag-pro">Pro Only</span>
            <span className="feature-icon">🪨</span>
            <div className="feature-name">Retaining Wall Calculator</div>
            <p className="feature-desc">
              Block and stone retaining walls — courses, mortar, drainage aggregate
              and geotextile quantities with load-bearing guidance.
            </p>
            <div className="feature-pills">
              <span className="pill pill-pro">Coming Soon</span>
            </div>
          </Link>

          <Link to="/lawn" className="feature-card" style={{ textDecoration: "none", background: "#FBF8F1" }}>
            <span className="feature-tag tag-pro">Pro Only</span>
            <span className="feature-icon">🍀</span>
            <div className="feature-name">Turf, Seed and Soil</div>
            <p className="feature-desc">
              New lawn calculator — figure out how much turf or seed you might need
              and topsoil volume calculator if you need to build up or relevel your lawn area.
            </p>
            <div className="feature-pills">
              <span className="pill pill-pro">Coming Soon</span>
            </div>
          </Link>

          <Link to="/concrete" className="feature-card" style={{ textDecoration: "none", background: "#FBF8F1" }}>
            <span className="feature-tag tag-pro">Pro Only</span>
            <span className="feature-icon">🏗️</span>
            <div className="feature-name">Concrete Footings</div>
            <p className="feature-desc">
              Volumes and mix ratios for pad, strip and post-hole foundations —
              with frost depth guidance and ready-mix or bag alternatives.
            </p>
            <div className="feature-pills">
              <span className="pill pill-pro">Coming Soon</span>
            </div>
          </Link>
        </div>
      </section>

      {/* PRICING */}
      <section className="comparison" id="pricing">
        <div className="comparison-intro">
          <div>
            <div className="section-label">Pricing</div>
            <h2 className="section-title">
              Simple plans, <em>no surprises.</em>
            </h2>
          </div>
          <p className="section-body">
            Both plans give you access to the three core calculators. Pro unlocks
            advanced features, more tools, and removes all ads — built for those who
            use it professionally every week.
          </p>
        </div>

        <table className="tier-table fade-in">
          <thead>
            <tr>
              <th className="tier-head-blank">Features</th>
              <th className="tier-head tier-head-diy">
                <div className="tier-label tier-label-diy">For Homeowners</div>
                <div className="tier-name tier-name-diy">DIY</div>
                <div className="tier-price tier-price-diy">
                  <sup>£</sup>0<sub>/mo</sub>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--stone)", marginTop: 6 }}>
                  Free forever
                </div>
              </th>
              <th className="tier-head tier-head-pro">
                <div className="tier-label tier-label-pro">For Professionals</div>
                <div className="tier-name tier-name-pro">Pro</div>
                <div className="tier-price" style={{ color: "var(--pro-gold)" }}>
                  <sup style={{ color: "var(--pro-gold)" }}>£</sup>9
                  <sub style={{ color: "rgba(212,185,122,0.5)" }}>/mo</sub>
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(212,185,122,0.5)", marginTop: 6 }}>
                  or £79/yr — save 27%
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="table-section-header">
              <td colSpan={3}>Core Calculators</td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">
                Deck Calculator<div className="feature-note">Cutting list, hardware schedule</div>
              </td>
              <td className="check-col">
                <span className="check check-yes">✓</span>
              </td>
              <td className="check-col">
                <span className="check check-yes">✓</span>
              </td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">
                Paving Calculator<div className="feature-note">Tiles, sub-base, mortar</div>
              </td>
              <td className="check-col">
                <span className="check check-yes">✓</span>
              </td>
              <td className="check-col">
                <span className="check check-yes">✓</span>
              </td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">
                Raised Bed Calculator<div className="feature-note">Sleepers, topsoil, compost</div>
              </td>
              <td className="check-col">
                <span className="check check-yes">✓</span>
              </td>
              <td className="check-col">
                <span className="check check-yes">✓</span>
              </td>
            </tr>

            <tr className="table-section-header">
              <td colSpan={3}>Inputs & Shapes</td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Basic shapes (rectangle, square, circle)</td>
              <td className="check-col"><span className="check check-yes">✓</span></td>
              <td className="check-col"><span className="check check-yes">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Simple, plain-English inputs</td>
              <td className="check-col"><span className="check check-yes">✓</span></td>
              <td className="check-col"><span className="check check-yes">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Complex shapes (L, T, polygon, hex)</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">
                Advanced subframe & structural inputs
                <div className="feature-note">Beam sizing, joist type, fixing details</div>
              </td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Multiple areas / zones per project</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-section-header">
              <td colSpan={3}>Pro Calculators</td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">
                Fencing Calculator<div className="feature-note">Close-board, panel, picket</div>
              </td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Retaining Wall Calculator</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Concrete Footings Calculator</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-section-header">
              <td colSpan={3}>Output & Experience</td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">On-screen results</td>
              <td className="check-col"><span className="check check-yes">✓</span></td>
              <td className="check-col"><span className="check check-yes">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">
                PDF / print export
                <div className="feature-note">Branded cutting list for site or client</div>
              </td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Saved project history</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Ad-free experience</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-row-feature">
              <td className="feature-col">Priority support</td>
              <td className="check-col"><span className="check check-no">—</span></td>
              <td className="check-col"><span className="check check-pro">✓</span></td>
            </tr>

            <tr className="table-cta-row">
              <td></td>
              <td>
                <Link to="/deck" className="btn-table-diy">
                  Get Started Free
                </Link>
              </td>
              <td>
                <Link to="/deck" className="btn-table-pro">
                  Start Pro Trial
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* TESTIMONIALS */}
      <section className="social">
        <div className="section-label" style={{ color: "var(--straw)" }}>
          What People Say
        </div>
        <h2 className="section-title" style={{ color: "var(--cream)", maxWidth: 560 }}>
          Trusted by landscapers <em style={{ color: "var(--straw)" }}>and DIYers</em> alike.
        </h2>

        <div className="testimonials-grid fade-in">
          <div className="testimonial">
            <span className="testimonial-tier t-pro">Pro</span>
            <p className="testimonial-quote">
              "I used to spend 45 minutes on a cutting list before I could even price a job. Now I do it on site in two minutes. The pro deck calculator alone is worth the subscription."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar av-1">👷</div>
              <div>
                <div className="author-name">James Whitfield</div>
                <div className="author-role">Landscape Contractor · Cheshire</div>
              </div>
            </div>
          </div>

          <div className="testimonial">
            <span className="testimonial-tier t-diy">DIY</span>
            <p className="testimonial-quote">
              "Planned our whole garden patio on a Sunday afternoon. It told me exactly how many slabs to order and how much MOT to get. Didn't over-order a single bag."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar av-2">🏡</div>
              <div>
                <div className="author-name">Sarah Okonkwo</div>
                <div className="author-role">Homeowner · Surrey</div>
              </div>
            </div>
          </div>

          <div className="testimonial">
            <span className="testimonial-tier t-pro">Pro</span>
            <p className="testimonial-quote">
              "The PDF export is brilliant — I send clients a professional cutting list with every quote. It's helped me win work because it shows I've already done the homework."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar av-3">🌿</div>
              <div>
                <div className="author-name">Dan Fletcher</div>
                <div className="author-role">Garden Designer · Bristol</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="section-label">Questions</div>
        <h2 className="section-title">
          The things people <em>always ask.</em>
        </h2>

        <div className="faq-grid fade-in">
          <div className="faq-item">
            <h3 className="faq-q">Is the DIY plan really free forever?</h3>
            <p className="faq-a">
              Yes — no credit card needed, no trial period. The three core calculators
              (deck, paving, raised bed) with basic shapes are always free. We're supported
              by non-intrusive display ads on the free tier.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-q">What's the difference between DIY and Pro inputs?</h3>
            <p className="faq-a">
              DIY mode uses simplified labels and sensible defaults so you can get a result quickly
              without trade knowledge. Pro mode exposes all structural parameters — joist sizing,
              beam depths, fixing specs — for accurate professional quotes.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-q">Can I cancel Pro at any time?</h3>
            <p className="faq-a">
              Absolutely. Cancel from your account settings at any time. You'll keep Pro access until
              the end of your billing period, then drop back to the free DIY plan — with all your saved
              projects still visible.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-q">How accurate are the calculations?</h3>
            <p className="faq-a">
              Our formulas are based on standard UK trade practice. We apply a 10% waste allowance to
              materials by default. All outputs are estimates — always verify quantities before ordering
              for large projects.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-q">Do you offer a team or company plan?</h3>
            <p className="faq-a">
              Not yet, but it's on the roadmap. If you're a company with multiple landscapers, get in touch
              and we'll sort you out on a Pro plan with a company discount.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-q">Which calculators are coming next?</h3>
            <p className="faq-a">
              Fencing, retaining walls and concrete footings are in development for Pro. We're also building
              a gravel path calculator and a pergola/structure calculator. Pro subscribers vote on priority.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner" style={{ padding: "80px 48px" }}>
        <h2>
          Start calculating.{" "}
          <em style={{ fontStyle: "italic", color: "var(--fern)" }}>Stop guessing.</em>
        </h2>
        <p>
          Join thousands of landscapers and homeowners who've stopped over-ordering and started building
          with confidence.
        </p>
        <div className="cta-actions">
          <Link to="/deck" className="btn-cta-primary">
            Start Free — No Card Needed
          </Link>
          <a href="#pricing" className="btn-cta-ghost">
            Compare Plans
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <span
                style={{
                  background: "var(--moss)",
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                🌿
              </span>
              LandscapeCalc
            </div>
            <p className="footer-tagline">
              Professional landscaping calculators for tradespeople and serious DIYers across the UK.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Calculators</div>
            <ul className="footer-links">
              <li><Link to="/deck">Deck Calculator</Link></li>
              <li><Link to="/paving">Paving Calculator</Link></li>
              <li><a href="#">Raised Bed Calculator</a></li>
              <li><Link to="/fencing" style={{ color: "var(--pro-gold)" }}>Fencing (Pro)</Link></li>
              <li><a href="#" style={{ color: "var(--pro-gold)" }}>Retaining Walls (Pro)</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Roadmap</a></li>
</ul>
          </div>

          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 LandscapeCalc. All rights reserved.</span>
          <span>Made for UK landscaping 🇬🇧</span>
        </div>
      </footer>
    </>
  );
}