const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const db = require("./db");

const PLACES = [
  { name: "Momo Alley", category: "food", lat: 25.2048, lng: 55.2708, distance_label: "0.2 mi", open_now: 1, description: "Steamed dumplings, tiny queue, big flavor. Locals swear by the chili oil." },
  { name: "Ridgeline Trailhead Market", category: "event", lat: 25.2075, lng: 55.2650, distance_label: "0.4 mi", open_now: 1, description: "Pop-up market at the trailhead — live music starts at 8pm." },
  { name: "Basecamp Coffee", category: "cafe", lat: 25.2020, lng: 55.2740, distance_label: "0.1 mi", open_now: 1, description: "Single-origin pour-overs and a window seat worth waiting for." },
  { name: "Clay & Co Studio", category: "activity", lat: 25.2100, lng: 55.2600, distance_label: "0.6 mi", open_now: 0, description: "Drop-in pottery wheel sessions. Closes early on weekdays." },
  { name: "Sunset Taco Cart", category: "food", lat: 25.1990, lng: 55.2690, distance_label: "0.3 mi", open_now: 1, description: "Cash only, cart shows up around 6. Ask for the pineapple salsa." },
  { name: "Night Market Pop-Up", category: "event", lat: 25.2130, lng: 55.2670, distance_label: "0.8 mi", open_now: 1, description: "Weekly vendor market — food, crafts, and a DJ after dark." },
  { name: "Bloom Botanical Cafe", category: "cafe", lat: 25.2005, lng: 55.2760, distance_label: "0.5 mi", open_now: 1, description: "Plant-filled space, oat milk everything, quiet enough to work." },
  { name: "Boulder Yard Climbing", category: "activity", lat: 25.2060, lng: 55.2580, distance_label: "0.7 mi", open_now: 1, description: "Bouldering gym with day passes and free shoe rental Tuesdays." },
];

function run() {
  const insertPlace = db.prepare(
    `INSERT INTO places (id, name, category, lat, lng, distance_label, open_now, description)
     VALUES (@id, @name, @category, @lat, @lng, @distance_label, @open_now, @description)`
  );

  const existing = db.prepare("SELECT COUNT(*) as c FROM places").get();
  let placeIds = [];
  if (existing.c === 0) {
    db.exec("BEGIN");
    try {
      for (const p of PLACES) {
        const id = nanoid();
        insertPlace.run({ id, ...p });
        placeIds.push(id);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    console.log(`Seeded ${PLACES.length} places.`);
  } else {
    placeIds = db.prepare("SELECT id FROM places").all().map((r) => r.id);
    console.log("Places already seeded, skipping.");
  }

  // Organizer account ("Nearby Team") + official updates
  const orgEmail = "team@nearby.app";
  let organizer = db.prepare("SELECT * FROM users WHERE email = ?").get(orgEmail);
  if (!organizer) {
    const id = nanoid();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, account_type) VALUES (?, ?, ?, ?, 'organizer')`
    ).run(id, orgEmail, bcrypt.hashSync("organizer-demo", 10), "Nearby Team");
    organizer = { id };
    console.log("Seeded organizer account (team@nearby.app).");
  }

  const updateCount = db.prepare("SELECT COUNT(*) as c FROM updates WHERE author_type = 'organizer'").get();
  if (updateCount.c === 0 && placeIds.length) {
    const insertUpdate = db.prepare(
      `INSERT INTO updates (id, author_id, author_type, message, place_id) VALUES (?, ?, 'organizer', ?, ?)`
    );
    insertUpdate.run(nanoid(), organizer.id, "New pop-up: Night Market just opened for the evening.", placeIds[5]);
    insertUpdate.run(nanoid(), organizer.id, "Live music kicks off at the trailhead market in 20 minutes.", placeIds[1]);
    console.log("Seeded official updates.");
  }

  // Demo explorer accounts + friendship + a couple of live updates, so a fresh
  // login has something to see immediately (judges shouldn't hit an empty app).
  function ensureExplorer(email, name, password) {
    let u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!u) {
      const id = nanoid();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, name, account_type) VALUES (?, ?, ?, ?, 'explorer')`
      ).run(id, email, bcrypt.hashSync(password, 10), name);
      u = { id, email, name };
      console.log(`Seeded demo explorer ${email} / ${password}`);
    }
    return u;
  }

  const priya = ensureExplorer("priya@demo.app", "Priya K.", "password123");
  const marcus = ensureExplorer("marcus@demo.app", "Marcus T.", "password123");

  const friendRow = db.prepare("SELECT * FROM friends WHERE user_id = ? AND friend_id = ?").get(priya.id, marcus.id);
  if (!friendRow) {
    db.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)").run(priya.id, marcus.id);
    db.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)").run(marcus.id, priya.id);
    console.log("Seeded demo friendship (priya <-> marcus).");
  }

  const explorerUpdateCount = db.prepare("SELECT COUNT(*) as c FROM updates WHERE author_type = 'explorer'").get();
  if (explorerUpdateCount.c === 0 && placeIds.length) {
    const insertUpdate = db.prepare(
      `INSERT INTO updates (id, author_id, author_type, message, place_id) VALUES (?, ?, 'explorer', ?, ?)`
    );
    insertUpdate.run(nanoid(), marcus.id, "queue's actually short right now if anyone wants to go", placeIds[0]);
    insertUpdate.run(nanoid(), priya.id, "the pour-over here is unreal, staying for round two", placeIds[2]);
    console.log("Seeded explorer live updates.");
  }
}

run();
console.log("Seed complete. Demo logins: priya@demo.app / password123, marcus@demo.app / password123");
