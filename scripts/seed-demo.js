// يضيف حسابات تجريبية للتجربة فقط. لا تستخدمه على نظام فعلي.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');
const cfg = require('../config');

const PASS = 'Demo-Pass-1';
const hash = bcrypt.hashSync(PASS, 10);
const add = (role, name, email, specialty) => {
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return;
  const id = db.prepare('INSERT INTO users(role,name,email,password_hash,specialty) VALUES(?,?,?,?,?)').run(role, name, email, hash, specialty || null).lastInsertRowid;
  if (role === 'center') for (const m of cfg.MODALITIES) db.prepare('INSERT INTO prices(center_id,modality,price) VALUES(?,?,?)').run(id, m, cfg.DEFAULT_PRICES[m]);
};
add('center', 'مستشفى الأمل', 'amal@demo.iq');
add('center', 'مركز النور للتصوير', 'noor@demo.iq');
add('doctor', 'د. سارة الجبوري', 'sara@demo.iq', 'أورام');
add('doctor', 'د. زينب الساعدي', 'zainab@demo.iq', 'أعصاب');
add('doctor', 'د. هدى النجار', 'huda@demo.iq', 'صدر وقلب');
console.log('تمت إضافة الحسابات التجريبية. كلمة المرور لكلها:', PASS);
