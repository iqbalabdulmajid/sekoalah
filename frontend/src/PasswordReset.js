import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Import komponen MUI
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    CircularProgress, 
    Alert, 
    Container, 
    Paper 
} from '@mui/material';

// --- Komponen untuk Halaman Lupa Password ---
export function LupaPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Memanggil endpoint backend untuk mengecek email
            await axios.post(`${API_URL}/api/auth/check-email`, { email });
            // Jika berhasil, navigasi ke halaman update password sambil membawa data email
            navigate('/update-password', { state: { email: email } });
        } catch (err) {
            setError(err.response?.data?.error || 'Email tidak terdaftar di sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '16px' }}>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                    Lupa Password
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Masukkan email Anda untuk verifikasi.
                </Typography>
                <Box component="form" onSubmit={handleCheckEmail} noValidate sx={{ width: '100%' }}>
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
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '12px' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Lanjutkan'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

// --- Komponen untuk Halaman Update Password Baru ---
export function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email; // Ambil email dari state navigasi
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Jika pengguna datang ke halaman ini tanpa melalui halaman lupa password,
        // kembalikan mereka ke halaman login.
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            // Memanggil endpoint backend untuk memperbarui password
            const response = await axios.post(`${API_URL}/api/auth/update-password-by-email`, { email, newPassword });
            setMessage(response.data.message + " Anda akan diarahkan ke halaman login.");
            // Arahkan ke halaman login setelah 3 detik
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal memperbarui password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '16px' }}>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                    Atur Password Baru
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                    Email terverifikasi: <strong>{email}</strong>
                </Typography>
                <Box component="form" onSubmit={handleUpdatePassword} noValidate sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password Baru"
                        type="password"
                        id="password"
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {message && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '12px' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Simpan Password Baru'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

