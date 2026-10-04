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
    if (name.split(/\s+/).length < 4) return fail('اكتب اسم المريض الرباعي');
    if (!Number.isInteger(age) || age < 0 || age > 120) return fail('العمر غير صالح');
    if (!['ذكر', 'أنثى'].includes(b.sex)) return fail('الجنس غير صالح');
    if (!cfg.MODALITIES.includes(b.modality)) return fail('نوع التصوير غير صالح');
    if (!regions || !regions.length || !exams || !exams.length) return fail('اختر الفحوصات المطلوبة');
    if (!cfg.CONTRASTS.includes(b.contrast)) return fail('خيار الصبغة غير صالح');
    if (!cfg.PROTOCOLS.includes(b.protocol)) return fail('نوع الدراسة غير صالح');
    if (!cfg.SPECIALTIES.includes(b.specialty)) return fail('الاختصاص غير صالح');
    if (!cfg.PRIORITIES.includes(b.priority)) return fail('الأولوية غير صالحة');
    if (!String(b.clinical_info || '').trim()) return fail('اكتب المشاكل والمعلومات السريرية');
    if (!study.length) return fail('أرفق صور الفحص');

    const id = db.transaction(() => {
      const id = db.prepare(`INSERT INTO exams(center_id,patient_name,age,sex,referrer,modality,regions,exam_names,contrast,protocol,specialty,priority,clinical_info)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.user.id, name, age, b.sex, String(b.referrer || '').trim(), b.modality,
        JSON.stringify(regions), JSON.stringify(exams), b.contrast, b.protocol, b.specialty, b.priority, String(b.clinical_info).trim()).lastInsertRowid;
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

router.get('/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM exams WHERE id=? AND center_id=?').get(Number(req.params.id), req.user.id);
  if (!e) return res.status(404).json({ error: 'الحالة غير موجودة' });
  res.json(view(e, 'center'));
});

// تأكيد تسليم التقرير للمريض
router.post('/:id/deliver', (req, res) => {
  const r = db.prepare("UPDATE exams SET status=5, delivered_at=datetime('now') WHERE id=? AND center_id=? AND status=4")
    .run(Number(req.params.id), req.user.id);
  if (!r.changes) return res.status(409).json({ error: 'التقرير غير جاهز أو سُلّم من قبل' });
  res.json({ ok: true });
});

module.exports = router;
