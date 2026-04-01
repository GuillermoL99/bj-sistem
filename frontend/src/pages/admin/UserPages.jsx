import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [creating, setCreating] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active).length;
    const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN").length;
    return { total, active, superAdmins };
  }, [users]);

  async function loadUsers() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/admin/users");
      setUsers(data.users || []);
    } catch (e) {
      setErr(e?.data?.error || "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    if (creating) return;

    setErr("");
    setCreating(true);
    try {
      await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });

      setUsername("");
      setPassword("");
      setRole("STAFF");
      await loadUsers();
    } catch (e) {
      setErr(e?.data?.error || "create_failed");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(u) {
    if (busyId || deletingId) return;

    setErr("");
    setBusyId(u.id);
    try {
      await apiFetch(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !u.active }),
      });
      await loadUsers();
    } catch (e) {
      setErr(e?.data?.error || "update_failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(u) {
    if (busyId || deletingId || creating || loading) return;

    const ok = window.confirm(`¿Eliminar el usuario "${u.username}" (${u.role})?\n\nEsta acción no se puede deshacer.`);
    if (!ok) return;

    setErr("");
    setDeletingId(u.id);
    try {
      await apiFetch(`/admin/users/${u.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      setErr(e?.data?.error || "delete_failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="adminPage">
      <Card title="Panel Super Admin" subtitle="Gestión de usuarios, roles y estado.">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge">
            <span className="dot" />
            Total: <span style={{ color: "var(--text)", fontWeight: 700 }}>{stats.total}</span>
          </span>

          <span className="badge ok">
            <span className="dot" />
            Activos: <span style={{ color: "var(--text)", fontWeight: 700 }}>{stats.active}</span>
          </span>

          <span className="badge warn">
            <span className="dot" />
            Super Admin: <span style={{ color: "var(--text)", fontWeight: 700 }}>{stats.superAdmins}</span>
          </span>

          <div style={{ marginLeft: "auto" }}>
            <button className="btn" type="button" onClick={loadUsers} disabled={loading || creating || !!busyId || !!deletingId}>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="hr" />

        {err && (
          <div className="notice error" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
            <div className="mono">{err}</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .9fr .7fr", gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Username</div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="nuevo.usuario" />
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Rol</div>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="STAFF">STAFF</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <Button variant="primary" onClick={createUser} disabled={creating || loading || !username || !password}>
              {creating ? "Creando..." : "Crear usuario"}
            </Button>
          </div>

          <p style={{ margin: 0, color: "var(--muted)" }}>
            Podés desactivar o eliminar usuarios desde la tabla.
          </p>
        </div>

        <div className="hr" />

        {loading ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>No hay usuarios para mostrar.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isToggling = busyId === u.id;
                  const isDeleting = deletingId === u.id;

                  return (
                    <tr key={u.id}>
                      <td className="mono">{u.username}</td>
                      <td>
                        <span className={`badge ${u.role === "SUPER_ADMIN" ? "warn" : ""}`}>
                          <span className="dot" />
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.active ? "ok" : "bad"}`}>
                          <span className="dot" />
                          {u.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button className="btn" type="button" onClick={() => toggleActive(u)} disabled={isToggling || isDeleting || creating || loading}>
                            {isToggling ? "Guardando..." : u.active ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            className="btn"
                            type="button"
                            onClick={() => deleteUser(u)}
                            disabled={isToggling || isDeleting || creating || loading}
                            style={{ borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.10)" }}
                          >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}