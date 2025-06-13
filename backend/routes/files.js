const express = require('express');
const archiver = require('archiver'); // npm install archiver
const router = express.Router();

// ...your SQL connection and other routes

router.get('/api/files/export', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT ID, Name, Date, Place, Number, Other, Photo, PhotoMimeType FROM file_stored`;

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=exported_files.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (let row of result.recordset) {
      if (!row.Photo) continue;
      const id = row.ID;
      const name = row.Name;
      const date = row.Date ? new Date(row.Date).toISOString().slice(0, 10) : 'nodate';
      const place = row.Place || "";
      const number = row.Number || "";
      const other = row.Other || "";
      const ext = row.PhotoMimeType && row.PhotoMimeType.startsWith('image/') ? 'png'
                    : row.PhotoMimeType === 'application/pdf' ? 'pdf'
                    : 'bin';
      // Clean up file name parts
      const safe = s => (s || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safe(id)}_${safe(name)}_${date}_${safe(place)}_${safe(number)}_${safe(other)}.${ext}`;
      archive.append(row.Photo, { name: fileName });
    }

    archive.finalize();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;