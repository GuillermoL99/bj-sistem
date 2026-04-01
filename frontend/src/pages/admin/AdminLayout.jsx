import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { apiFetch, clearToken, getToken } from "../../lib/api";

export default function AdminLayout() {
  const nav = useNavigate();
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

  if (!me) return <div style={{ padding: 20 }}>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <strong>Admin</strong> — {me.username} ({me.role})
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/admin/users">Usuarios</Link>
          <button
            onClick={() => {
              clearToken();
              nav("/admin/login", { replace: true });
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <Outlet context={{ me }} />
    </div>
  );
}