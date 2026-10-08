const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const cfg = require('../config');
const { auth, role } = require('../middleware');
const CENTER_UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || './uploads',
  'centers'
);
require('fs').mkdirSync(CENTER_UPLOAD_DIR, { recursive: true });
const centerUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CENTER_UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('يسمح برفع الصور فقط'));
    }
    cb(null, true);
  }
});
router.use(auth, role('admin'));

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const clean = (s) => String(s || '').trim();
const fee = () => Number(db.prepare("SELECT value FROM settings WHERE key='contrast_fee'").get().value);

function createUser(res, r, { name, email, password, specialty }) {
  name = clean(name); email = clean(email); password = String(password || '');
  if (!name || !isEmail(email) || password.length < 8) {
    return res.status(400).json({ error: 'الاسم والبريد مطلوبان، وكلمة المرور 8 أحرف على الأقل' });
  }
  if (r === 'doctor' && !cfg.SPECIALTIES.includes(specialty)) return res.status(400).json({ error: 'اختصاص غير صالح' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'هذا البريد مستخدم من قبل' });
  const id = db.transaction(() => {
    const id = db.prepare('INSERT INTO users(role,name,email,password_hash,specialty) VALUES(?,?,?,?,?)')
      .run(r, name, email, bcrypt.hashSync(password, 10), r === 'doctor' ? specialty : null).lastInsertRowid;
    if (r === 'center') {
  const ins = db.prepare('INSERT INTO prices(center_id,modality,price) VALUES(?,?,?)');
  for (const m of cfg.MODALITIES) ins.run(id, m, cfg.DEFAULT_PRICES[m]);

  db.prepare(`
    INSERT OR IGNORE INTO center_profiles(center_id)
    VALUES(?)
  `).run(id);
}
    return id;
  })();
  res.status(201).json({ id });
}

// ---- المراكز ----
router.get('/centers', (req, res) => {
  const rows = db.prepare(`
  SELECT
    u.id,
    u.name,
    u.email,
    u.active,
    cp.logo_path,
    cp.report_form_path,
    cp.address,
    cp.phone
  FROM users u
  LEFT JOIN center_profiles cp ON cp.center_id = u.id
  WHERE u.role='center'
  ORDER BY u.id
`).all();
  const pr = db.prepare('SELECT modality,price FROM prices WHERE center_id=?');
  res.json(rows.map((c) => ({ ...c, prices: Object.fromEntries(pr.all(c.id).map((p) => [p.modality, p.price])) })));
});
router.post('/centers', (req, res) => createUser(res, 'center', req.body || {}));
router.put('/centers/:id/profile', (req, res) => {
  const id = Number(req.params.id);

  if (!db.prepare("SELECT 1 FROM users WHERE id=? AND role='center'").get(id)) {
    return res.status(404).json({ error: 'المستشفى أو المركز غير موجود' });
  }

  const b = req.body || {};

  const logo_path = clean(b.logo_path);
  const report_form_path = clean(b.report_form_path);
  const address = clean(b.address);
  const phone = clean(b.phone);

  db.prepare(`
    INSERT INTO center_profiles(
      center_id,
      logo_path,
      report_form_path,
      address,
      phone,
      updated_at
    )
    VALUES(?,?,?,?,?,datetime('now'))
    ON CONFLICT(center_id) DO UPDATE SET
      logo_path=excluded.logo_path,
      report_form_path=excluded.report_form_path,
      address=excluded.address,
      phone=excluded.phone,
      updated_at=datetime('now')
  `).run(
    id,
    logo_path || null,
    report_form_path || null,
    address || null,
    phone || null
  );

  res.json({ ok: true });
});
router.post(
  '/centers/:id/branding',
  centerUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'report_form', maxCount: 1 }
  ]),
  (req, res) => {
    const id = Number(req.params.id);

    if (!db.prepare("SELECT 1 FROM users WHERE id=? AND role='center'").get(id)) {
      return res.status(404).json({ error: 'المستشفى أو المركز غير موجود' });
    }

    const current = db.prepare(`
      SELECT logo_path, report_form_path
      FROM center_profiles
      WHERE center_id=?
    `).get(id) || {};

    const logo = req.files?.logo?.[0];
    const reportForm = req.files?.report_form?.[0];

    const logoPath = logo
      ? logo.filename
      : current.logo_path || null;

    const reportFormPath = reportForm
      ? reportForm.filename
      : current.report_form_path || null;

    db.prepare(`
      INSERT INTO center_profiles(
        center_id,
        logo_path,
        report_form_path,
        updated_at
      )
      VALUES(?,?,?,datetime('now'))
      ON CONFLICT(center_id) DO UPDATE SET
        logo_path=excluded.logo_path,
        report_form_path=excluded.report_form_path,
        updated_at=datetime('now')
    `).run(id, logoPath, reportFormPath);

    res.json({
      ok: true,
      logo_path: logoPath,
      report_form_path: reportFormPath
    });
  }
);
router.put('/centers/:id/prices', (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare("SELECT 1 FROM users WHERE id=? AND role='center'").get(id)) return res.status(404).json({ error: 'المركز غير موجود' });
  const body = req.body || {};
  for (const m of Object.keys(body)) {
    if (!cfg.MODALITIES.includes(m) || !Number.isInteger(body[m]) || body[m] < 0) return res.status(400).json({ error: 'سعر غير صالح: ' + m });
  }
  const up = db.prepare('INSERT INTO prices(center_id,modality,price) VALUES(?,?,?) ON CONFLICT(center_id,modality) DO UPDATE SET price=excluded.price');
  db.transaction(() => { for (const m of Object.keys(body)) up.run(id, m, body[m]); })();
  res.json({ ok: true });
});

