const express = require("express");
const cors = require("cors");
const app = express();
const filesRouter = require("./routes/filesRouter");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check/root route
app.get("/", (req, res) => {
  res.send("API server is running!");
});

// Main API
app.use("/api/files", filesRouter);

const PORT = 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`API running on http://0.0.0.0:${PORT}`)
);