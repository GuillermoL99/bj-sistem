import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch, setToken } from "../../lib/api";

export default function AdminLogin() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setToken(data.token);
      nav("/admin/users");
    } catch (e) {
      setError(e?.data?.error || "login_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 460, margin: "28px auto 0" }}>
        <Card title="Administración" subtitle="Ingresá con tus credenciales para acceder al panel.">
          <form onSubmit={onSubmit}>
            <div className="row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
              <label className="label" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="tu.usuario"
                disabled={loading}
              />
            </div>

            <div className="row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6, marginTop: 12 }}>
              <label className="label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="notice error" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>No se pudo iniciar sesión</div>
                <div className="mono">{error}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <Button variant="primary" disabled={loading || !username || !password}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </div>

              <Link className="btn" to="/" style={{ textDecoration: "none" }}>
                Volver
              </Link>
            </div>

            
          </form>
        </Card>
      </div>
    </Layout>
  );
}