// ---- الأطباء ----
router.get('/doctors', (req, res) =>
  res.json(db.prepare("SELECT id,name,email,specialty,active FROM users WHERE role='doctor' ORDER BY id").all()));
router.post('/doctors', (req, res) => createUser(res, 'doctor', req.body || {}));
// عرض المستشفيات المخصصة لكل طبيب
router.get('/doctors/:id/centers', (req, res) => {
  const doctorId = Number(req.params.id);

  const centers = db.prepare(`
    SELECT center_id
    FROM doctor_centers
    WHERE doctor_id = ?
  `).all(doctorId);

  res.json({
    center_ids: centers.map(c => c.center_id)
  });
});
// حفظ المستشفيات المخصصة للطبيب
router.put('/doctors/:id/centers', (req, res) => {
  const doctorId = Number(req.params.id);
  const centerIds = req.body?.center_ids;

  const doctor = db.prepare(
    "SELECT id FROM users WHERE id=? AND role='doctor'"
  ).get(doctorId);

  if (!doctor) {
    return res.status(404).json({ error: 'الطبيب غير موجود' });
  }

  if (!Array.isArray(centerIds) ||
      !centerIds.every(id => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ error: 'قائمة المستشفيات غير صالحة' });
  }

  const uniqueIds = [...new Set(centerIds)];

  const checkCenter = db.prepare(
    "SELECT id FROM users WHERE id=? AND role='center'"
  );

  for (const id of uniqueIds) {
    if (!checkCenter.get(id)) {
      return res.status(400).json({ error: 'أحد المستشفيات غير موجود' });
    }
  }

  db.transaction(() => {
    db.prepare(
      'DELETE FROM doctor_centers WHERE doctor_id=?'
    ).run(doctorId);

    const insert = db.prepare(
      'INSERT INTO doctor_centers(doctor_id,center_id) VALUES(?,?)'
    );

    for (const id of uniqueIds) {
      insert.run(doctorId, id);
    }
  })();

  res.json({ ok: true });
});
// ---- تعطيل حساب أو تغيير كلمة المرور ----
router.patch('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare("SELECT 1 FROM users WHERE id=? AND role IN ('center','doctor')").get(id)) return res.status(404).json({ error: 'الحساب غير موجود' });
  const { active, password } = req.body || {};
  if (password !== undefined && String(password).length < 8) return res.status(400).json({ error: 'كلمة المرور 8 أحرف على الأقل' });
  if (active !== undefined) db.prepare('UPDATE users SET active=? WHERE id=?').run(active ? 1 : 0, id);
  if (password !== undefined) db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(String(password), 10), id);
  res.json({ ok: true });
});

