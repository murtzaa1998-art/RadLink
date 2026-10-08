// تنزيل ملفات الفحص: للإدارة، أو صاحب المركز، أو طبيب نفس الاختصاص فقط
const router = require('express').Router();
const path = require('path');
const db = require('../db');
const { auth } = require('../middleware');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

router.get('/:id', auth, (req, res) => {
  const f = db.prepare(`
  SELECT f.*, e.center_id, e.doctor_id,
    EXISTS (
      SELECT 1 FROM doctor_centers dc
      WHERE dc.doctor_id = e.doctor_id
        AND dc.center_id = e.center_id
    ) AS doctor_allowed
  FROM files f
  JOIN exams e ON e.id = f.exam_id
  WHERE f.id = ?
`).get(Number(req.params.id));
  const u = req.user;
  const ok = f && (
  u.role === 'admin' ||
  (u.role === 'center' && f.center_id === u.id) ||
  (u.role === 'doctor' &&
    f.doctor_id === u.id &&
    f.doctor_allowed === 1)
);
  if (!ok) return res.status(404).json({ error: 'الملف غير موجود' });
  res.download(path.join(UPLOAD_DIR, path.basename(f.stored_name)), f.original_name);
});

module.exports = router;
