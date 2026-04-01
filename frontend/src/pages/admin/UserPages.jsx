import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");

  async function loadUsers() {
    setErr("");
    try {
      const data = await apiFetch("/admin/users");
      setUsers(data.users);
    } catch (e) {
      setErr(e?.data?.error || "load_failed");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setErr("");
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
    }
  }

  async function toggleActive(u) {
    setErr("");
    try {
      await apiFetch(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !u.active }),
      });
      await loadUsers();
    } catch (e) {
      setErr(e?.data?.error || "update_failed");
    }
  }

  return (
    <div>
      <h2>Usuarios</h2>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      <form onSubmit={createUser} style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="STAFF">STAFF</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <button>Crear</button>
      </form>

      <div style={{ marginTop: 16 }}>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Active</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{String(u.active)}</td>
                <td>
                  <button onClick={() => toggleActive(u)}>{u.active ? "Desactivar" : "Activar"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}