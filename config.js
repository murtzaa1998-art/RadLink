// الثوابت المشتركة. غيّر القوائم هنا فقط.
module.exports = {
  MODALITIES: ['XR', 'CT', 'MRI', 'US', 'MG', 'FL'],
  CONTRAST_MODALITIES: ['CT', 'MRI', 'FL'], // الأنواع التي تُضاف عليها رسوم الصبغة
  SPECIALTIES: ['أورام', 'عظام ومفاصل', 'أعصاب', 'صدر وقلب', 'بطن وجهاز هضمي', 'عام'],
  PROTOCOLS: ['Routine', 'Angiography', 'Oncology/Staging', 'Follow-up', 'Trauma', 'Dynamic/Multiphasic', 'Other'],
  CONTRASTS: ['N', 'IV', 'O', 'B', 'X'], // N=بدون، IV=وريدية، O=فموية، B=الاثنان، X=أخرى
  PRIORITIES: ['R', 'U', 'S'], // عادي، عاجل، طارئ
  DEFAULT_PRICES: { XR: 5000, CT: 15000, MRI: 25000, US: 7000, MG: 12000, FL: 15000 },
  DEFAULT_CONTRAST_FEE: 5000,
  // 2 بانتظار القراءة، 3 قيد القراءة، 4 التقرير جاهز، 5 تم التسليم
  STATUS: { WAITING: 2, READING: 3, READY: 4, DELIVERED: 5 },
};
