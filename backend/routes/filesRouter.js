const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
const archiver = require("archiver");
const router = express.Router();

const upload = multer();

const dbConfig = {
  host: "localhost",
  user: "root",         // Change if your MySQL user/password is different
  password: "",
  database: "ksfhbd",
  charset: "utf8mb4"
};

// --- GET all files (with optional search) ---
router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const search = req.query.search || "";
    let rows;
    if (search) {
      const like = `%${search}%`;
      [rows] = await connection.execute(
        `SELECT ID, Name, Date, Place, Number, No_Latter, Other,
          PhotoMimeType,
          CASE WHEN Photo IS NOT NULL THEN 1 ELSE 0 END AS HasPhoto
        FROM file_stored
        WHERE
          ID LIKE ? OR
          Name LIKE ? OR
          Date LIKE ? OR
          Place LIKE ? OR
          Number LIKE ? OR
          No_Latter LIKE ? OR
          Other LIKE ?
        ORDER BY Date DESC`,
        [like, like, like, like, like, like, like]
      );
    } else {
      [rows] = await connection.execute(
        `SELECT ID, Name, Date, Place, Number, No_Latter, Other,
          PhotoMimeType,
          CASE WHEN Photo IS NOT NULL THEN 1 ELSE 0 END AS HasPhoto
        FROM file_stored
        ORDER BY Date DESC`
      );
    }
    const result = rows.map(row =>
      row.HasPhoto
        ? { ...row, PhotoUrl: `/api/files/${row.ID}/photo` }
        : { ...row, PhotoUrl: null }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- GET photo by id ---
router.get("/:id/photo", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT Photo, PhotoMimeType FROM file_stored WHERE ID = ?",
      [req.params.id]
    );
    if (rows.length > 0 && rows[0].Photo) {
      res.type(rows[0].PhotoMimeType || "application/octet-stream");
      res.send(rows[0].Photo);
    } else {
      res.status(404).send("No file");
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- POST add a file ---
router.post("/", upload.single("photo"), async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { id, name, date, place, number, no_latter, other } = req.body;
    const photo = req.file ? req.file.buffer : null;
    const mime = req.file ? req.file.mimetype : null;
    await connection.execute(
      `INSERT INTO file_stored (ID, Name, Date, Place, Number, No_Latter, Other, Photo, PhotoMimeType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, date, place, number, no_latter, other, photo, mime]
    );
    res.json({ success: true });
  } catch (err) {
    // If duplicate primary key, send a clearer error
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "ID already exists." });
    } else {
      res.status(500).json({ message: err.message });
    }
  } finally {
    if (connection) await connection.end();
  }
});

// --- PUT edit a file ---
router.put("/:id", upload.single("photo"), async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { name, date, place, number, no_latter, other } = req.body;
    const photo = req.file ? req.file.buffer : null;
    const mime = req.file ? req.file.mimetype : null;
    if (photo) {
      await connection.execute(
        `UPDATE file_stored
        SET Name=?, Date=?, Place=?, Number=?, No_Latter=?, Other=?, Photo=?, PhotoMimeType=?
        WHERE ID=?`,
        [name, date, place, number, no_latter, other, photo, mime, req.params.id]
      );
    } else {
      await connection.execute(
        `UPDATE file_stored
        SET Name=?, Date=?, Place=?, Number=?, No_Latter=?, Other=?
        WHERE ID=?`,
        [name, date, place, number, no_latter, other, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- DELETE a file ---
router.delete("/:id", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute("DELETE FROM file_stored WHERE ID = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- EXPORT all files as zip ---
router.get("/export", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT ID, Name, Date, Place, Number, No_Latter, Other, Photo, PhotoMimeType FROM file_stored`
    );
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=exported_files.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (let row of rows) {
      if (!row.Photo) continue;
      const id = row.ID;
      const name = row.Name;
      const date = row.Date ? new Date(row.Date).toISOString().slice(0, 10) : 'nodate';
      const place = row.Place || "";
      const number = row.Number || "";
      const no_latter = row.No_Latter || "";
      const other = row.Other || "";
      let ext = "bin";
      if (row.PhotoMimeType && row.PhotoMimeType.startsWith('image/')) ext = "png";
      else if (row.PhotoMimeType === 'application/pdf') ext = "pdf";
      const safe = s => (s || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safe(id)}_${safe(name)}_${date}_${safe(place)}_${safe(number)}_${safe(no_latter)}_${safe(other)}.${ext}`;
      archive.append(row.Photo, { name: fileName });
    }

    archive.finalize();
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;