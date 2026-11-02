/*
 * EventHub - the application under test.
 * A small event-registration web app (static UI) backed by a JSON REST API.
 * Data is kept in memory, so every server start begins with a clean state.
 */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const dotenv = require('dotenv');
const rules = require('./public/validation.js');

const ROOT = path.resolve(__dirname, '..');
const envFile = fs.existsSync(path.join(ROOT, '.env')) ? '.env' : '.env.example';
dotenv.config({ path: path.join(ROOT, envFile) });

const PORT = Number(process.env.APP_PORT || 3000);
const USERNAME = process.env.APP_USERNAME;
const PASSWORD = process.env.APP_PASSWORD;
const LATENCY_MS = Number(process.env.APP_LATENCY_MS || 800);
const TOKEN_TTL_SECONDS = 3600;

if (!USERNAME || !PASSWORD) {
  console.error('APP_USERNAME and APP_PASSWORD must be set (see .env.example).');
  process.exit(1);
}

const registrations = new Map(); // id -> registration
const tokens = new Map(); // token -> expiry timestamp (ms)

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set('X-Request-Id', crypto.randomUUID());
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Simulated processing time with jitter, so clients must synchronise properly. */
const simulateWork = () => delay(LATENCY_MS / 2 + Math.random() * LATENCY_MS);

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).set('WWW-Authenticate', 'Bearer').json({ error: 'Authentication required' });
  }
  const expiry = tokens.get(token);
  if (!expiry || expiry < Date.now()) {
    tokens.delete(token);
    return res.status(401).set('WWW-Authenticate', 'Bearer error="invalid_token"').json({ error: 'Invalid or expired token' });
  }
  next();
}

function newReference() {
  return 'EVH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function pickFile(file, extraKeys = []) {
  if (!file || typeof file !== 'object') return null;
  const picked = { name: String(file.name || ''), size: Number(file.size), type: String(file.type || '') };
  for (const key of extraKeys) if (file[key] !== undefined) picked[key] = Number(file[key]);
  return picked;
}

/** Normalises an incoming payload into the stored shape (no id/timestamps). */
function normalise(body) {
  return {
    fullName: String(body.fullName).trim(),
    email: String(body.email).trim().toLowerCase(),
    age: Number(body.age),
    tickets: Number(body.tickets),
    ticketType: body.ticketType,
    eventDate: body.eventDate,
    notes: body.notes ? String(body.notes) : '',
    document: pickFile(body.document),
    photo: pickFile(body.photo, ['width', 'height']),
    totalPrice: rules.priceFor(body.ticketType, Number(body.tickets)),
    currency: 'EUR',
  };
}

function findByEmail(email) {
  const wanted = String(email || '').trim().toLowerCase();
  return [...registrations.values()].find((r) => r.email === wanted);
}

// ---------- Public endpoints ----------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptimeSeconds: Math.round(process.uptime()) });
});

app.post('/api/auth/token', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (!safeEqual(username, USERNAME) || !safeEqual(password, PASSWORD)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, Date.now() + TOKEN_TTL_SECONDS * 1000);
  res.json({ token, tokenType: 'Bearer', expiresIn: TOKEN_TTL_SECONDS });
});

app.get('/api/ticket-types', (req, res) => {
  res.json(rules.TICKET_TYPES);
});

// ---------- Protected endpoints ----------

app.get('/api/registrations', requireAuth, (req, res) => {
  let items = [...registrations.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (req.query.email) {
    const needle = String(req.query.email).toLowerCase();
    items = items.filter((r) => r.email.includes(needle));
  }
  res.json({ items, total: items.length });
});

app.get('/api/registrations/:id', requireAuth, (req, res) => {
  const registration = registrations.get(req.params.id);
  if (!registration) return res.status(404).json({ error: 'Registration not found' });
  res.json(registration);
});

app.post('/api/registrations', requireAuth, async (req, res) => {
  const errors = rules.validateRegistration(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  await simulateWork();
  if (findByEmail(req.body.email)) {
    return res.status(409).json({ error: 'A registration with this email already exists' });
  }
  const now = new Date().toISOString();
  const registration = { id: crypto.randomUUID(), reference: newReference(), ...normalise(req.body), createdAt: now, updatedAt: now };
  registrations.set(registration.id, registration);
  res.status(201).location(`/api/registrations/${registration.id}`).json(registration);
});

app.put('/api/registrations/:id', requireAuth, async (req, res) => {
  const existing = registrations.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Registration not found' });
  const errors = rules.validateRegistration(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const clash = findByEmail(req.body.email);
  if (clash && clash.id !== existing.id) {
    return res.status(409).json({ error: 'A registration with this email already exists' });
  }
  const updated = { ...existing, ...normalise(req.body), updatedAt: new Date().toISOString() };
  registrations.set(existing.id, updated);
  res.json(updated);
});

app.delete('/api/registrations/:id', requireAuth, (req, res) => {
  if (!registrations.delete(req.params.id)) return res.status(404).json({ error: 'Registration not found' });
  res.status(204).end();
});

// ---------- Error handling ----------

app.use('/api', (req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`EventHub running at http://localhost:${PORT} (config: ${envFile})`);
});
