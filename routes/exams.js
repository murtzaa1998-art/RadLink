// مسارات المركز/المستشفى: رفع الفحص ومتابعته وتأكيد التسليم للمريض
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../db');
const cfg = require('../config');
const { auth, role } = require('../middleware');
const { view, caseNo } = require('../lib');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    // اسم عشوائي على القرص حتى لا يمكن تخمين الملفات أو رفع مسارات خبيثة
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).slice(0, 10).replace(/[^.\w]/g, '')),
  }),
  limits: { fileSize: 500 * 1024 * 1024, files: 220 },
}).fields([{ name: 'study', maxCount: 200 }, { name: 'prior', maxCount: 20 }]);

const parseList = (s) => {
  try { const a = JSON.parse(s); return Array.isArray(a) && a.every((x) => typeof x === 'string' && x.trim()) ? a.map((x) => x.trim()) : null; }
  catch { return null; }
};
const dropFiles = (req) => Object.values(req.files || {}).flat().forEach((f) => fs.unlink(f.path, () => {}));

router.use(auth, role('center'));

// إضافة فحص جديد (multipart/form-data)
router.post('/', (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'خطأ في رفع الملفات: ' + err.message });
    const b = req.body || {};
    const fail = (msg) => { dropFiles(req); return res.status(400).json({ error: msg }); };
    const name = String(b.patient_name || '').trim();
    const regions = parseList(b.regions), exams = parseList(b.exam_names);
    const study = (req.files && req.files.study) || [];
    const age = Number(b.age);
    if (b.protocol === 'Normal') {
  b.contrast = 'N';
} else if (['Contrast', 'Oncology', 'Angiography'].includes(b.protocol) && b.contrast === 'N') {
  return fail('اختر نوع الصبغة لهذا الفحص');
}
    if (name.split(/\s+/).filter(Boolean).length < 3)
  return fail('اكتب اسم المريض الثلاثي على الأقل');
    if (!Number.isInteger(age) || age < 0 || age > 120) return fail('العمر غير صالح');
    if (!['ذكر', 'أنثى'].includes(b.sex)) return fail('الجنس غير صالح');
    if (!cfg.MODALITIES.includes(b.modality)) return fail('نوع التصوير غير صالح');
    if (!regions || !regions.length || !exams || !exams.length) return fail('اختر الفحوصات المطلوبة');
    if (!cfg.CONTRASTS.includes(b.contrast)) return fail('خيار الصبغة غير صالح');
    if (!['Normal', 'Contrast', 'Oncology', 'Angiography'].includes(b.protocol))
  return fail('نوع الفحص غير صالح');
    
    if (!cfg.PRIORITIES.includes(b.priority)) return fail('الأولوية غير صالحة');
    if (!String(b.clinical_info || '').trim()) return fail('اكتب المشاكل والمعلومات السريرية');
    if (!study.length) return fail('أرفق صور الفحص');
