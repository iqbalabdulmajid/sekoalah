import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";

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

// Fungsi helper untuk memformat waktu, akan digunakan di beberapa tempat
const formatTimeManual = (waktu) => {
  if (!waktu) return "-";
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const time = dayjs.utc(waktu); // Supabase biasanya simpan dalam UTC
  const adjusted = isLocalhost ? time.add(7, "hour") : time;
  return adjusted.format("HH:mm");
};


// Komponen khusus untuk dicetak
const ComponentToPrint = React.forwardRef(function ComponentToPrint({ laporan, filter }, ref) {
  return (
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
              {/* ✅ FIX: Menambahkan kolom Waktu Masuk dan Pulang */}
              <TableCell sx={{ fontWeight: "bold" }}>Waktu Masuk</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Waktu Pulang</TableCell>
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
                  {/* ✅ FIX: Menampilkan waktu masuk dan pulang */}
                  <TableCell>{formatTimeManual(item.waktu_masuk)}</TableCell>
                  <TableCell>{formatTimeManual(item.waktu_pulang)}</TableCell>
                  <TableCell align="center" sx={{ textTransform: "capitalize" }}>
                    {item.status}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
});

function LaporanPresensi() {
  const [laporan, setLaporan] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const componentRef = useRef();
  const printAreaRef = useRef();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Laporan-Presensi",
  });

  const exportToExcel = () => {
    if (laporan.length === 0) return;

    // ✅ FIX: Mengubah data ekspor untuk menyertakan waktu masuk dan pulang
    const dataToExport = laporan.map((item) => ({
      "Nama Guru": item.nama_guru,
      "Tanggal": new Date(item.tanggal).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      "Waktu Masuk": formatTimeManual(item.waktu_masuk),
      "Waktu Pulang": formatTimeManual(item.waktu_pulang),
      "Status": item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Presensi");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `Laporan_Presensi_${Date.now()}.xlsx`);
  };

  useEffect(() => {
    const fetchGurus = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_URL}/api/gurus`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGurus(response.data);
      } catch (err) {
        console.error("Gagal mengambil daftar guru:", err);
      }
    };
    fetchGurus();
  }, [token, API_URL]);

  useEffect(() => {
    const fetchLaporan = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
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
  }, [token, selectedGuru, API_URL]);

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

  const handlePrintPDF = () => {
    if (!printAreaRef.current) return;
    html2pdf().from(printAreaRef.current).save(`Laporan_Presensi_${Date.now()}.pdf`);
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
            startIcon={<PrintIcon />}
            onClick={handlePrintPDF}
            disabled={loading || laporan.length === 0}
            sx={{ whiteSpace: "nowrap" }}
          >
            Cetak PDF
          </Button>
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

      {/* Ref langsung diberikan ke komponen hasil React.forwardRef, tanpa cloneElement */}
      <div style={{ display: "none" }}>
        <div ref={printAreaRef}>
          <ComponentToPrint laporan={laporan} filter={getFilterText()} />
        </div>
      </div>

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
                {/* ✅ FIX: Menambahkan kolom Waktu Masuk dan Pulang */}
                <TableCell sx={{ fontWeight: "600" }}>Waktu Masuk</TableCell>
                <TableCell sx={{ fontWeight: "600" }}>Waktu Pulang</TableCell>
                <TableCell align="center" sx={{ fontWeight: "600" }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
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
                    {/* ✅ FIX: Menampilkan waktu masuk dan pulang */}
                    <TableCell>{formatTimeManual(item.waktu_masuk)}</TableCell>
                    <TableCell>{formatTimeManual(item.waktu_pulang)}</TableCell>
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
                  <TableCell colSpan={5} align="center">
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
