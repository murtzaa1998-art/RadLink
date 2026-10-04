const db = require('./db');
const cfg = require('./config');

const caseNo = (e) => `${e.modality}-${String(e.created_at).slice(0, 4)}-${String(e.id).padStart(6, '0')}`;
const contrastFee = () => Number(db.prepare("SELECT value FROM settings WHERE key='contrast_fee'").get().value);

// السعر = (سعر النوع للمركز + رسوم الصبغة إن وُجدت) × عدد الفحوصات المختارة
function priceFor(exam) {
  const row = db.prepare('SELECT price FROM prices WHERE center_id=? AND modality=?').get(exam.center_id, exam.modality);
  const base = row ? row.price : cfg.DEFAULT_PRICES[exam.modality];
  const fee = exam.contrast !== 'N' && cfg.CONTRAST_MODALITIES.includes(exam.modality) ? contrastFee() : 0;
  return (base + fee) * JSON.parse(exam.exam_names).length;
}

// الطبيب والمركز لا يرون السعر. الإدارة فقط.
function view(e, viewerRole) {
  const out = {
    id: e.id, case_no: caseNo(e), patient_name: e.patient_name, age: e.age, sex: e.sex, referrer: e.referrer,
    modality: e.modality, regions: JSON.parse(e.regions), exam_names: JSON.parse(e.exam_names),
    contrast: e.contrast, protocol: e.protocol, specialty: e.specialty, priority: e.priority,
    clinical_info: e.clinical_info, status: e.status, report: e.report,
    created_at: e.created_at, started_at: e.started_at, reported_at: e.reported_at, delivered_at: e.delivered_at,
    files: db.prepare('SELECT id,kind,original_name,size FROM files WHERE exam_id=?').all(e.id),
  };
  if (viewerRole === 'admin') out.price = e.price;
  if (e.doctor_id) out.doctor_name = (db.prepare('SELECT name FROM users WHERE id=?').get(e.doctor_id) || {}).name;
  return out;
}

module.exports = { caseNo, priceFor, view };
