import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MdEdit, MdDelete, MdFileUpload, MdFileDownload } from "react-icons/md";
import "./App.css";

const API = "http://localhost:4000/api/files";
const emptyForm = {
  id: "",
  name: "",
  date: "",
  place: "",
  number: "",
  no_latter: "",
  other: "",
  file: null,
};

function App() {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [search, setSearch] = useState("");
  const [previewImg, setPreviewImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Fetch files on mount and when search changes
  useEffect(() => {
    fetchFiles(search);
    // eslint-disable-next-line
  }, [search]);

  const fetchFiles = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}${query ? "?search=" + encodeURIComponent(query) : ""}`);
      setFiles(res.data);
    } catch (e) {
      setError("Failed to fetch files: " + (e.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  // Form input handler
  const onChange = e => {
    const { name, value, files: f } = e.target;
    if (name === "file") {
      setForm({ ...form, file: f[0] });
      if (f[0] && f[0].type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImg(reader.result);
        reader.readAsDataURL(f[0]);
      } else {
        setPreviewImg(null);
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Add new file
  const handleAdd = async () => {
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("id", form.id);
      data.append("name", form.name);
      data.append("date", form.date);
      data.append("place", form.place);
      data.append("number", form.number);
      data.append("no_latter", form.no_latter);
      data.append("other", form.other);
      if (form.file) data.append("photo", form.file);
      await axios.post(API, data);
      await fetchFiles();
      handleClear();
    } catch (e) {
      setError("Failed to add file: " + (e.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  // Edit file
  const handleEdit = async () => {
    if (!selectedRow) return;
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("date", form.date);
      data.append("place", form.place);
      data.append("number", form.number);
      data.append("no_latter", form.no_latter);
      data.append("other", form.other);
      if (form.file) data.append("photo", form.file);
      await axios.put(`${API}/${form.id}`, data);
      await fetchFiles();
      handleClear();
    } catch (e) {
      setError("Failed to update file: " + (e.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  // Delete file
  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    setLoading(true);
    setError("");
    try {
      await axios.delete(`${API}/${id}`);
      await fetchFiles();
      handleClear();
    } catch (e) {
      setError("Failed to delete file: " + (e.response?.data?.message || e.message));
    }
    setLoading(false);
  };

  // Clear form
  const handleClear = () => {
    setForm(emptyForm);
    setSelectedRow(null);
    setPreviewImg(null);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Search
  const handleSearch = e => {
    setSearch(e.target.value);
  };

  // Edit button in table
  const onEditRow = row => {
    setForm({
      id: row.ID,
      name: row.Name,
      date: row.Date ? row.Date.slice(0, 10) : "",
      place: row.Place,
      number: row.Number,
      no_latter: row.No_Latter || "",
      other: row.Other,
      file: null,
    });
    setPreviewImg(row.PhotoUrl ? `http://localhost:4000${row.PhotoUrl}` : null);
    setSelectedRow(row.ID);
    setIsEditing(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Export
  const handleExport = () => {
    window.open(`${API}/export`, "_blank");
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <img src="/logo-ksfh.svg" alt="Logo" className="logo" />
      </div>
      <div className="main-panel">
        <div className="sticky-top">
          <div className="header">រដ្ឋបាលនៃមន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត</div>
          {error && <div className="error-banner">{error}</div>}
          {loading && <div className="loading-banner">Loading...</div>}
          <div className="form-section">
            <div className="input-group">
              <div>
                <div className="input-label">លេខសំគាល់</div>
                <input name="id" className="input-field" value={form.id} onChange={onChange} disabled={isEditing} />
              </div>
              <div>
                <div className="input-label">ឈ្មោះ</div>
                <input name="name" className="input-field" value={form.name} onChange={onChange} />
              </div>
              <div>
                <div className="input-label">កាលបរិច្ឆេទ</div>
                <input name="date" className="input-field" type="date" value={form.date} onChange={onChange} />
              </div>
              <div>
                <div className="input-label">ចំនួន</div>
                <input name="number" className="input-field" value={form.number} onChange={onChange} />
              </div>
              <div>
                <div className="input-label">កន្លែង</div>
                <input name="place" className="input-field" value={form.place} onChange={onChange} />
              </div>
              <div>
                <div className="input-label">លេខលិខិត​</div>
                <input name="no_latter" className="input-field" value={form.no_latter} onChange={onChange} />
              </div>
              <div>
                <div className="input-label">ផ្សេងៗ</div>
                <input name="other" className="input-field" value={form.other} onChange={onChange} />
              </div>
              <div>
                <div className="input-label">ឯកសារ</div>
                <input
                  name="file"
                  className="input-field"
                  type="file"
                  onChange={onChange}
                  ref={fileInputRef}
                  accept="image/*,application/pdf"
                />
              </div>
            </div>
            <div className="image-preview">
              {previewImg ? (
                <img src={previewImg} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <span>NO IMAGE<br />FOUND</span>
              )}
            </div>
          </div>
          <div className="button-row">
            <button className="btn btn-clear" onClick={handleClear}>Clear</button>
            {!isEditing ? (
              <button
                className="btn btn-add"
                onClick={handleAdd}
                disabled={
                  !form.id || !form.name || !form.date || loading
                }
              >Add</button>
            ) : (
              <button
                className="btn btn-add"
                onClick={handleEdit}
                disabled={!form.id || !form.name || !form.date || loading}
              >Update</button>
            )}
            <button className="btn btn-export" onClick={handleExport}>
              <MdFileDownload style={{ verticalAlign: "middle" }} /> Export
            </button>
            <input
              type="text"
              className="input-field"
              value={search}
              onChange={handleSearch}
              placeholder="Search"
              style={{ marginLeft: 16 }}
            />
          </div>
        </div>
        <div className="table-scroll-area">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>លេខសំគាល់</th>
                <th>ឈ្មោះ</th>
                <th>កាលបរិច្ឆេទ</th>
                <th>ឯកសារ</th>
                <th>ចំនួន</th>
                <th>កន្លែង</th>
                <th>លេខលិខិត​</th>
                <th>ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody>
              {files.map(row => (
                <tr key={row.ID} className={selectedRow === row.ID ? "selected" : ""}>
                  <td>
                    <button
                      className="icon-btn btn-edit"
                      title="Edit"
                      onClick={() => onEditRow(row)}
                      style={{ marginRight: 4 }}
                    >
                      <MdEdit />
                    </button>
                    <button
                      className="icon-btn btn-delete"
                      title="Delete"
                      onClick={() => handleDelete(row.ID)}
                    >
                      <MdDelete />
                    </button>
                  </td>
                  <td>{row.ID}</td>
                  <td>{row.Name}</td>
                  <td>{row.Date && row.Date.slice(0, 10).split('-').reverse().join('/')}</td>
                  <td>
                    {row.PhotoUrl ? (
                      <img
                        src={`http://localhost:4000${row.PhotoUrl}`}
                        alt="Preview"
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                    ) : (
                      <span>No Image</span>
                    )}
                  </td>
                  <td>{row.Number}</td>
                  <td>{row.Place}</td>
                  <td>{row.No_Latter}</td>
                  <td>{row.Other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;