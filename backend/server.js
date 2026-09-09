require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const db = require("./db");
const { requireAuth, JWT_SECRET } = require("./middleware");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, accountType: u.account_type };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, accountType: user.account_type }, JWT_SECRET, { expiresIn: "90d" });
}

// ---------- Health ----------
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- Auth ----------
app.post("/api/auth/signup", (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password and name are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: "An account with that email already exists" });

  const id = nanoid();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, account_type) VALUES (?, ?, ?, ?, 'explorer')`
  ).run(id, email.toLowerCase().trim(), password_hash, name);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

// ---------- Places (discovery) ----------
// Public: works as the seeded "nearby" dataset. No live external API for MVP (documented assumption).
app.get("/api/places", (req, res) => {
  const places = db.prepare("SELECT * FROM places").all();
  res.json({
    places: places.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      lat: p.lat,
      lng: p.lng,
      distance: p.distance_label,
      open: !!p.open_now,
      description: p.description,
    })),
  });
});

// ---------- Saved places ----------
app.get("/api/saved", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.* FROM saved_places s JOIN places p ON p.id = s.place_id WHERE s.user_id = ? ORDER BY s.created_at DESC`
    )
    .all(req.userId);
  res.json({
    saved: rows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      distance: p.distance_label,
      description: p.description,
    })),
  });
});

app.post("/api/saved", requireAuth, (req, res) => {
  const { placeId } = req.body || {};
  const place = db.prepare("SELECT id FROM places WHERE id = ?").get(placeId);
  if (!place) return res.status(404).json({ error: "Place not found" });

  const id = nanoid();
  db.prepare(
    `INSERT OR IGNORE INTO saved_places (id, user_id, place_id) VALUES (?, ?, ?)`
  ).run(id, req.userId, placeId);
  res.json({ ok: true });
});

app.delete("/api/saved/:placeId", requireAuth, (req, res) => {
  db.prepare(`DELETE FROM saved_places WHERE user_id = ? AND place_id = ?`).run(req.userId, req.params.placeId);
  res.json({ ok: true });
});

// ---------- Friends ----------
app.get("/api/friends", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email FROM friends f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ?`
    )
    .all(req.userId);
  res.json({ friends: rows });
});

// MVP: adding a friend by exact email/username is an instant mutual connection
// (no request/accept flow) -- documented assumption, avoids building a social graph.
app.post("/api/friends", requireAuth, (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  const friend = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!friend) return res.status(404).json({ error: "No user found with that email" });
  if (friend.id === req.userId) return res.status(400).json({ error: "You can't add yourself" });

  db.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)").run(req.userId, friend.id);
  db.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)").run(friend.id, req.userId);
  res.json({ ok: true, friend: { id: friend.id, name: friend.name, email: friend.email } });
});

// ---------- Feed (live updates: friends + official) ----------
app.get("/api/feed", requireAuth, (req, res) => {
  const friendIds = db
    .prepare("SELECT friend_id FROM friends WHERE user_id = ?")
    .all(req.userId)
    .map((r) => r.friend_id);

  const relevantAuthorIds = [...friendIds];
  const organizerIds = db.prepare("SELECT id FROM users WHERE account_type = 'organizer'").all().map((r) => r.id);
  relevantAuthorIds.push(...organizerIds);

  if (relevantAuthorIds.length === 0) return res.json({ updates: [] });

  const placeholders = relevantAuthorIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT up.id, up.message, up.created_at, up.author_type,
              u.name as author_name, u.id as author_id,
              p.id as place_id, p.name as place_name, p.category as place_category
       FROM updates up
       JOIN users u ON u.id = up.author_id
       LEFT JOIN places p ON p.id = up.place_id
       WHERE up.author_id IN (${placeholders})
       ORDER BY up.created_at DESC
       LIMIT 50`
    )
    .all(...relevantAuthorIds);

  res.json({
    updates: rows.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      authorType: r.author_type, // 'explorer' | 'organizer'
      message: r.message,
      createdAt: r.created_at,
      place: r.place_id ? { id: r.place_id, name: r.place_name, category: r.place_category } : null,
    })),
  });
});

app.post("/api/feed", requireAuth, (req, res) => {
  if (req.accountType !== "explorer") {
    return res.status(403).json({ error: "Only explorers can post community updates from this endpoint" });
  }
  const { message, placeId } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: "message is required" });

  const id = nanoid();
  db.prepare(
    `INSERT INTO updates (id, author_id, author_type, message, place_id) VALUES (?, ?, 'explorer', ?, ?)`
  ).run(id, req.userId, message.trim(), placeId || null);
  res.json({ ok: true, id });
});

app.listen(PORT, () => {
  console.log(`Nearby API listening on port ${PORT}`);
});
