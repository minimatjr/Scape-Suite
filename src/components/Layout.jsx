import Navbar from "../components/Navbar";

export default function Layout({ children }) {
  return (
    <div className="appShell">
      <Navbar />
      <main className="appMain">{children}</main>

      <style>{`

        html, body { height: 100%; }
        body { margin: 0; }

        .appShell{
          height: 100dvh;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          overflow: hidden; /* keep clipping at shell, main will scroll */
        }

        .appMain{
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .appMain > * {
          min-height: 0;
        }
      `}</style>
    </div>
  );
}