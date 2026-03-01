import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("pos.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category_id INTEGER,
    image TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    cashier_name TEXT NOT NULL,
    items TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT DEFAULT 'cashier'
  );

  CREATE TABLE IF NOT EXISTS saved_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT,
    items TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  db.prepare("INSERT INTO categories (name) VALUES (?)").run("Makanan");
  db.prepare("INSERT INTO categories (name) VALUES (?)").run("Minuman");
  db.prepare("INSERT INTO categories (name) VALUES (?)").run("Snack");
  
  db.prepare("INSERT INTO products (name, price, category_id, image) VALUES (?, ?, ?, ?)").run("Nasi Goreng Special", 25000, 1, "https://picsum.photos/seed/nasigoreng/200/200");
  db.prepare("INSERT INTO products (name, price, category_id, image) VALUES (?, ?, ?, ?)").run("Es Teh Manis", 5000, 2, "https://picsum.photos/seed/esteh/200/200");
  db.prepare("INSERT INTO products (name, price, category_id, image) VALUES (?, ?, ?, ?)").run("Kentang Goreng", 15000, 3, "https://picsum.photos/seed/fries/200/200");

  db.prepare("INSERT INTO users (name, pin, role) VALUES (?, ?, ?)").run("Admin", "1234", "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, price, category_id, image } = req.body;
    const result = db.prepare("INSERT INTO products (name, price, category_id, image) VALUES (?, ?, ?, ?)").run(name, price, category_id, image);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC").all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { total, payment_method, cashier_name, items } = req.body;
    const result = db.prepare("INSERT INTO transactions (total, payment_method, cashier_name, items) VALUES (?, ?, ?, ?)").run(total, payment_method, cashier_name, JSON.stringify(items));
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, role FROM users").all();
    res.json(users);
  });

  app.post("/api/login", (req, res) => {
    const { pin } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE pin = ?").get(pin);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid PIN" });
    }
  });

  app.get("/api/saved-bills", (req, res) => {
    const bills = db.prepare("SELECT * FROM saved_bills").all();
    res.json(bills);
  });

  app.post("/api/saved-bills", (req, res) => {
    const { table_name, items } = req.body;
    const result = db.prepare("INSERT INTO saved_bills (table_name, items) VALUES (?, ?)").run(table_name, JSON.stringify(items));
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/saved-bills/:id", (req, res) => {
    db.prepare("DELETE FROM saved_bills WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
