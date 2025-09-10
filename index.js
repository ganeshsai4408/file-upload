const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const methodOverride = require("method-override");
const path = require("path");
const app = express();

app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/fileUploads");
const conn = mongoose.connection;

let bucket;
conn.once("open", () => {
  console.log("✅ MongoDB connected");
  bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
});

// Multer Storage (Memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Route
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded!");

  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype,
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on("finish", () => {
    console.log(`✅ File uploaded: ${req.file.originalname}`);
    res.redirect("/");
  });

  uploadStream.on("error", (err) => {
    console.error(err);
    res.status(500).send("Upload failed!");
  });
});

// Homepage Route
app.get("/", async (req, res) => {
  try {
    const files = [];
    const cursor = bucket.find();
    for await (const file of cursor) {
      file.isImage = file.contentType && file.contentType.startsWith("image/");
      files.push(file);
    }
    res.render("homepage", { files });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching files");
  }
});

// Route to Serve Images
app.get("/image/:filename", async (req, res) => {
  try {
    const file = await bucket.find({ filename: req.params.filename }).next();

    if (!file) {
      return res.status(404).send("File not found");
    }

    if (!file.contentType.startsWith("image/")) {
      return res.status(400).send("Not an image");
    }

    const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
    downloadStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving image");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
