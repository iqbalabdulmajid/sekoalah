import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Link,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

function LaporanMengajar() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/presensi/laporan/semua`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLaporan(response.data);
    } catch (err) {
      setError("Gagal memuat data laporan mengajar.");
      console.error("Gagal mengambil data laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMateri = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: "bold", color: "#5a5c69", mb: 3 }}
      >
        Laporan Mengajar Guru
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fc" }}>
                <TableCell
                  sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}
                >
                  Tanggal
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}
                >
                  Nama Guru
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}
                >
                  Kelas
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}
                >
                  Materi
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "600", color: "text.secondary", border: 0 }}
                >
                  Lampiran
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : laporan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Belum ada laporan mengajar.
                  </TableCell>
                </TableRow>
              ) : (
                laporan.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{item.guru_nama}</TableCell>

                    <TableCell>{item.laporan?.["0"]?.kelas || "-"}</TableCell>
                    <TableCell>{item.laporan?.["0"]?.materi || "-"}</TableCell>

                    const baseUrl = "http://localhost:5000"; // ganti sesuai port backend kamu

const handleDownloadMateri = (filePath) => {
  const filename = filePath.split('\\').pop(); // ambil nama file dari path lokal
  const url = `${baseUrl}/uploads/materi/${filename}`;
  window.open(url, "_blank");
};

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default LaporanMengajar;
