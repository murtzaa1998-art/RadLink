const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 24) {
  throw new Error('JWT_SECRET مفقود أو قصير. ضعه في ملف .env (24 حرفاً على الأقل).');
}

const sign = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '12h' });

// يتحقق من الجلسة، ويقرأ المستخدم من القاعدة في كل طلب حتى يُوقَف الحساب فوراً عند تعطيله.
function auth(req, res, next) {
  const t = req.cookies && req.cookies.token;
  if (!t) return res.status(401).json({ error: 'سجّل الدخول أولاً' });
  try {
    const p = jwt.verify(t, SECRET);
    const u = db.prepare('SELECT id,role,name,email,specialty,active FROM users WHERE id=?').get(p.id);
    if (!u || !u.active) throw new Error('inactive');
    req.user = u;
    next();
  } catch {
    res.status(401).json({ error: 'انتهت الجلسة، سجّل الدخول من جديد' });
  }
}

const role = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'غير مصرّح لك بهذا الإجراء' });

module.exports = { sign, auth, role };
