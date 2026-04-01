import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, setToken } from "../../lib/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setToken(data.token);
      nav("/admin/users");
    } catch (e) {
      setError(e?.data?.error || "login_failed");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2>Admin Login</h2>
      <form onSubmit={onSubmit}>
        <label>Usuario</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%" }} />

        <label style={{ display: "block", marginTop: 12 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%" }}
        />

        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

        <button style={{ marginTop: 16, width: "100%" }}>Entrar</button>
      </form>
    </div>
  );
}