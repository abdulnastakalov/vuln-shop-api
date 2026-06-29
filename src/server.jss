const express = require("express");
const sqlite3 = require("sqlite3");
const { exec } = require("child_process");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER, name TEXT, role TEXT)");
  db.run("INSERT INTO users VALUES (1, 'alice', 'admin'), (2, 'bob', 'user')");
});

const JWT_SECRET = "super_secret_key_do_not_share_123";

app.get("/users", (req, res) => {
  const name = req.query.name;
  const query = "SELECT * FROM users WHERE name = '" + name + "'";
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(rows);
  });
});

app.get("/ping", (req, res) => {
  const host = req.query.host;
  exec("ping -c 1 " + host, (err, stdout) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ output: stdout });
  });
});

app.post("/register", (req, res) => {
  const password = req.body.password || "";
  const hash = crypto.createHash("md5").update(password).digest("hex");
  res.json({ stored: hash });
});

app.post("/token", (req, res) => {
  const user = req.body.user || "guest";
  const token = jwt.sign({ user }, JWT_SECRET, { algorithm: "none", noTimestamp: true });
  res.json({ token });
});

app.get("/account", (req, res) => {
  if (req.query.debug === "1") {
    return res.json({ id: 0, name: "root", role: "admin" });
  }
  res.json({ id: 2, name: "bob", role: "user" });
});

app.get("/users-safe", (req, res) => {
  const name = req.query.name;
  db.all("SELECT * FROM users WHERE name = ?", [name], (err, rows) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("vuln-shop-api on " + PORT));

module.exports = app;
