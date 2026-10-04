# منصة قراءة الفحوصات الطبية

مستودع كامل: خادم Node.js مع قاعدة بيانات SQLite، وواجهة أمامية جاهزة في مجلد `public`. يشمل: تسجيل دخول منفصل للمراكز والأطباء والإدارة، رفع الفحوصات، توجيه الحالات حسب الاختصاص، التقارير، الأسعار لكل مركز، والجرد الشهري.

## التشغيل
1. ثبّت Node.js (الإصدار 20 أو أحدث) من nodejs.org
2. افتح الطرفية داخل هذا المجلد ونفّذ:
   ```
   npm install
   cp .env.example .env
   ```
3. افتح ملف `.env` وغيّر `JWT_SECRET` إلى نص عشوائي طويل، وغيّر بريد وكلمة مرور الإدارة.
4. (اختياري للتجربة) أضف حسابات تجريبية: `npm run seed:demo` (كلمة مرور الكل `Demo-Pass-1`، مثل amal@demo.iq للمركز وsara@demo.iq للطبيبة)
5. شغّل: `npm start`  ثم افتح http://localhost:3000

عند أول تشغيل يُنشأ حساب الإدارة تلقائياً من `.env`.

## هيكل المشروع
- `server.js` تشغيل التطبيق وربط المسارات
- `db.js` الجداول وإنشاء حساب الإدارة
- `config.js` القوائم (أنواع التصوير، الاختصاصات، الأولويات...) والأسعار الافتراضية
- `middleware.js` التحقق من الدخول والصلاحيات
- `lib.js` رقم الحالة وحساب السعر
- `routes/` المسارات: auth, admin, exams (المركز), doctor, files
- `public/` الواجهة الأمامية: index.html و app.js و catalog.js (قوائم الفحوصات) و style.css
- `scripts/seed-demo.js` حسابات تجريبية
- `Dockerfile` و `docker-compose.yml` للتشغيل على سيرفر: `docker compose up -d --build`

## المسارات (API)
| الطريقة | المسار | من يستخدمه |
|---|---|---|
| POST | /api/auth/login  `{email,password,portal}` | الجميع |
| POST | /api/auth/logout , GET /api/auth/me | الجميع |
| GET/POST | /api/admin/centers | الإدارة |
| PUT | /api/admin/centers/:id/prices `{"CT":15000,...}` | الإدارة |
| GET/POST | /api/admin/doctors | الإدارة |
| PATCH | /api/admin/users/:id `{active,password}` | الإدارة |
| GET/PUT | /api/admin/settings (رسوم الصبغة) | الإدارة |
| GET | /api/admin/statement?month=2026-10 | الإدارة |
| POST | /api/exams (multipart: study[], prior[] + الحقول) | المركز |
| GET | /api/exams , /api/exams/:id | المركز |
| POST | /api/exams/:id/deliver | المركز |
| GET | /api/doctor/cases | الطبيب |
| POST | /api/doctor/cases/:id/open | الطبيب |
| POST | /api/doctor/cases/:id/report `{report}` | الطبيب |
| GET | /api/files/:id | حسب الصلاحية |

حقول رفع الفحص: patient_name, age, sex, referrer, modality, regions (JSON array), exam_names (JSON array), contrast (N/IV/O/B/X), protocol, specialty, priority (R/U/S), clinical_info, و study (ملفات الفحص), prior (أوليات المريض).

## اختبار سريع
```
curl -c c.txt -H "Content-Type: application/json" -d '{"email":"admin@platform.iq","password":"ChangeMe-123!","portal":"admin"}' http://localhost:3000/api/auth/login
curl -b c.txt -H "Content-Type: application/json" -d '{"name":"مستشفى الأمل","email":"amal@example.com","password":"Strong-Pass-1"}' http://localhost:3000/api/admin/centers
curl -b c.txt -H "Content-Type: application/json" -d '{"name":"د. سارة","email":"sara@example.com","password":"Strong-Pass-2","specialty":"أورام"}' http://localhost:3000/api/admin/doctors
```

## قبل استخدام بيانات مرضى حقيقية
- شغّل الخادم خلف HTTPS فقط، وضع `COOKIE_SECURE=true`.
- خذ نسخاً احتياطية دورية لمجلدي `data` و `uploads` وخزّنها في مكان آخر.
- لا ترفع `.env` ولا `data` ولا `uploads` إلى أي مستودع عام.
- راجع الأنظمة المحلية المتعلقة بخصوصية البيانات الطبية.
- لملفات DICOM الكبيرة والعدد الكبير من المراكز، الأفضل لاحقاً الانتقال إلى PostgreSQL وتخزين ملفات خارجي.