const specialty = b.protocol === 'Oncology' ? 'أورام' : 'أشعة';
    const doctor = db.prepare(`
  SELECT u.id
  FROM users u
  JOIN doctor_centers dc ON dc.doctor_id = u.id
  WHERE u.role = 'doctor'
    AND u.active = 1
    AND u.specialty = ?
    AND dc.center_id = ?
  ORDER BY (
    SELECT COUNT(*)
    FROM exams e
    WHERE e.doctor_id = u.id AND e.status < 4
  ) ASC, u.id ASC
  LIMIT 1
`).get(specialty, req.user.id);
    const id = db.transaction(() => {
      const id = db.prepare(`INSERT INTO exams(center_id,patient_name,age,sex,referrer,modality,regions,exam_names,contrast,protocol,specialty,priority,clinical_info)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.user.id, name, age, b.sex, String(b.referrer || '').trim(), b.modality,
        JSON.stringify(regions), JSON.stringify(exams), b.contrast, b.protocol, specialty, b.priority, String(b.clinical_info).trim()).lastInsertRowid;
      if (doctor) {
  db.prepare(
    'UPDATE exams SET doctor_id=? WHERE id=?'
  ).run(doctor.id, id);
}
      const ins = db.prepare('INSERT INTO files(exam_id,kind,original_name,stored_name,mime,size) VALUES(?,?,?,?,?,?)');
      for (const kind of ['study', 'prior'])
        for (const f of (req.files && req.files[kind]) || [])
          ins.run(id, kind, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.filename, f.mimetype, f.size);
      return id;
    })();
    res.status(201).json({ id, case_no: caseNo(db.prepare('SELECT * FROM exams WHERE id=?').get(id)) });
  });
});

// فحوصات المركز نفسه فقط
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM exams WHERE center_id=? ORDER BY id DESC').all(req.user.id);
  res.json(rows.map((e) => view(e, 'center')));
});

router.get('/:id', (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return next();
  const e = db.prepare('SELECT * FROM exams WHERE id=? AND center_id=?').get(Number(req.params.id), req.user.id);
  if (!e) return res.status(404).json({ error: 'الحالة غير موجودة' });
  res.json(view(e, 'center'));
});
// الجرد الشهري للمركز/المستشفى نفسه فقط
router.get('/statement', (req, res) => {
  const month = String(
    req.query.month || new Date().toISOString().slice(0, 7)
  ).trim();

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'الشهر غير صالح' });
  }

  const rows = db.prepare(`
    SELECT modality, contrast, protocol, exam_names, price
    FROM exams
    WHERE center_id=?
      AND status>=4
      AND substr(reported_at,1,7)=?
  `).all(req.user.id, month);

  const statement = {
    month,
    cases: 0,
    exams: 0,
    by_modality: {},
    no_contrast: 0,
    with_contrast: 0,
    angiography: 0,
    oncology: 0,
    total: 0
  };

  for (const r of rows) {
    statement.cases++;

    let examNames = [];
    try {
      examNames = JSON.parse(r.exam_names || '[]');
    } catch (_) {}

    statement.exams += Array.isArray(examNames) ? examNames.length : 0;

    statement.by_modality[r.modality] =
      (statement.by_modality[r.modality] || 0) + 1;

    if (r.contrast === 'N') {
      statement.no_contrast++;
    } else {
      statement.with_contrast++;
    }

    if (r.protocol === 'Angiography') {
      statement.angiography++;
    }

        if (r.protocol === 'Oncology' || r.protocol === 'Oncology/Staging') {
      statement.oncology++;
    }

    statement.total += Number(r.price || 0);
  }

  res.json(statement);
});
// تعديل بيانات الفحص من قبل المركز/المستشفى
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'رقم الفحص غير صالح' });
  }

  const old = db.prepare(
    'SELECT * FROM exams WHERE id=? AND center_id=?'
  ).get(id, req.user.id);

  if (!old) {
    return res.status(404).json({ error: 'الفحص غير موجود' });
  }

  // يمنع تعديل الفحص بعد صدور التقرير
  if (old.status >= 4) {
    return res.status(409).json({
      error: 'لا يمكن تعديل الفحص بعد صدور التقرير'
    });
  }

  const b = req.body || {};
  const name = String(b.patient_name || '').trim();
  const age = Number(b.age);
  const regions = Array.isArray(b.regions) ? b.regions : [];
  const exams = Array.isArray(b.exam_names) ? b.exam_names : [];

  if (name.split(/\s+/).filter(Boolean).length < 3) {
    return res.status(400).json({ error: 'اكتب اسم المريض الثلاثي على الأقل' });
  }

  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return res.status(400).json({ error: 'العمر غير صالح' });
  }

  if (!['ذكر', 'أنثى'].includes(b.sex)) {
    return res.status(400).json({ error: 'الجنس غير صالح' });
  }

  if (!cfg.MODALITIES.includes(b.modality)) {
    return res.status(400).json({ error: 'نوع التصوير غير صالح' });
  }

  if (!regions.length || !exams.length) {
    return res.status(400).json({ error: 'اختر منطقة وفحص واحد على الأقل' });
  }

  if (!['Normal', 'Contrast', 'Oncology', 'Angiography'].includes(b.protocol)) {
    return res.status(400).json({ error: 'نوع الفحص غير صالح' });
  }

  let contrast = b.contrast;

  if (b.protocol === 'Normal') {
    contrast = 'N';
  } else if (
    ['Contrast', 'Oncology', 'Angiography'].includes(b.protocol) &&
    contrast === 'N'
  ) {
    return res.status(400).json({ error: 'اختر نوع الصبغة لهذا الفحص' });
  }

  if (!cfg.CONTRASTS.includes(contrast)) {
    return res.status(400).json({ error: 'خيار الصبغة غير صالح' });
  }

  if (!cfg.PRIORITIES.includes(b.priority)) {
    return res.status(400).json({ error: 'الأولوية غير صالحة' });
  }

  const clinical = String(b.clinical_info || '').trim();

  if (!clinical) {
    return res.status(400).json({
      error: 'اكتب المشاكل والمعلومات السريرية'
    });
  }

  db.prepare(`
    UPDATE exams SET
      patient_name=?,
      age=?,
      sex=?,
      referrer=?,
      modality=?,
      regions=?,
      exam_names=?,
      contrast=?,
      protocol=?,
      priority=?,
      clinical_info=?
    WHERE id=? AND center_id=?
  `).run(
    name,
    age,
    b.sex,
    String(b.referrer || '').trim(),
    b.modality,
    JSON.stringify(regions),
    JSON.stringify(exams),
    contrast,
    b.protocol,
    b.priority,
    clinical,
    id,
    req.user.id
  );

  const updated = db.prepare(
    'SELECT * FROM exams WHERE id=? AND center_id=?'
  ).get(id, req.user.id);

  res.json(view(updated, 'center'));
});
// تأكيد تسليم التقرير للمريض
router.post('/:id/deliver', (req, res) => {
  const r = db.prepare("UPDATE exams SET status=5, delivered_at=datetime('now') WHERE id=? AND center_id=? AND status=4")
    .run(Number(req.params.id), req.user.id);
  if (!r.changes) return res.status(409).json({ error: 'التقرير غير جاهز أو سُلّم من قبل' });
  res.json({ ok: true });
});

module.exports = router;
