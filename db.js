const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cfg = require('./config');

const dbPath = process.env.DB_PATH || './data/app.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('admin','center','doctor')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  specialty TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS center_profiles(
  center_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  logo_path TEXT,
  report_form_path TEXT,
  address TEXT,
  phone TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS prices(
  center_id INTEGER NOT NULL REFERENCES users(id),
  modality TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price >= 0),
  PRIMARY KEY(center_id, modality)
);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS exams(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id INTEGER NOT NULL REFERENCES users(id),
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  referrer TEXT,
  modality TEXT NOT NULL,
  regions TEXT NOT NULL,
  exam_names TEXT NOT NULL,
  contrast TEXT NOT NULL DEFAULT 'N',
  protocol TEXT,
  specialty TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'R',
  clinical_info TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 2,
  report TEXT,
  doctor_id INTEGER REFERENCES users(id),
  price INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  reported_at TEXT,
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_exams_center ON exams(center_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exams_spec ON exams(specialty, status);
CREATE TABLE IF NOT EXISTS files(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  kind TEXT NOT NULL CHECK(kind IN ('study','prior')),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT,
  size INTEGER
);
CREATE INDEX IF NOT EXISTS idx_files_exam ON files(exam_id);
`);

// قيم أولية: رسوم الصبغة + حساب الإدارة الأول
db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('contrast_fee',?)").run(String(cfg.DEFAULT_CONTRAST_FEE));
const hasAdmin = db.prepare("SELECT 1 FROM users WHERE role='admin'").get();
if (!hasAdmin) {
  const email = process.env.ADMIN_EMAIL || 'admin@platform.iq';
  const pass = process.env.ADMIN_PASSWORD || 'ChangeMe-123!';
  db.prepare("INSERT INTO users(role,name,email,password_hash) VALUES('admin','الإدارة',?,?)")
    .run(email, bcrypt.hashSync(pass, 10));
  console.log('تم إنشاء حساب الإدارة:', email);
}

module.exports = db;
