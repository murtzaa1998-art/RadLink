// قوائم أجهزة التصوير ومناطق الجسم والفحوصات
// يجب أن تبقى أسماء TYPES متوافقة مع server/config.js

const TYPES = [
  ["XR", "الأشعة العادية"],
  ["CT", "المفراس"],
  ["MRI", "الرنين المغناطيسي"],
  ["US", "السونار"],
  ["MG", "تصوير الثدي"],
  ["FL", "التنظير الشعاعي"]
];

const SPECS = [
  "أورام",
  "عظام ومفاصل",
  "أعصاب",
  "صدر وقلب",
  "بطن وجهاز هضمي",
  "عام"
];

const CATD = {

  // =========================
  // CT - المفراس
  // =========================
  CT: [
    ["الرأس والدماغ|Head & Brain",
      "CT Brain;CT Brain with Contrast;CT Head;CT Head Trauma;CT Perfusion;CT Stroke Protocol;CT Hydrocephalus;CT Sella/Pituitary"],

    ["الجيوب الأنفية|Paranasal Sinuses",
      "CT PNS;CT PNS Limited;CT PNS Navigation"],

    ["الوجه والفكين|Face & Maxillofacial",
      "CT Facial Bones;CT Maxillofacial;CT Mandible;CT TMJ"],

    ["الحجاج والعين|Orbit",
      "CT Orbit;CT Orbit with Contrast"],

    ["العظم الصدغي والأذن|Temporal Bone & Ear",
      "CT Temporal Bone;CT IAC"],

    ["الرقبة|Neck",
      "CT Neck;CT Neck with Contrast;CT Soft Tissue Neck;CT Nasopharynx;CT Oropharynx;CT Larynx;CT Thyroid"],

    ["الصدر والرئتين|Chest & Lungs",
      "CT Chest;CT Chest with Contrast;HRCT Chest;Low Dose CT Chest;CT Chest Trauma"],

    ["القلب والشرايين التاجية|Cardiac",
      "CT Coronary Angiography;CT Cardiac;CT Calcium Score"],

    ["الشريان الرئوي|Pulmonary Arteries",
      "CTPA;CT Pulmonary Angiography"],

    ["البطن|Abdomen",
      "CT Abdomen;CT Abdomen with Contrast;CT Upper Abdomen"],

    ["البطن والحوض|Abdomen & Pelvis",
      "CT Abdomen & Pelvis;CT Abdomen & Pelvis with Contrast;CT Abdomen Pelvis Trauma"],

    ["الكبد|Liver",
      "CT Liver;CT Liver with Contrast;CT Liver Triphasic;CT Liver Dynamic"],

    ["البنكرياس|Pancreas",
      "CT Pancreas;CT Pancreas Protocol;CT Pancreas Dynamic"],

    ["الطحال|Spleen",
      "CT Spleen;CT Spleen with Contrast"],

    ["الغدد الكظرية|Adrenal Glands",
      "CT Adrenal;CT Adrenal Protocol"],

    ["الكلى والمسالك البولية|Kidneys & Urinary Tract",
      "CT KUB;CT Renal Stone;CT Kidneys;CT Renal Mass;CT Urography;CT Urogram"],

    ["الأمعاء|Bowel",
      "CT Enterography;CT Small Bowel;CT Colonography"],

    ["الحوض|Pelvis",
      "CT Pelvis;CT Pelvis with Contrast;CT Bony Pelvis"],

    ["المثانة|Urinary Bladder",
      "CT Bladder;CT Cystography"],

    ["البروستات|Prostate",
      "CT Prostate;CT Prostate/Pelvis"],

    ["العمود الفقري العنقي|Cervical Spine",
      "CT Cervical Spine;CT Cervical Spine Trauma"],

    ["العمود الفقري الصدري|Thoracic Spine",
      "CT Thoracic Spine;CT Thoracic Spine Trauma"],

    ["العمود الفقري القطني|Lumbar Spine",
      "CT Lumbar Spine;CT Lumbar Spine Trauma"],

    ["العجز والعصعص|Sacrum & Coccyx",
      "CT Sacrum;CT Coccyx;CT Sacrum/Coccyx"],

    ["الكتف|Shoulder",
      "CT Shoulder;CT Shoulder Arthrography"],

    ["العضد|Humerus",
      "CT Humerus"],

    ["المرفق|Elbow",
      "CT Elbow"],

    ["الساعد|Forearm",
      "CT Forearm"],

    ["الرسغ واليد|Wrist & Hand",
      "CT Wrist;CT Hand"],

    ["الورك|Hip",
      "CT Hip;CT Hip Arthrography"],

    ["الفخذ|Femur",
      "CT Femur"],

    ["الركبة|Knee",
      "CT Knee;CT Knee Arthrography"],

    ["الساق|Leg",
      "CT Tibia/Fibula;CT Leg"],

    ["الكاحل والقدم|Ankle & Foot",
      "CT Ankle;CT Foot"],

    ["الأوعية الدموية|CT Angiography",
      "CTA Brain;CTA Head & Neck;CTA Carotid;CTA Aorta;CTA Thoracic Aorta;CTA Abdominal Aorta;CTA Renal Arteries;CTA Mesenteric Arteries;CTA Upper Limb;CTA Lower Limb;CTA Runoff"],

    ["الأورام|Oncology",
      "CT Chest Abdomen Pelvis (CAP);CT Neck Chest Abdomen Pelvis;CT Oncology Staging;CT Oncology Follow-up"],

    ["الجسم الكامل|Whole Body",
      "CT Whole Body;CT Polytrauma;CT Trauma Pan Scan"]
  ],

  // =========================
  // MRI - الرنين
  // =========================
  MRI: [
    ["الدماغ|Brain",
      "MRI Brain;MRI Brain with Contrast;MRI Brain Tumor;MRI Stroke;MRI Epilepsy Protocol;MRI Dementia Protocol"],

    ["الغدة النخامية|Pituitary",
      "MRI Pituitary;MRI Pituitary with Contrast"],

    ["الحجاج والعين|Orbit",
      "MRI Orbit;MRI Orbit with Contrast"],

    ["الأذن والقناة السمعية|IAC & Ear",
      "MRI IAC;MRI IAC with Contrast"],

    ["الوجه والفكين|Face & Maxillofacial",
      "MRI Face;MRI TMJ"],

    ["الرقبة|Neck",
      "MRI Neck;MRI Neck with Contrast;MRI Soft Tissue Neck;MRI Nasopharynx;MRI Larynx"],

    ["الضفيرة العضدية|Brachial Plexus",
      "MRI Brachial Plexus"],

    ["العمود الفقري العنقي|Cervical Spine",
      "MRI Cervical Spine;MRI Cervical Spine with Contrast"],

    ["العمود الفقري الصدري|Thoracic Spine",
      "MRI Thoracic Spine;MRI Thoracic Spine with Contrast"],

    ["العمود الفقري القطني|Lumbar Spine",
      "MRI Lumbar Spine;MRI Lumbar Spine with Contrast"],

    ["العمود الفقري الكامل|Whole Spine",
      "MRI Whole Spine"],

    ["العجز والمفصل العجزي الحرقفي|Sacrum & SI Joints",
      "MRI Sacrum;MRI Sacroiliac Joints"],

    ["الصدر|Chest",
      "MRI Chest;MRI Mediastinum"],

    ["القلب|Cardiac",
      "Cardiac MRI;Cardiac MRI with Contrast"],

    ["الثدي|Breast",
      "MRI Breast;MRI Breast with Contrast;MRI Breast Implant"],

    ["البطن|Abdomen",
      "MRI Abdomen;MRI Abdomen with Contrast"],

    ["الكبد|Liver",
      "MRI Liver;MRI Liver with Contrast;MRI Liver Dynamic"],

    ["القنوات الصفراوية والبنكرياس|MRCP",
      "MRCP;MRI Pancreas;MRI Pancreas with Contrast"],

    ["الكلى والغدد الكظرية|Kidneys & Adrenals",
      "MRI Kidneys;MRI Renal Mass;MRI Adrenal"],

    ["الأمعاء|Bowel",
      "MR Enterography"],

    ["الحوض|Pelvis",
      "MRI Pelvis;MRI Pelvis with Contrast"],

    ["البروستات|Prostate",
      "MRI Prostate;Multiparametric MRI Prostate"],

    ["الحوض النسائي|Female Pelvis",
      "MRI Female Pelvis;MRI Uterus;MRI Ovaries"],

    ["المستقيم|Rectum",
      "MRI Rectum;MRI Rectal Cancer Staging"],

    ["الكتف|Shoulder",
      "MRI Shoulder;MR Arthrogram Shoulder"],

    ["العضد|Humerus",
      "MRI Humerus"],

    ["المرفق|Elbow",
      "MRI Elbow"],

    ["الساعد|Forearm",
      "MRI Forearm"],

    ["الرسغ|Wrist",
      "MRI Wrist"],

    ["اليد والأصابع|Hand & Fingers",
      "MRI Hand;MRI Finger"],

    ["الورك|Hip",
      "MRI Hip;MR Arthrogram Hip"],

    ["الفخذ|Femur",
      "MRI Femur;MRI Thigh"],

    ["الركبة|Knee",
      "MRI Knee"],

    ["الساق|Leg",
      "MRI Leg;MRI Tibia/Fibula"],

    ["الكاحل|Ankle",
      "MRI Ankle"],

    ["القدم|Foot",
      "MRI Foot"],

    ["الأوعية|MR Angiography",
      "MRA Brain;MRA Head;MRA Neck;MRA Carotid;MRA Aorta;MRA Renal Arteries;MRA Upper Limb;MRA Lower Limb"],

    ["الأوردة|MR Venography",
      "MRV Brain;MR Venography"],

    ["الأورام والجسم الكامل|Oncology & Whole Body",
      "Whole Body MRI;MRI Oncology Staging;MRI Oncology Follow-up"]
  ],

  // =========================
  // X-RAY - الأشعة العادية
  // =========================
  XR: [
    ["الرأس والوجه|Skull & Face",
      "X-Ray Skull;X-Ray Facial Bones;X-Ray Nasal Bones;X-Ray PNS;X-Ray Mandible"],

    ["الرقبة|Neck",
      "X-Ray Soft Tissue Neck"],

    ["الصدر|Chest",
      "Chest PA;Chest AP;Chest Lateral;Chest PA & Lateral;Portable Chest;X-Ray Ribs;X-Ray Sternum"],

    ["البطن|Abdomen",
      "Abdomen Supine;Abdomen Erect;Abdomen Supine & Erect;X-Ray KUB"],

    ["الحوض|Pelvis",
      "X-Ray Pelvis;X-Ray Hip"],

    ["العمود الفقري العنقي|Cervical Spine",
      "X-Ray Cervical Spine"],

    ["العمود الفقري الصدري|Thoracic Spine",
      "X-Ray Thoracic Spine"],

    ["العمود الفقري القطني|Lumbar Spine",
      "X-Ray Lumbar Spine"],

    ["العجز والعصعص|Sacrum & Coccyx",
      "X-Ray Sacrum;X-Ray Coccyx;X-Ray Sacroiliac Joints"],

    ["العمود الفقري الكامل|Whole Spine",
      "X-Ray Whole Spine;Scoliosis Series"],

    ["الكتف والترقوة|Shoulder & Clavicle",
      "X-Ray Shoulder;X-Ray Clavicle;X-Ray AC Joint"],

    ["العضد|Humerus",
      "X-Ray Humerus"],

    ["المرفق|Elbow",
      "X-Ray Elbow"],

    ["الساعد|Forearm",
      "X-Ray Forearm"],

    ["الرسغ|Wrist",
      "X-Ray Wrist;X-Ray Scaphoid"],

    ["اليد والأصابع|Hand & Fingers",
      "X-Ray Hand;X-Ray Finger;X-Ray Thumb"],

    ["الورك|Hip",
      "X-Ray Hip"],

    ["الفخذ|Femur",
      "X-Ray Femur"],

    ["الركبة|Knee",
      "X-Ray Knee;X-Ray Patella"],

    ["الساق|Leg",
      "X-Ray Tibia/Fibula"],

    ["الكاحل|Ankle",
      "X-Ray Ankle"],

    ["القدم والأصابع|Foot & Toes",
      "X-Ray Foot;X-Ray Calcaneus;X-Ray Toe"],

    ["فحوصات خاصة|Special",
      "Bone Age;Skeletal Survey;Leg Length Study;Scoliosis Whole Spine"]
  ],

  // =========================
  // ULTRASOUND - السونار
  // =========================
  US: [
    ["البطن|Abdomen",
      "US Abdomen;US Upper Abdomen;US Liver;US Gallbladder;US Pancreas;US Spleen"],

    ["الكلى والمسالك البولية|Urinary System",
      "US Kidneys;US KUB;US Renal;US Urinary Bladder"],

    ["الحوض|Pelvis",
      "US Pelvis"],

    ["البروستات|Prostate",
      "US Prostate;US Prostate & Bladder"],

    ["النسائية|Gynecology",
      "US Female Pelvis;US Uterus & Ovaries;Transvaginal Ultrasound"],

    ["الحمل|Obstetric",
      "US Early Pregnancy;US Obstetric;US Fetal Growth;US Anomaly Scan;US Fetal Wellbeing"],

    ["الغدة الدرقية|Thyroid",
      "US Thyroid"],

    ["الرقبة|Neck",
      "US Neck;US Cervical Lymph Nodes"],

    ["الثدي|Breast",
      "US Breast;US Bilateral Breast"],

    ["الخصية|Scrotum",
      "US Scrotum;US Testicular"],

    ["الأنسجة الرخوة|Soft Tissue",
      "US Soft Tissue;US Superficial Mass"],

    ["المفاصل والعضلات|Musculoskeletal",
      "US Shoulder;US Elbow;US Wrist;US Hand;US Hip;US Knee;US Ankle;US Foot"],

    ["الشرايين السباتية|Carotid Doppler",
      "Doppler Carotid;Carotid Duplex"],

    ["أوردة الأطراف السفلية|Lower Limb Venous Doppler",
      "Doppler Lower Limb Veins;DVT Study"],

    ["شرايين الأطراف السفلية|Lower Limb Arterial Doppler",
      "Doppler Lower Limb Arteries"],

    ["أوعية الأطراف العلوية|Upper Limb Doppler",
      "Doppler Upper Limb Veins;Doppler Upper Limb Arteries"],

    ["أوعية الكلى|Renal Doppler",
      "Doppler Renal Arteries"],

    ["أوعية البطن|Abdominal Doppler",
      "Doppler Portal Vein;Doppler Hepatic Vessels;Doppler Abdominal Aorta"]
  ],

  // =========================
  // MAMMOGRAPHY
  // =========================
  MG: [
    ["الثدي|Breast",
      "Screening Mammography;Diagnostic Mammography;Bilateral Mammography;Unilateral Mammography;Magnification View;Spot Compression View"],

    ["زراعة الثدي|Breast Implant",
      "Mammography Implant Views"]
  ],

  // =========================
  // FLUOROSCOPY
  // =========================
  FL: [
    ["المريء والبلع|Esophagus & Swallow",
      "Barium Swallow;Video Fluoroscopic Swallow Study"],

    ["المعدة والجهاز الهضمي العلوي|Upper GI",
      "Barium Meal;Upper GI Study"],

    ["الأمعاء الدقيقة|Small Bowel",
      "Barium Follow-Through;Small Bowel Follow-Through"],

    ["القولون|Colon",
      "Barium Enema"],

    ["الجهاز البولي|Urinary System",
      "IVU;Cystogram;MCUG/VCUG;Retrograde Urethrogram"],

    ["الجهاز التناسلي الأنثوي|Female Reproductive",
      "HSG"],

    ["الناسور|Fistula",
      "Fistulogram;Sinogram"],

    ["المفاصل|Arthrography",
      "Shoulder Arthrogram;Hip Arthrogram;Knee Arthrogram"],

    ["أخرى|Other",
      "Fluoroscopy Guided Procedure"]
  ]
};


// أنواع الصبغة
const CONS = {
  N: "بدون صبغة",
  IV: "صبغة وريدية IV",
  O: "صبغة فموية",
  B: "IV + فموية",
  X: "أخرى"
};


// البروتوكولات
const PROTO = [
  "Routine",
  "Angiography",
  "Oncology/Staging",
  "Follow-up",
  "Trauma",
  "Dynamic/Multiphasic",
  "Other"
];


// الأولوية
const PRI = {
  R: "عادي",
  U: "عاجل",
  S: "طارئ STAT"
};


// حالة الفحص
const SN = [
  "",
  "تم الاستلام",
  "بانتظار القراءة",
  "قيد القراءة",
  "التقرير جاهز",
  "تم التسليم"
];
