
const express = require('express');
const db = require('../db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || './uploads',
  'patient-requests'
);
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  fileFilter: (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.dcm', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowed.includes(ext)) {
    return cb(new Error('نوع الملف غير مسموح'));
  }

  cb(null, true);
},
  storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  }
}),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 10
  }
});
router.post('/requests', upload.array('study', 10), (req, res) => {
  try {
    const b = req.body || {};
    const name = String(b.patient_name || '').trim();
    const phone = String(b.phone || '').trim();
    const age = Number(b.age);
const files = req.files || [];

if (files.length === 0) {
  return res.status(400).json({
    error: 'يرجى رفع صور الفحص'
  });
}
    if (name.split(/\s+/).length < 3) {
      return res.status(400).json({ error: 'يرجى كتابة اسم المريض الثلاثي' });
    }

    if (!/^07\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'رقم الموبايل غير صحيح' });
    }

    if (!Number.isInteger(age) || age < 0 || age > 120) {
      return res.status(400).json({ error: 'العمر غير صحيح' });
    }

    if (!['ذكر', 'أنثى'].includes(b.sex)) {
      return res.status(400).json({ error: 'يرجى تحديد الجنس' });
    }

    const requestId = crypto.randomUUID();

const requestData = {
  patient_name: name,
  age: age,
  sex: b.sex,
  phone: phone,
  modality: b.modality,
  regions: b.regions,
  exam_names: b.exam_names,
  protocol: b.protocol,
  contrast: b.contrast,
  priority: b.priority,
  referrer: b.referrer || '',
  clinical_info: b.clinical_info
};
    if (!requestData.clinical_info ||
    !String(requestData.clinical_info).trim()) {
  return res.status(400).json({
    error: 'يرجى إدخال المعلومات السريرية'
  });
}
    if (!['XR', 'CT', 'MRI', 'US', 'MG', 'FL'].includes(requestData.modality)) {
  return res.status(400).json({
    error: 'يرجى اختيار نوع تصوير صحيح'
  });
}
    if (!['Normal', 'Contrast', 'Oncology', 'Angiography'].includes(requestData.protocol)) {
  return res.status(400).json({
    error: 'يرجى اختيار نوع الدراسة الصحيح'
  });
}

if (requestData.protocol === 'Normal') {
  requestData.contrast = 'N';
} else if (!['IV', 'Oral', 'IV+Oral'].includes(requestData.contrast)) {
  return res.status(400).json({
    error: 'يرجى اختيار نوع الصبغة الصحيح'
  });
}
    if (!String(requestData.regions || '').trim() ||
    !String(requestData.exam_names || '').trim()) {
  return res.status(400).json({
    error: 'يرجى تحديد منطقة الفحص واسم الفحص'
  });
}
    if (!['N', 'U'].includes(requestData.priority)) {
  return res.status(400).json({
    error: 'يرجى اختيار أولوية الفحص'
  });
}
    if (!files.length) {
  return res.status(400).json({
    error: 'يرجى رفع صورة واحدة على الأقل للفحص'
  });
}
    
    const result = db.prepare(`
  INSERT INTO patient_requests (
    patient_name, age, sex, phone,
    modality, regions, exam_names,
    contrast, protocol, priority,
    referrer, clinical_info
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  requestData.patient_name,
  requestData.age,
  requestData.sex,
  requestData.phone,
  requestData.modality,
  requestData.regions,
  requestData.exam_names,
  requestData.contrast,
  requestData.protocol,
  requestData.priority,
  requestData.referrer,
  requestData.clinical_info
);
    const saveFile = db.prepare(`
  INSERT INTO patient_request_files
  (request_id, original_name, stored_name, mime, size)
  VALUES (?, ?, ?, ?, ?)
`);

for (const file of files) {
  saveFile.run(
    result.lastInsertRowid,
    file.originalname,
    file.filename,
    file.mimetype,
    file.size
  );
}
    return res.status(201).json({
  success: true,
  request_id: Number(result.lastInsertRowid),
  message: 'تم تسجيل طلب الفحص بنجاح'
});
  } catch (err) {
    for (const file of (req.files || [])) {
  try {
    fs.unlinkSync(file.path);
  } catch (cleanupErr) {
    console.error('File cleanup failed:', cleanupErr);
  }
}
    console.error(err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.code === 'LIMIT_FILE_SIZE'
        ? 'حجم الملف يتجاوز 20 ميغابايت'
        : 'خطأ في رفع الملفات أو تجاوز العدد المسموح'
    });
  }

  if (err.message === 'نوع الملف غير مسموح') {
    return res.status(400).json({
      error: err.message
    });
  }

  next(err);
});
module.exports = router;
