import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // 1. Impor useNavigate

import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Paper 
} from "@mui/material";


function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // 2. Panggil hook useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
     // ✅ 3. Gunakan navigate untuk pindah halaman tanpa reload
      navigate("/"); 
    } catch (error) {
      setMessage(error.response?.data?.error || "Login gagal.");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Typography component="h1" variant="h5">
          Login Sistem Presensi
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Alamat Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {message && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {message}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate("/lupa-password")}
          >
            Lupa Password?
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
