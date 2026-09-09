# Nearby — local discovery app

A fully working mobile-first web app: React frontend + a real Node/Express + SQLite backend
(auth, saved places, friends, live-update feed). Built from the resolved "broken brief" spec
(offline-first Saved/Map, lightweight email+password auth, Explorer/Organizer update model,
5km "nearby" scope).

## Project structure

```
nearby-app/
  backend/    Express API + SQLite database (auth, places, saved, friends, feed)
  frontend/   Vite + React mobile web app (the outdoor-themed UI)
```

## Requirements

- **Node.js 22.5+** (24 LTS recommended). The backend uses Node's built-in `node:sqlite` module —
  deliberately chosen over `better-sqlite3` to avoid native-binary/build-tool issues across
  platforms and Node versions. You'll see a one-line `ExperimentalWarning: SQLite is an
  experimental feature` in the console on startup — that's expected and harmless.

## Run it locally

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET if you like
npm run seed               # creates nearby.db with demo data
npm start                  # runs on http://localhost:4000
```

Demo logins seeded for you: `priya@demo.app` / `password123` and `marcus@demo.app` / `password123`
(they're already friends with each other, and there's a seeded "Nearby Team" organizer account
with a couple of official updates, so a fresh login isn't empty).

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:4000 by default
npm run dev                 # runs on http://localhost:5173
```

Open http://localhost:5173 — resize your browser narrow (or open dev tools device mode) to see
it as intended; it's built mobile-first.

There's a small "Online / Offline mode" pill in the top-right corner of the app — that's a demo
toggle so you (or judges) can show the offline behavior without actually killing your wifi.

## Deploying

- **Frontend → Vercel or Netlify**: point it at the `frontend` folder, build command `npm run build`,
  output directory `dist`. Set the environment variable `VITE_API_URL` to your deployed backend URL.
- **Backend → Render, Railway, or Fly.io** (not Vercel — this is a persistent Express server with a
  SQLite file on disk, not a serverless function). Set `JWT_SECRET` as an env var. Run `npm run seed`
  once after first deploy (e.g. via a one-off shell/job) to populate demo data.

## Key assumptions (see also the brief-resolution doc)

- Discovery data is a seeded dataset, not a live places API (documented weekend-scope decision).
- Friend-adding is instant/mutual by exact email — no request/accept flow, no social graph.
- Organizer updates are pre-seeded; there's no Organizer-facing posting UI in this MVP.
- "Nearby" and map pin positions are illustrative (deterministic pseudo-placement), not derived
  from live device GPS — there's no real geolocation wiring in this MVP.
- Saving is local-first: it works offline and queues in a pending-sync list, flushed automatically
  when the app detects it's back online.
- Logging out only clears the local session; saved data lives on the server and returns on next login.
