import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Impor komponen penjaga
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Impor Layouts
import AdminLayout from './AdminLayout';

// Impor Halaman
import Home from './Home';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import AdminPanel from './AdminPanel';
import ManajemenJadwal from './ManajemenJadwal';
import LaporanPresensi from './LaporanPresensi';
import LaporanMengajar from './LaporanMengajar';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<LoginPage />} />
        {/* Mengarahkan halaman root ke /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Rute "Penengah" setelah login */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Rute Dasbor khusus untuk Guru */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Rute khusus untuk Admin dengan Layout terpusat */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          } 
        >
          {/* Halaman default untuk /admin */}
          <Route index element={<AdminPanel />} /> 
          <Route path="jadwal" element={<ManajemenJadwal />} />
          <Route path="laporan" element={<LaporanPresensi />} />
          <Route path="laporan-guru" element={<LaporanMengajar />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
