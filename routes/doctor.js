// مسارات الطبيب: يرى حالات اختصاصه فقط، ولا يرى الأسعار
const router = require('express').Router();
const db = require('../db');
const { auth, role } = require('../middleware');
const { view, priceFor } = require('../lib');

router.use(auth, role('doctor'));

// الطارئ ثم العاجل ثم العادي، والحالات المنتهية في الآخر
router.get('/cases', (req, res) => {
  const rows = db.prepare(`SELECT * FROM exams WHERE specialty=?
    ORDER BY (status>=4), CASE priority WHEN 'S' THEN 0 WHEN 'U' THEN 1 ELSE 2 END, created_at`).all(req.user.specialty);
  res.json(rows.map((e) => view(e, 'doctor')));
});

const mine = (id, u) => db.prepare('SELECT * FROM exams WHERE id=? AND specialty=?').get(Number(id), u.specialty);

// فتح الحالة: تتحول إلى «قيد القراءة» ويُسجَّل الطبيب ووقت البدء
router.post('/cases/:id/open', (req, res) => {
  const e = mine(req.params.id, req.user);
  if (!e) return res.status(404).json({ error: 'الحالة غير موجودة' });
  db.prepare("UPDATE exams SET status=3, started_at=datetime('now'), doctor_id=? WHERE id=? AND status=2").run(req.user.id, e.id);
  res.json(view(mine(e.id, req.user), 'doctor'));
});

// اعتماد التقرير: يُحسب السعر ويُثبَّت على الحالة وتدخل الجرد الشهري
router.post('/cases/:id/report', (req, res) => {
  const e = mine(req.params.id, req.user);
  if (!e) return res.status(404).json({ error: 'الحالة غير موجودة' });
  const text = String((req.body || {}).report || '').trim();
  if (!text) return res.status(400).json({ error: 'اكتب التقرير' });
  if (e.status >= 4) return res.status(409).json({ error: 'التقرير معتمد من قبل' });
  if (e.doctor_id && e.doctor_id !== req.user.id) return res.status(403).json({ error: 'الحالة قيد القراءة عند طبيب آخر' });
  db.prepare("UPDATE exams SET report=?, status=4, doctor_id=?, price=?, reported_at=datetime('now'), started_at=COALESCE(started_at,datetime('now')) WHERE id=?")
    .run(text, req.user.id, priceFor(e), e.id);
  res.json(view(mine(e.id, req.user), 'doctor'));
});

module.exports = router;
