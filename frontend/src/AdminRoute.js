import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // Jika tidak ada token sama sekali
    return <Navigate to="/login" />;
  }

  try {
    // Decode token untuk mendapatkan informasi di dalamnya (payload)
    const decodedToken = jwtDecode(token);

    // Cek apakah peran pengguna adalah 'admin'
    if (decodedToken.role !== "admin") {
      // Jika bukan admin, tendang ke halaman utama (atau halaman "unauthorized")
      return <Navigate to="/" />;
    }

    // Jika dia adalah admin, izinkan akses
    return children;
  } catch (error) {
    // Jika token tidak valid atau rusak
    console.error("Token tidak valid:", error);
    return <Navigate to="/login" />;
  }
}

export default AdminRoute;
