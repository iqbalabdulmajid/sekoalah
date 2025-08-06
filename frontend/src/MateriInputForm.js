import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import axios from "axios";

const MateriInputForm = ({
  absensiId,
  guruId,
  tanggal,
  kelasList = [],
  onSuccess,
}) => {
  const [materiList, setMateriList] = useState([{ kelas: "", materi: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (idx, field, value) => {
    setMateriList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleAdd = () => {
    setMateriList((prev) => [...prev, { kelas: "", materi: "" }]);
  };

  const handleRemove = (idx) => {
    setMateriList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const materiFiltered = materiList.filter((m) => m.kelas && m.materi);
    if (materiFiltered.length === 0) {
      setError("Isi minimal satu materi dan kelas.");
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const formData = new FormData();

      formData.append("guru_id", guruId);
      formData.append("absensi_id", absensiId);
      formData.append("tanggal", tanggal);

      // 🔁 Ubah array menjadi object
      const laporanObject = {};
      materiFiltered.forEach((item, index) => {
        laporanObject[index] = item;
      });

      formData.append("laporan", JSON.stringify(laporanObject));

      // Tambahkan file jika ada
      const fileInput = document.getElementById("materi-file-upload");
      const file = fileInput.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setError("Ukuran file tidak boleh lebih dari 5MB");
          setLoading(false);
          return;
        }
        formData.append("materiFile", file);
      }

      await axios.post(`${API_URL}/api/presensi/laporan`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Laporan materi berhasil disimpan!");
      setMateriList([{ kelas: "", materi: "" }]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal menyimpan laporan materi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Input Laporan Materi Mengajar Hari Ini
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <Box sx={{ mb: 3 }}>
          <input
            accept="application/pdf"
            type="file"
            id="materi-file-upload"
            style={{ display: "none" }}
          />
          <label htmlFor="materi-file-upload">
            <Button
              component="span"
              variant="outlined"
              startIcon={<UploadIcon />}
              sx={{ mr: 2 }}
            >
              Upload Materi (PDF)
            </Button>
          </label>
          <Typography variant="caption" color="textSecondary">
            Opsional, maks. 5MB
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {materiList.map((item, idx) => (
            <React.Fragment key={idx}>
              <Grid item xs={5}>
                <FormControl fullWidth required>
                  <InputLabel>Kelas</InputLabel>
                  <Select
                    value={item.kelas}
                    label="Kelas"
                    onChange={(e) => handleChange(idx, "kelas", e.target.value)}
                  >
                    {kelasList.length > 0
                      ? kelasList.map((kls) => (
                          <MenuItem key={kls} value={kls}>
                            {kls}
                          </MenuItem>
                        ))
                      : [1, 2, 3, 4, 5, 6].map((num) => (
                          <MenuItem key={num} value={num.toString()}>
                            {num}
                          </MenuItem>
                        ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Materi yang Diajarkan"
                  value={item.materi}
                  onChange={(e) =>
                    handleChange(idx, "materi", e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={1} sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  color="error"
                  onClick={() => handleRemove(idx)}
                  disabled={materiList.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </React.Fragment>
          ))}
        </Grid>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={materiList.length >= 10}
          >
            Tambah Baris
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ ml: "auto" }}
          >
            Simpan Laporan
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default MateriInputForm;
