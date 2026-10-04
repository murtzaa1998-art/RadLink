const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { sign, auth } = require('../middleware');

const DUMMY = bcrypt.hashSync('dummy-password', 10);
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: 'محاولات كثيرة، حاول بعد 15 دقيقة' } });

const pub = (u) => ({ id: u.id, role: u.role, name: u.name, email: u.email, specialty: u.specialty });

// portal: center | doctor | admin  (البوابة التي دخل منها المستخدم يجب أن تطابق نوع حسابه)
router.post('/login', limiter, (req, res) => {
  const { email, password, portal } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').trim());
  const okPass = bcrypt.compareSync(String(password || ''), u ? u.password_hash : DUMMY);
  if (!u || !u.active || !okPass || (portal && portal !== u.role)) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
  res.cookie('token', sign(u), {
    httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 12 * 3600 * 1000,
  });
  res.json({ user: pub(u) });
});

router.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
router.get('/me', auth, (req, res) => res.json({ user: pub(req.user) }));

module.exports = router;
