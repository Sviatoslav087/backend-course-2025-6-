const { program } = require("commander");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

program
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <port>", "Server port")
  .requiredOption("-c, --cache <path>", "Cache directory");

program.parse();
const options = program.opts();

// Створити кеш директорію якщо не існує
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache);
}

const app = express();

// використання JSON 
app.use(express.json());

// Статичні файли (для фото)
app.use("/photos", express.static(path.join(options.cache)));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, options.cache),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// Файл з даними
const DB_FILE = "inventory.json";

//  Допоміжна функція для читання/запису
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

//  -------- POST /register --------------
app.post("/register", upload.single("photo"), (req, res) => {
  const { inventory_name, description } = req.body;

  if (!inventory_name) {
    return res.status(400).json({ error: "Inventory name is required" });
  }

  const db = readDB();

  const newItem = {
    id: Date.now(),
    name: inventory_name,
    description: description || "",
    photo: req.file ? "/photos/" + req.file.filename : null
  };

  db.push(newItem);
  writeDB(db);

  res.status(201).json(newItem);
});

//  -------- GET /inventory --------------
app.get("/inventory", (req, res) => {
  res.json(readDB());
});

// -------- GET /inventory/:id --------------
app.get("/inventory/:id", (req, res) => {
  const db = readDB();
  const item = db.find(x => x.id == req.params.id);

  if (!item) return res.sendStatus(404);

  res.json(item);
});

//  -------- PUT /inventory/:id --------------
app.put("/inventory/:id", (req, res) => {
  const db = readDB();
  const item = db.find(x => x.id == req.params.id);

  if (!item) return res.sendStatus(404);

  if (req.body.name) item.name = req.body.name;
  if (req.body.description) item.description = req.body.description;

  writeDB(db);
  res.json(item);
});

//  -------- GET /inventory/:id/photo --------------
app.get("/inventory/:id/photo", (req, res) => {
  const db = readDB();
  const item = db.find(x => x.id == req.params.id);

  if (!item || !item.photo) return res.sendStatus(404);

  res.sendFile(path.join(__dirname, item.photo));
});

//  -------- PUT /inventory/:id/photo --------------
app.put("/inventory/:id/photo", upload.single("photo"), (req, res) => {
  const db = readDB();
  const item = db.find(x => x.id == req.params.id);

  if (!item) return res.sendStatus(404);

  if (req.file) item.photo = "/photos/" + req.file.filename;

  writeDB(db);
  res.json(item);
});

//  -------- DELETE /inventory/:id --------------
app.delete("/inventory/:id", (req, res) => {
  let db = readDB();
  const index = db.findIndex(x => x.id == req.params.id);

  if (index === -1) return res.sendStatus(404);

  db.splice(index, 1);
  writeDB(db);

  res.json({ message: "Deleted" });
});

//  HTML сторінки
app.get("/RegisterForm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "RegisterForm.html"));
});

app.get("/SearchForm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "SearchForm.html"));
});

//  -------- POST /search --------------
app.post("/search", express.urlencoded({ extended: true }), (req, res) => {
  const { id, has_photo } = req.body;
  const db = readDB();

  const item = db.find(x => x.id == id);
  if (!item) return res.sendStatus(404);

  if (has_photo) {
    item.description += ` (photo: ${item.photo})`;
  }
  res.json(item);
});

// Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Запуск сервера
app.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});

