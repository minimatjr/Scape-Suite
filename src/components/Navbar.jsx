import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useSession } from "../auth/useSession";

function Navbar() {
  const location = useLocation();
  const { session, ready } = useSession();

  const navRef = useRef(null);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // close delay timer
  const closeTimer = useRef(null);

  // Define calculator routes once
  const calculators = useMemo(
    () => [
      { to: "/deck", label: "Deck Calculator", meta: "Free to use" },
      { to: "/paving", label: "Paving Calculator", meta: "Free to use" },
      { to: "/fencing", label: "Fencing Calculator", meta: "Free to use" },
      { to: "/concrete", label: "Concrete Calculator", meta: "Free to use" },
      { to: "/retainingwall", label: "Retaining Walls", meta: "Free to use" },
      { to: "/lawn", label: "Lawn and soil calculator", meta: "Free to use" },
    ],
    []
  );

  const isActivePath = (path) => location.pathname === path;
  const anyCalculatorActive = calculators.some((c) => isActivePath(c.to));

  useEffect(() => {
    const setNavHeight = () => {
      const height = navRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--nav-h", `${height}px`);
    };

    // initial
    setNavHeight();

    // update on resize
    window.addEventListener("resize", setNavHeight);

    // update after first paint (fonts/layout)
    const raf1 = requestAnimationFrame(setNavHeight);
    const raf2 = requestAnimationFrame(setNavHeight);

    // update after fonts load (if supported)
    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setNavHeight();
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", setNavHeight);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // hover open/close helpers
  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Close dropdown when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close dropdown on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    // session hook will update automatically
  };

  return (
    <>
      <style>{`
        /* Desktop navbar — no mobile behaviours */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 48px;
          background: rgba(251,248,241,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }

        /* Dark grey nav text */
        .nav-logo,
        .nav-link,
        .nav-button {
          color: #2f2f2f;
        }

        .nav-logo {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.2rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
        }

        .nav-logo-mark {
          width: 32px; height: 32px;
          background: #3d5c35;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          color: white;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .nav-links {
          display: flex;
          gap: 28px;
          list-style: none;
          align-items: center;
        }

        .nav-link, .nav-button {
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 8px 10px;
          border-radius: 10px;
          font-family: 'Barlow', sans-serif;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease;
        }

        .nav-link:hover,
        .nav-button:hover {
          color: #3d5c35;
          background: rgba(0,0,0,0.04);
        }

        /* Active nav item styling */
        .nav-active {
          color: #1f1f1f;
          background: rgba(61,92,53,0.08);
          font-weight: 600;
        }

        /* Dropdown */
        .dd-wrap { 
          position: relative; 
          padding-bottom: 12px; /* bridge the space between button and menu */
        }

        .nav-button-inner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .caret {
          display: inline-block;
          width: 10px;
          height: 10px;
          transform: rotate(0deg);
          transition: transform 180ms ease;
        }
        .caret.open {
          transform: rotate(180deg);
        }

        /* Animation: fade + slide */
        .dd-menu {
          position: absolute;
          top: 100%;
          margin-top: 12px;

          left: 0;
          min-width: 280px;
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 14px;
          box-shadow: 0 22px 60px rgba(0,0,0,0.14);
          padding: 8px;
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .dd-menu.open {
          opacity: 1;
          transform: translateY(0px);
          pointer-events: auto;
        }

        /* Small "arrow" */
        .dd-menu::before {
          content: "";
          position: absolute;
          top: -7px;
          left: 18px;
          width: 12px;
          height: 12px;
          background: rgba(255,255,255,0.98);
          border-left: 1px solid rgba(0,0,0,0.08);
          border-top: 1px solid rgba(0,0,0,0.08);
          transform: rotate(45deg);
        }

        .dd-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration: none;
          color: #2f2f2f;
          font-family: 'Barlow', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          transition: background 160ms ease, transform 160ms ease;
        }

        .dd-item:hover {
          background: rgba(61,92,53,0.08);
          transform: translateY(-1px);
        }

        .dd-item small {
          font-weight: 600;
          color: #6b6b6b;
          font-size: 0.72rem;
          letter-spacing: 0.04em;
        }

        /* Active calculator in dropdown */
        .dd-item.active {
          background: rgba(61,92,53,0.12);
        }

        /* Coming soon items */
        .dd-item.disabled {
          color: #9a9a9a;
          cursor: not-allowed;
          pointer-events: none;
          background: transparent;
          transform: none;
        }

        .dd-item.disabled small {
          color: #b5b5b5;
        }

        .coming-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 999px;
          background: #efefef;
          color: #888;
        }

        .nav-cta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-nav {
          padding: 9px 22px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 650;
          letter-spacing: 0.04em;
          cursor: pointer;
          text-decoration: none;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease;
          font-family: 'Barlow', sans-serif;
          display: inline-block;
        }

        .btn-outline {
          border: 1.5px solid #2f2f2f;
          color: #2f2f2f;
          background: transparent;
        }

        .btn-outline:hover {
          background: #2f2f2f;
          color: white;
          transform: translateY(-1px);
        }

        .btn-solid {
          border: 1.5px solid #3d5c35;
          background: #3d5c35;
          color: white;
        }

        .btn-solid:hover {
          background: #2f2f2f;
          border-color: #2f2f2f;
          transform: translateY(-1px);
        }
      `}</style>

      <nav ref={navRef}>
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark">🌿</span>
          LandscapeCalc
        </Link>

        <ul className="nav-links">
          {/* Dropdown */}
          <li
            className="dd-wrap"
            ref={wrapRef}
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            <button
              className={`nav-button ${anyCalculatorActive ? "nav-active" : ""}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="nav-button-inner">
                Calculators
                <span className={`caret ${open ? "open" : ""}`}>▾</span>
              </span>
            </button>

            <div
              className={`dd-menu ${open ? "open" : ""}`}
              role="menu"
              onMouseEnter={openNow}
              onMouseLeave={closeSoon}
            >
              {calculators.map((c) => (
                <Link
                  key={c.to}
                  to={c.to}
                  className={`dd-item ${isActivePath(c.to) ? "active" : ""}`}
                  role="menuitem"
                >
                  {c.label} <small>{c.meta}</small>
                </Link>
              ))}

              <div className="dd-item disabled">
                Driveway Calculator{" "}
                <span className="coming-badge">Coming Soon</span>
              </div>

              <div className="dd-item disabled">
                Raised Beds Calculator{" "}
                <span className="coming-badge">Coming Soon</span>
              </div>

              <div className="dd-item disabled">
                Retaining Wall Calculator{" "}
                <span className="coming-badge">Coming Soon</span>
              </div>
            </div>
          </li>

          <li>
            <a className="nav-link" href="#pricing">Pricing</a>
          </li>
          <li>
            <a className="nav-link" href="#faq">FAQ</a>
          </li>

          {/* Optional: show paperwork link only when logged in */}
          {ready && session && (
            <li>
              <Link className="nav-link" to="/paperwork/landing">
                Paperwork
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-cta">
          <a href="#pricing" className="btn-nav btn-outline">
            See Plans
          </a>
          <Link to="/deck" className="btn-nav btn-solid">
            Start Free
          </Link>

          {/* ✅ Login / Logout */}
          {ready && (
            session ? (
              <button type="button" className="btn-nav btn-outline" onClick={onLogout}>
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn-nav btn-outline">
                Login
              </Link>
            )
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;