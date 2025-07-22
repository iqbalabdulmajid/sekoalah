import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // Cek apakah ada token di localStorage
  const token = localStorage.getItem('token');

  // Jika tidak ada token, arahkan (redirect) ke halaman login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Jika ada token, tampilkan komponen yang diminta (halaman)
  return children;
}

export default ProtectedRoute;