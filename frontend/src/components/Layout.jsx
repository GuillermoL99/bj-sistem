import { useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const nav = useNavigate();

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1>BIG JIM BAR</h1>
            <p>Entradas · Checkout seguro</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="badge">
            <span className="dot" />
            <span>Mercado Pago</span>
          </div>

          <button
            type="button"
            onClick={() => nav("/admin/login")}
            title="Administración"
            aria-label="Administración"
            className="badge adminBadge"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}