// تعديل معلومات حساب المستشفى/المركز أو الطبيب
router.patch('/users/:id/info', (req, res) => {
  const id = Number(req.params.id);

  const user = db.prepare(
    "SELECT * FROM users WHERE id=? AND role IN ('center','doctor')"
  ).get(id);

  if (!user) {
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }

  const { name, email, specialty } = req.body || {};

  const newName = clean(name);
  const newEmail = clean(email).toLowerCase();
  const newSpecialty = clean(specialty);

  if (!newName || !newEmail) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني مطلوبان' });
  }

  const duplicate = db.prepare(
    'SELECT id FROM users WHERE lower(email)=lower(?) AND id<>?'
  ).get(newEmail, id);

  if (duplicate) {
    return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بحساب آخر' });
  }

  db.prepare(
    'UPDATE users SET name=?, email=?, specialty=? WHERE id=?'
  ).run(
    newName,
    newEmail,
    user.role === 'doctor' ? newSpecialty : user.specialty,
    id
  );

  res.json({ ok: true });
});
// حذف حساب مستشفى/مركز أو طبيب
router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);

  const user = db.prepare(
    "SELECT id, role FROM users WHERE id=? AND role IN ('center','doctor')"
  ).get(id);

  if (!user) {
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }

  try {
    db.prepare('DELETE FROM users WHERE id=?').run(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({
      error: 'لا يمكن حذف الحساب لوجود بيانات مرتبطة به'
    });
  }
});
// ---- الإعدادات ----
router.get('/settings', (req, res) => res.json({ contrast_fee: fee() }));
router.put('/settings', (req, res) => {
  const v = (req.body || {}).contrast_fee;
  if (!Number.isInteger(v) || v < 0) return res.status(400).json({ error: 'قيمة غير صالحة' });
  db.prepare("UPDATE settings SET value=? WHERE key='contrast_fee'").run(String(v));
  res.json({ ok: true });
});

// ---- الجرد الشهري: /api/admin/statement?month=2026-10 ----
router.get('/statement', (req, res) => {
  const month = clean(req.query.month) || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'الشهر بصيغة YYYY-MM' });
  const centers = db.prepare("SELECT id,name FROM users WHERE role='center' ORDER BY id").all();
  const rows = db.prepare("SELECT id,center_id,patient_name,modality,contrast,protocol,exam_names,price,reported_at FROM exams WHERE status>=4 AND substr(reported_at,1,7)=? ORDER BY reported_at DESC").all(month);
  const out = centers.map((c) => {
    const s = { center_id: c.id, center: c.name, cases: 0, exams: 0, by_modality: {}, no_contrast: 0, with_contrast: 0, angiography: 0, oncology: 0, total: 0, details: [] };
    for (const r of rows.filter((x) => x.center_id === c.id)) {
      s.cases++; s.exams += JSON.parse(r.exam_names).length; s.total += r.price || 0;
      s.by_modality[r.modality] = (s.by_modality[r.modality] || 0) + 1;
      if (r.contrast === 'N') s.no_contrast++; else s.with_contrast++;
      if (r.protocol === 'Angiography') s.angiography++;
      if (r.protocol === 'Oncology' || r.protocol === 'Oncology/Staging') s.oncology++;
      s.details.push({
  id: r.id,
  patient_name: r.patient_name,
  modality: r.modality,
  exam_names: r.exam_names,
  protocol: r.protocol,
  contrast: r.contrast,
  price: r.price || 0,
  reported_at: r.reported_at
});
      
    }
   s.details.sort((a, b) => String(b.reported_at || '').localeCompare(String(a.reported_at || '')));
    return s;
    
  });
  res.json({ month, centers: out, grand_total: out.reduce((a, s) => a + s.total, 0) });
});

// جلب جميع الفحوصات للإدارة لغرض توزيعها على الأطباء
router.get('/cases', (req, res) => {
  const rows = db.prepare(`
    SELECT id, patient_name, modality, status, doctor_id
    FROM exams
    ORDER BY created_at DESC
  `).all();

  res.json(rows);
});

// توزيع الفحص على طبيب محدد من الإدارة
router.patch('/cases/:id/assign', (req, res) => {
  const examId = Number(req.params.id);
  const doctorId = Number(req.body?.doctor_id);

  const exam = db.prepare(
    'SELECT id, status FROM exams WHERE id=?'
  ).get(examId);

  if (!exam) {
    return res.status(404).json({ error: 'الفحص غير موجود' });
  }

  if (exam.status >= 4) {
    return res.status(400).json({ error: 'لا يمكن توزيع فحص مكتمل' });
  }

  const doctor = db.prepare(
    "SELECT id FROM users WHERE id=? AND role='doctor' AND active=1"
  ).get(doctorId);

  if (!doctor) {
    return res.status(404).json({ error: 'الطبيب غير موجود أو حسابه معطل' });
  }

  db.prepare(
    'UPDATE exams SET doctor_id=? WHERE id=?'
  ).run(doctorId, examId);

  res.json({ ok: true });
});
module.exports = router;
