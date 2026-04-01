import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Result from "./pages/Result";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import UsersPage from "./pages/admin/UserPages";
import ScanPage from "./pages/admin/ScanPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/scan" replace />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>

      <Route path="/success" element={<Result />} />
      <Route path="/pending" element={<Result />} />
      <Route path="/failure" element={<Result />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}