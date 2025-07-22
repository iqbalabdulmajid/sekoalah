import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// MUI Components
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
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

// Komponen khusus untuk dicetak
const ComponentToPrint = React.forwardRef(({ laporan, filter }, ref) => (
  <div ref={ref} style={{ padding: "20px" }}>
    <Typography variant="h5" align="center" gutterBottom>
      Laporan Presensi Guru
    </Typography>
    <Typography variant="subtitle1" align="center" gutterBottom>
      {filter}
    </Typography>
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Nama Guru</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Tanggal</TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {laporan.length > 0 ? (
            laporan.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nama_guru}</TableCell>
                <TableCell>
                  {new Date(item.tanggal).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell align="center" sx={{ textTransform: "capitalize" }}>
                  {item.status}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} align="center">
                Tidak ada data.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
));

function LaporanPresensi() {
  const [laporan, setLaporan] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const componentRef = useRef();

  // ✅ Definisikan URL API secara dinamis di satu tempat
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fungsi cetak PDF (tidak berubah)
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Laporan-Presensi",
  });

  // Fungsi ekspor ke Excel (tidak berubah)
  const exportToExcel = () => {
    if (laporan.length === 0) return;

    const dataToExport = laporan.map((item) => ({
      "Nama Guru": item.nama_guru,
      "Tanggal": new Date(item.tanggal).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      "Jam Presensi": item.waktu_presensi
        ? new Date(item.waktu_presensi).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      "Status": item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Presensi");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `Laporan_Presensi_${Date.now()}.xlsx`);
  };

  // useEffect untuk mengambil data guru
  useEffect(() => {
    const fetchGurus = async () => {
      if (!token) return; // Jangan fetch jika tidak ada token
      try {
        // ✅ Gunakan variabel API_URL
        const response = await axios.get(`${API_URL}/api/gurus`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGurus(response.data);
      } catch (err) {
        console.error("Gagal mengambil daftar guru:", err);
      }
    };
    fetchGurus();
  }, [token, API_URL]); // Tambahkan API_URL ke dependency array

  // useEffect untuk mengambil data laporan
  useEffect(() => {
    const fetchLaporan = async () => {
      if (!token) return; // Jangan fetch jika tidak ada token
      setLoading(true);
      setError("");
      try {
        // ✅ Gunakan variabel API_URL
        const response = await axios.get(
          `${API_URL}/api/laporan/presensi?guru_id=${selectedGuru}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLaporan(response.data);
      } catch (err) {
        setError("Gagal memuat data laporan.");
        console.error("Gagal mengambil data laporan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, [token, selectedGuru, API_URL]); // Tambahkan API_URL ke dependency array

  const handleFilterChange = (event) => {
    setSelectedGuru(event.target.value);
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case "hadir":
        return "success";
      case "sakit":
        return "warning";
      case "izin":
        return "info";
      default:
        return "default";
    }
  };

  const getFilterText = () => {
    if (selectedGuru === "all") return "Semua Guru";
    const guru = gurus.find((g) => g.id === Number(selectedGuru));
    return guru ? guru.nama : "";
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", color: "#5a5c69" }}
        >
          Laporan Presensi Guru
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel>Filter Berdasarkan Nama</InputLabel>
            <Select
              value={selectedGuru}
              label="Filter Berdasarkan Nama"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">
                <em>Tampilkan Semua Guru</em>
              </MenuItem>
              {gurus.map((guru) => (
                <MenuItem key={guru.id} value={guru.id}>
                  {guru.nama}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
            disabled={loading || laporan.length === 0}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Komponen tersembunyi untuk dicetak */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <ComponentToPrint
          ref={componentRef}
          laporan={laporan}
          filter={getFilterText()}
        />
      </div>

      {/* Tabel utama */}
      <Card
        elevation={0}
        sx={{ borderRadius: "12px", border: "1px solid #e3e6f0" }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fc" }}>
                <TableCell sx={{ fontWeight: "600" }}>Nama Guru</TableCell>
                <TableCell sx={{ fontWeight: "600" }}>Tanggal</TableCell>
                <TableCell sx={{ fontWeight: "600" }}>Jam Presensi</TableCell>
                <TableCell align="center" sx={{ fontWeight: "600" }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : laporan.length > 0 ? (
                laporan.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.nama_guru}</TableCell>
                    <TableCell>
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    {/* jam absensi */}
                    <TableCell align="center">
                      {item.waktu_presensi
                        ? new Date(item.waktu_presensi).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.status}
                        color={getStatusChipColor(item.status)}
                        size="small"
                        sx={{ textTransform: "capitalize", fontWeight: "600" }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2">
                      Tidak ada data yang cocok dengan filter ini.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default LaporanPresensi;
