
const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/requests', (req, res) => {
  try {
    const b = req.body || {};
    const name = String(b.patient_name || '').trim();
    const phone = String(b.phone || '').trim();
    const age = Number(b.age);

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

    // لا نقبل طلبات حقيقية قبل تفعيل رفع الملفات والدفع الآمن.
    return res.status(503).json({
      error: 'استقبال الطلبات غير مفعل بعد. يرجى الانتظار لحين اكتمال رفع الفحوصات والدفع الإلكتروني.'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;
