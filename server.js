const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files for the frontend (React build)
app.use(express.static(path.join(__dirname, "client/dist")));

// Basic exclusion list
const EXCLUDED_FOLDERS = [
  "오디오",
  "node_modules",
  "public",
  ".git",
  ".agent",
  "web-viewer",
  "client",
];

// Helper to check if folder is valid content folder
const isContentFolder = (name) => {
  return !EXCLUDED_FOLDERS.includes(name) && !name.startsWith(".");
};

// Dynamically get folders
const getFolders = () => {
  return fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((item) => item.isDirectory() && isContentFolder(item.name))
    .map((item) => item.name);
};

// Serve all content folders statically
// We can't know them ahead of time easily for static serving if they change,
// but we can serve the root with a middleware that checks content folders.
// Or just iterate current ones on startup.
const startupFolders = getFolders();
startupFolders.forEach((folder) => {
  app.use(`/${folder}`, express.static(path.join(__dirname, folder)));
});

// Also middleware to serve any new folders dynamically if needed? (Overkill maybe, prompt says "daily git pull", implies restart or refresh is fine).
// Actually if they git pull, the server might need restart to pick up new *folders* for static serving if we use `app.use`.
// Better to use a catch-all static or dynamic handler for images.
// Let's stick to startup scanning. Node server restart is fast/easy.

// Helper to get excluded items (basic ones)
const isExcluded = (name) => {
  return (
    name.startsWith(".") ||
    name === "node_modules" ||
    name === "public" ||
    name === "오디오"
  );
};

// Parse date from filename like "2024-08-22-17:54:25.md"
const parseDateFromFilename = (filename) => {
  const match = filename.replace(".md", "").match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, min, sec] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}+09:00`);
};

// API to get list of categories (folders)
app.get("/api/folders", (req, res) => {
  try {
    const folders = getFolders().map((name) => {
      const folderPath = path.join(__dirname, name);
      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".md"))
        .sort((a, b) => b.localeCompare(a));

      const latestDate = files.length > 0 ? parseDateFromFilename(files[0]) : null;
      return { name, latestDate };
    });
    res.json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read directories" });
  }
});

// API to list files in a category
app.get("/api/files/:folder", (req, res) => {
  const { folder } = req.params;
  if (!isContentFolder(folder)) {
    return res.status(403).json({ error: "Folder not allowed" });
  }

  const folderPath = path.join(__dirname, folder);
  try {
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "Folder not found" });
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".md"))
      .sort((a, b) => {
        // Sort by name descending (assuming date format like 2025-12-22...)
        return b.localeCompare(a);
      });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read files" });
  }
});

// API to get file content
app.get("/api/content/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;

  // Security check: simple inclusion check in "allowed" folders isn't enough if we don't normalize
  // But isContentFolder checks against readdir output?
  // Let's first resolve the correct folder name on disk (handling NFD/NFC)

  try {
    const rootItems = fs.readdirSync(__dirname, { withFileTypes: true });
    const diskFolder = rootItems.find(
      (item) =>
        item.isDirectory() &&
        item.name.normalize("NFC") === folder.normalize("NFC")
    );

    if (!diskFolder || !isContentFolder(diskFolder.name)) {
      return res.status(403).json({ error: "Folder not allowed or not found" });
    }

    const folderPath = path.join(__dirname, diskFolder.name);
    if (!fs.existsSync(folderPath)) {
      // Should not happen if readdir found it
      return res.status(404).json({ error: "Folder path invalid" });
    }

    // Now find the file inside this folder handling normalization
    const files = fs.readdirSync(folderPath);
    const diskFilename = files.find(
      (f) => f.normalize("NFC") === filename.normalize("NFC")
    );

    if (!diskFilename) {
      console.log(`File not found: ${filename} in ${diskFolder.name}`);
      console.log(`Available files (first 5): ${files.slice(0, 5).join(", ")}`);
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(folderPath, diskFilename);
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content });
  } catch (err) {
    console.error("Error reading file:", err);
    res.status(500).json({ error: "Failed to read file: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(
    `Open your browser to http://localhost:${PORT} to view your files.`
  );
});
