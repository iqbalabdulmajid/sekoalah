import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Home() {
  const token = localStorage.getItem('token');

  // Sebagai fallback, jika tidak ada token, arahkan ke login
  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    // Decode token untuk mendapatkan peran (role)
    const decodedToken = jwtDecode(token);
    const { role } = decodedToken;

    // Arahkan berdasarkan peran
    if (role === 'admin') {
      return <Navigate to="/admin" />;
    } else if (role === 'guru') {
      return <Navigate to="/dashboard" />;
    } else {
      // Jika peran tidak diketahui, kembali ke login
      return <Navigate to="/login" />;
    }
  } catch (error) {
    // Jika token rusak atau tidak valid
    console.error("Token tidak valid:", error);
    return <Navigate to="/login" />;
  }
}

export default Home;
