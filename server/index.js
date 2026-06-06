import express from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import database, { serializeItem } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(__dirname, "..");
const uploadsDirectory = path.join(rootDirectory, "public/uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadsDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extension}`;
    callback(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_request, file, callback) => {
    callback(file.mimetype.startsWith("image/") ? null : new Error("Envie apenas arquivos de imagem."), true);
  }
});

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDirectory));
app.use("/images", express.static(path.join(rootDirectory, "public/images")));

const allowedStatuses = new Set(["available", "claimed", "expired", "donated"]);

function parseImages(request) {
  let existing = [];
  try {
    existing = JSON.parse(request.body.existingImages || "[]");
  } catch {
    existing = [];
  }
  const uploaded = (request.files || []).map((file) => `/uploads/${file.filename}`);
  return [...existing, ...uploaded].slice(0, 5);
}

function validateItem(body, images) {
  const required = ["name", "category", "description", "location", "foundDate", "registeredBy"];
  const missing = required.filter((field) => !String(body[field] || "").trim());
  if (missing.length) return `Preencha os campos obrigatórios: ${missing.join(", ")}.`;
  if (!images.length) return "Adicione ao menos uma foto do item.";
  return null;
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", database: "sqlite" });
});

app.post("/api/auth/login", (request, response) => {
  const { email, password } = request.body;
  if (email === "funcionario@pucpr.br" && password === "pucpr") {
    return response.json({
      user: { name: "Marina Alves", email, role: "staff", location: "Bloco 10" }
    });
  }
  return response.status(401).json({ message: "E-mail ou senha inválidos." });
});

app.get("/api/stats", (_request, response) => {
  const rows = database.prepare("SELECT status, COUNT(*) AS total FROM items GROUP BY status").all();
  const stats = { total: 0, available: 0, claimed: 0, expired: 0, donated: 0 };
  for (const row of rows) {
    stats[row.status] = row.total;
    stats.total += row.total;
  }
  response.json(stats);
});

app.get("/api/items", (request, response) => {
  const {
    q = "",
    status = "all",
    category = "all",
    location = "all",
    sort = "newest",
    dateFrom = "",
    dateTo = ""
  } = request.query;

  const where = [];
  const parameters = {};

  if (q.trim()) {
    where.push("(name LIKE @search OR description LIKE @search OR category LIKE @search OR location LIKE @search)");
    parameters.search = `%${q.trim()}%`;
  }
  if (allowedStatuses.has(status)) {
    where.push("status = @status");
    parameters.status = status;
  }
  if (category !== "all") {
    where.push("category = @category");
    parameters.category = category;
  }
  if (location !== "all") {
    where.push("location = @location");
    parameters.location = location;
  }
  if (dateFrom) {
    where.push("found_date >= @dateFrom");
    parameters.dateFrom = dateFrom;
  }
  if (dateTo) {
    where.push("found_date <= @dateTo");
    parameters.dateTo = dateTo;
  }

  const orderBy = sort === "oldest"
    ? "found_date ASC, id ASC"
    : sort === "name"
      ? "name COLLATE NOCASE ASC"
      : "found_date DESC, id DESC";

  const sql = `
    SELECT * FROM items
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${orderBy}
  `;
  const items = database.prepare(sql).all(parameters).map(serializeItem);
  response.json({ items, total: items.length });
});

app.get("/api/items/:id", (request, response) => {
  const item = serializeItem(database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id));
  if (!item) return response.status(404).json({ message: "Item não encontrado." });
  return response.json(item);
});

app.post("/api/items", upload.array("images", 5), (request, response) => {
  const images = parseImages(request);
  const validationError = validateItem(request.body, images);
  if (validationError) return response.status(400).json({ message: validationError });

  const result = database.prepare(`
    INSERT INTO items
      (name, category, description, location, found_date, registered_by, status, images)
    VALUES (@name, @category, @description, @location, @foundDate, @registeredBy, 'available', @images)
  `).run({
    name: request.body.name.trim(),
    category: request.body.category,
    description: request.body.description.trim(),
    location: request.body.location,
    foundDate: request.body.foundDate,
    registeredBy: request.body.registeredBy.trim(),
    images: JSON.stringify(images)
  });

  const item = serializeItem(database.prepare("SELECT * FROM items WHERE id = ?").get(result.lastInsertRowid));
  return response.status(201).json(item);
});

app.put("/api/items/:id", upload.array("images", 5), (request, response) => {
  const existingItem = database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id);
  if (!existingItem) return response.status(404).json({ message: "Item não encontrado." });

  const images = parseImages(request);
  const validationError = validateItem(request.body, images);
  if (validationError) return response.status(400).json({ message: validationError });

  database.prepare(`
    UPDATE items SET
      name = @name,
      category = @category,
      description = @description,
      location = @location,
      found_date = @foundDate,
      registered_by = @registeredBy,
      images = @images,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id: request.params.id,
    name: request.body.name.trim(),
    category: request.body.category,
    description: request.body.description.trim(),
    location: request.body.location,
    foundDate: request.body.foundDate,
    registeredBy: request.body.registeredBy.trim(),
    images: JSON.stringify(images)
  });

  return response.json(serializeItem(database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id)));
});

app.post("/api/items/:id/claim", (request, response) => {
  const { name, document } = request.body;
  const item = database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id);
  if (!item) return response.status(404).json({ message: "Item não encontrado." });
  if (item.status !== "available") return response.status(409).json({ message: "Este item não está disponível para retirada." });
  if (!name?.trim() || !document?.trim()) return response.status(400).json({ message: "Informe nome e documento." });

  database.prepare(`
    UPDATE items SET
      status = 'claimed',
      claim_name = ?,
      claim_document = ?,
      claimed_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name.trim(), document.trim(), new Date().toISOString(), request.params.id);

  return response.json(serializeItem(database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id)));
});

app.post("/api/items/:id/donate", (request, response) => {
  const { institution } = request.body;
  const item = database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id);
  if (!item) return response.status(404).json({ message: "Item não encontrado." });
  if (!["available", "expired"].includes(item.status)) {
    return response.status(409).json({ message: "Este item não pode ser doado." });
  }
  if (!institution?.trim()) return response.status(400).json({ message: "Informe a instituição beneficiada." });

  database.prepare(`
    UPDATE items SET
      status = 'donated',
      donation_institution = ?,
      donated_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(institution.trim(), new Date().toISOString(), request.params.id);

  return response.json(serializeItem(database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id)));
});

app.post("/api/items/:id/expire", (request, response) => {
  const result = database.prepare(`
    UPDATE items SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'available'
  `).run(request.params.id);
  if (!result.changes) return response.status(409).json({ message: "Não foi possível expirar este item." });
  return response.json(serializeItem(database.prepare("SELECT * FROM items WHERE id = ?").get(request.params.id)));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(400).json({ message: error.message || "Não foi possível concluir a operação." });
});

if (process.env.NODE_ENV === "production") {
  const distDirectory = path.join(rootDirectory, "dist");
  app.use(express.static(distDirectory));
  app.get("/{*splat}", (_request, response) => response.sendFile(path.join(distDirectory, "index.html")));
}

app.listen(port, () => {
  console.log(`Achados e Perdidos disponível em http://localhost:${port}`);
});
