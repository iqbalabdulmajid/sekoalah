import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. Impor useNavigate

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate(); // 2. Panggil hook useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Gunakan environment variable untuk URL API
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`, // ✅ Bangun URL secara dinamis
        {
          email,
          password,
        }
      );

      // Simpan token ke localStorage
      localStorage.setItem("token", response.data.token);

      // 💡 Praktik Lanjutan: Panggil fungsi login dari context untuk update state global
      // auth.login(response.data.token); 

      // ✅ 3. Gunakan navigate untuk pindah halaman tanpa reload
      navigate("/"); 

    } catch (error) {
      setMessage(error.response?.data?.error || "Login gagal.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* ...- Isi form input untuk email dan password di sini -... */}
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password" 
      />
      <button type="submit">Login</button>
      {message && <p className="error">{message}</p>}
    </form>
  );
};

export default LoginPage;