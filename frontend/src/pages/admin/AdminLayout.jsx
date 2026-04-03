import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch, clearToken, getToken } from "../../lib/api";

export default function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const [me, setMe] = useState(null);

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) {
        nav("/admin/login", { replace: true });
        return;
      }

      try {
        const data = await apiFetch("/auth/me");
        setMe(data.user);
      } catch (e) {
        clearToken();
        nav("/admin/login", { replace: true });
      }
    }
    load();
  }, [nav]);

  const homePath = useMemo(() => {
    if (!me) return "/admin/login";
    // recomendado: que el super admin caiga en Entradas
    return me.role === "SUPER_ADMIN" ? "/admin/tickets" : "/admin/scan";
  }, [me]);

  // Guard: si STAFF intenta entrar a rutas de super admin, redirigirlo
  useEffect(() => {
    if (!me) return;

    const isSuperAdminOnly =
      location.pathname.startsWith("/admin/users") ||
      location.pathname.startsWith("/admin/tickets") ||
      location.pathname.startsWith("/admin/clients");
    if (me.role !== "SUPER_ADMIN" && isSuperAdminOnly) {
      nav("/admin/scan", { replace: true });
    }
  }, [me, location.pathname, nav]);

  if (!me) {
    return (
      <div className="container">
        <div className="adminShell">
          <div className="notice">Cargando panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ width: "min(1600px, 100%)" }}>
      <div className="adminShell">
        <header className="adminHeader">
          <div className="adminTitle">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Link to={homePath} className="adminLink" style={{ textDecoration: "none" }}>
                Admin
              </Link>

              <span className={`badge ${me.role === "SUPER_ADMIN" ? "warn" : "ok"}`}>
                <span className="dot" />
                {me.role}
              </span>

              <span className="mono" style={{ color: "var(--muted)" }}>
                {me.username}
              </span>
            </div>

            <div className="adminSubtitle">
              {me.role === "SUPER_ADMIN"
                ? "Gestión y mantenimiento del sistema."
                : "Escaneo y validación de entradas."}
            </div>
          </div>

          <nav className="adminNav">
            {me.role === "SUPER_ADMIN" ? (
              <>
                <Link
                  className={
                    location.pathname.startsWith("/admin/tickets")
                      ? "adminLink active"
                      : "adminLink"
                  }
                  to="/admin/tickets"
                >
                  Entradas
                </Link>

                <Link
                  className={
                    location.pathname.startsWith("/admin/users")
                      ? "adminLink active"
                      : "adminLink"
                  }
                  to="/admin/users"
                >
                  Usuarios
                </Link>
                <Link
  className={
    location.pathname.startsWith("/admin/clients")
      ? "adminLink active"
      : "adminLink"
  }
  to="/admin/clients"
>
  Clientes
</Link>
              </>
            ) : (
              <Link
                className={
                  location.pathname.startsWith("/admin/scan")
                    ? "adminLink active"
                    : "adminLink"
                }
                to="/admin/scan"
              >
                Escanear
              </Link>
            )}

            <button
              type="button"
              className="btn adminLogout"
              onClick={() => {
                clearToken();
                nav("/admin/login", { replace: true });
              }}
            >
              Salir
            </button>
          </nav>
        </header>

        <div className="adminContent">
          <Outlet context={{ me }} />
        </div>
      </div>
    </div>
  );
}