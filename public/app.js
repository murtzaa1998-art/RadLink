// الواجهة الأمامية: تتصل بالخادم عبر /api
const PORTAL = { c: 'center', d: 'doctor', a: 'admin' };
const $ = (id) => document.getElementById(id);
const E = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const L = (a) => a.map((x) => `<option>${E(x)}</option>`).join('');
const O = (a, s) => a.map((x, i) => `<option value="${i}"${i == s ? ' selected' : ''}>${E(x)}</option>`).join('');
const parse = (s) => {
  if (!s) return null;

  let x = String(s).trim();

  // تواريخ SQLite تكون UTC مثل: 2026-10-06 09:30:00
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(x)) {
    x = x.replace(' ', 'T') + 'Z';
  } else {
    x = x.replace(' ', 'T');
  }

  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d;
};

const T = (s) => {
  const d = parse(s);
  return d ? d.toLocaleString('ar-IQ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';
};

const fmt = (n) => Number(n || 0).toLocaleString('ar-IQ') + ' د.ع';
const pb = (p) => `<span class="pb ${p}">${PRI[p]}</span>`;
const v = (id) => $(id).value.trim();
const pr = (id) => [...document.querySelectorAll(`#${id} .chip[aria-pressed=true]`)].map((x) => x.dataset.v);
const isImg = (n) => /\.(jpe?g|png|gif|webp)$/i.test(n);
const trk = (s) => `<span class="trk${s > 3 ? ' k' : ''}">${[1, 2, 3, 4, 5].map((i) => `<i${i <= s ? ' class="on"' : ''}></i>`).join('')}</span>${SN[s]}`;

const S = {
  user: null,
  lr: '',
  tab: '',
  open: null,
  msg: '',
  list: [],
  centers: [],
  doctors: [],
  settings: { contrast_fee: 0 },
  stmt: null,
  month: new Date().toISOString().slice(0, 7),
  pc: 0,

  // فلاتر صفحة فحوصاتي
  caseSearch: '',
  caseFilter: 'all',
  caseDate: ''
};

async function send(method, path, body) {
  const r = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });

  let j = {};
  try {
    j = await r.json();
  } catch (e) {}

  if (!r.ok) {
    const e = new Error(j.error || 'حدث خطأ');
    e.status = r.status;
    throw e;
  }

  return j;
}

async function load() {
  const u = S.user.role;

  if (u === 'center') {
    S.list = await send('GET', '/exams');

    if (S.tab === 'statement') {
      S.stmt = await send('GET', '/exams/statement?month=' + S.month);
    }
  } else if (u === 'doctor') {
    S.list = await send('GET', '/doctor/cases');
  } else {
    [S.centers, S.doctors, S.settings, S.stmt] = await Promise.all([
      send('GET', '/admin/centers'),
      send('GET', '/admin/doctors'),
      send('GET', '/admin/settings'),
      send('GET', '/admin/statement?month=' + S.month)
    ]);

    if (S.pc >= S.centers.length) S.pc = 0;
  }
}

/* ---------- تصميم واجهة تسجيل الدخول ---------- */

const LOGIN_CSS = `
.lg{
  position:fixed;
  inset:0;
  z-index:50;
  overflow:auto;
  background:#030a14;
  color:#e6f6ff;
  font-family:Cairo,Tahoma,Arial,sans-serif;
  direction:rtl
}

.lg *{box-sizing:border-box}

.lg-vid,#lgfx{
  position:fixed;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover
}

.lg-vid{opacity:.35}

.lg-vig{
  position:fixed;
  inset:0;
  pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 35%,#030a14 100%)
}

.lg-wrap{
  position:relative;
  min-height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:56px;
  padding:40px 5vw;
  flex-wrap:wrap
}

.lg-brand{
  flex:1 1 380px;
  max-width:560px
}

.lg-logo{
  width:84px;
  height:84px;
  margin-bottom:20px;
  filter:drop-shadow(0 0 14px #22d3ee)
}

.lg-logo .r{
  transform-origin:50% 50%;
  animation:lgspin 9s linear infinite
}

.lg-brand h1{
  font-size:clamp(30px,4.4vw,52px);
  line-height:1.25;
  margin:0 0 14px;
  font-weight:800;
  background:linear-gradient(90deg,#fff,#67e8f9 60%,#22d3ee);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent
}

.lg-brand p{
  font-size:18px;
  line-height:1.9;
  color:#9fc3d6;
  margin:0 0 24px
}

.lg-tags{
  display:flex;
  gap:10px;
  flex-wrap:wrap
}

.lg-tags span{
  padding:7px 16px;
  border:1px solid #22d3ee55;
  border-radius:999px;
  background:#22d3ee14;
  color:#67e8f9;
  font-size:14px;
  letter-spacing:1px;
  box-shadow:0 0 14px #22d3ee22 inset
}

.lg-card{
  flex:0 1 430px;
  width:100%;
  padding:32px;
  border-radius:22px;
  background:rgba(8,22,38,.72);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  border:1px solid #22d3ee44;
  box-shadow:0 0 0 1px #000,0 20px 70px #000a,0 0 60px #22d3ee22;
  position:relative;
  animation:lgin .8s ease both
}

.lg-card::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:22px;
  padding:1px;
  pointer-events:none;
  background:linear-gradient(120deg,#22d3ee,transparent 40%,transparent 60%,#818cf8);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask-composite:exclude;
  opacity:.6
}

.lg-card h2{
  margin:0 0 6px;
  font-size:26px;
  color:#fff
}

.lg-card .msg{
  color:#9fc3d6;
  margin:0 0 20px;
  font-size:15px
}

.lg .chips{
  display:flex;
  flex-direction:column;
  gap:12px
}

.lg button.chip{
  display:flex;
  align-items:center;
  gap:14px;
  width:100%;
  padding:16px 18px;
  text-align:right;
  font:inherit;
  font-size:17px;
  font-weight:700;
  color:#e6f6ff;
  cursor:pointer;
  background:linear-gradient(90deg,#22d3ee12,#0b1e3380);
  border:1px solid #22d3ee44;
  border-radius:14px;
  transition:.25s
}

.lg button.chip:hover{
  transform:translateX(-6px);
  border-color:#22d3ee;
  box-shadow:0 0 26px #22d3ee44;
  background:linear-gradient(90deg,#22d3ee2a,#0b1e33)
}

.lg button.chip i{
  font-style:normal;
  font-size:26px;
  width:46px;
  height:46px;
  display:grid;
  place-items:center;
  border-radius:12px;
  background:#22d3ee1c
}

.lg button.chip small{
  display:block;
  font-weight:400;
  color:#8fb3c7;
  font-size:13px;
  margin-top:2px
}

.lg button *{pointer-events:none}

.lg label{
  display:block;
  margin:0 0 7px;
  color:#9fc3d6;
  font-size:14px
}

.lg input{
  width:100%;
  padding:14px 16px;
  font:inherit;
  font-size:16px;
  color:#fff;
  background:#030a14b3;
  border:1px solid #22d3ee44;
  border-radius:12px;
  outline:none;
  transition:.2s;
  direction:ltr;
  text-align:left
}

.lg input:focus{
  border-color:#22d3ee;
  box-shadow:0 0 0 3px #22d3ee33,0 0 24px #22d3ee33
}

.lg .err{
  color:#fb7185;
  min-height:22px;
  margin:12px 0 4px;
  font-size:14px
}

.lg button.btn{
  width:100%;
  padding:15px;
  margin-top:6px;
  font:inherit;
  font-size:18px;
  font-weight:800;
  color:#03121f;
  cursor:pointer;
  border:0;
  border-radius:12px;
  background:linear-gradient(90deg,#22d3ee,#67e8f9);
  box-shadow:0 0 30px #22d3ee66;
  transition:.2s
}

.lg button.btn:hover{
  transform:translateY(-2px);
  box-shadow:0 0 46px #22d3eeaa
}

.lg button.alt{
  width:100%;
  margin-top:12px;
  padding:12px;
  font:inherit;
  font-size:15px;
  color:#9fc3d6;
  background:transparent;
  border:1px solid #ffffff22;
  border-radius:12px;
  cursor:pointer;
  transition:.2s
}

.lg button.alt:hover{
  color:#fff;
  border-color:#ffffff66
}

.lg-snd{
  position:fixed;
  top:18px;
  left:18px;
  z-index:3;
  width:46px;
  height:46px;
  font-size:20px;
  cursor:pointer;
  color:#fff;
  border-radius:50%;
  background:#0b1e33cc;
  border:1px solid #22d3ee55
}

@keyframes lgspin{
  to{transform:rotate(360deg)}
}

@keyframes lgin{
  from{
    opacity:0;
    transform:translateY(26px) scale(.97)
  }
  to{
    opacity:1;
    transform:none
  }
}

@media(max-width:760px){
  .lg-wrap{
    gap:28px;
    padding:70px 18px 30px
  }

  .lg-brand{text-align:center}
  .lg-tags{justify-content:center}
  .lg-logo{margin-inline:auto}
  .lg-card{padding:24px}
}

@media(prefers-reduced-motion:reduce){
  .lg *{animation:none!important}
}
`;

function ensureLoginAssets() {
  if (!document.getElementById('lg-css')) {
    const st = document.createElement('style');
    st.id = 'lg-css';
    st.textContent = LOGIN_CSS;
    document.head.appendChild(st);
  }
}

function vLogin() {
  ensureLoginAssets();
  const vid = window.LOGIN_VIDEO
    ? `<video class="lg-vid" src="${window.LOGIN_VIDEO}" autoplay muted loop playsinline></video>`
    : '';

  const logo = `
    <svg class="lg-logo" viewBox="0 0 100 100" fill="none" stroke="#22d3ee" stroke-width="3">
      <circle cx="50" cy="50" r="44" opacity=".4"/>
      <g class="r">
        <circle cx="50" cy="50" r="34" stroke-dasharray="14 8"/>
      </g>
      <circle cx="50" cy="50" r="18" fill="#22d3ee22"/>
      <path d="M50 32v36M32 50h36" stroke="#67e8f9"/>
    </svg>`;

  const brand = `
    <section class="lg-brand">
      ${logo}
      <h1>منصة تقارير الأشعة والمفراس</h1>
      <p>ارفع فحوصات الأشعة السينية والمفراس والرنين بأمان، ويكتب لك الأطباء المختصون تقاريرها بدقة وسرعة.</p>
      <div class="lg-tags">
        <span>X-RAY</span>
        <span>CT</span>
        <span>MRI</span>
      </div>
    </section>`;

  let card;

  if (!S.lr) {
    card = `
      <div class="lg-card">
        <h2>مرحباً بك في المنصة</h2>
        <p class="msg">اختر نوع الحساب للدخول.</p>

        <div class="chips">
          <button class="chip big" data-lr="c">
            <i>🏥</i>
            <span>دخول المراكز والمستشفيات
              <small>رفع الفحوصات ومتابعة التقارير</small>
            </span>
          </button>

          <button class="chip big" data-lr="d">
            <i>🩺</i>
            <span>دخول الأطباء
              <small>كتابة تقارير الأشعة</small>
            </span>
          </button>

          <button class="chip big" data-lr="a">
            <i>🛡️</i>
            <span>دخول الإدارة
              <small>إدارة المنصة والفواتير</small>
            </span>
          </button>
        </div>
      </div>`;
  } else {
    const N = {
      c: 'المراكز والمستشفيات',
      d: 'الأطباء',
      a: 'الإدارة'
    }[S.lr];

    card = `
      <div class="lg-card">
        <h2>دخول ${N}</h2>
        <p class="msg">أدخل بياناتك للمتابعة.</p>

        <label>البريد الإلكتروني</label>
        <input id="em" type="email" autocomplete="username">

        <label style="margin-top:14px">كلمة المرور</label>
        <input id="pw" type="password" autocomplete="current-password">

        <div class="msg err" id="lm">${E(S.msg)}</div>

        <button class="btn" id="li">دخول</button>
        <button class="alt" data-lr="">رجوع</button>
      </div>`;
  }

  return `
    <div class="lg">
      ${vid}
      <canvas id="lgfx"></canvas>
      <div class="lg-vig"></div>

      <button type="button" id="sndt" class="lg-snd" aria-label="الصوت">🔊</button>

      <div class="lg-wrap">
        ${brand}
        ${card}
      </div>
    </div>`;
}
function vNew() {
  return `<div class="card"><h2>إضافة فحص جديد</h2>
<h3><b>1</b>بيانات المريض</h3><div class="g"><div class="w"><label>اسم المريض الثلاثي أو الرباعي</label><input id="n" autocomplete="off"></div><div><label>العمر</label><input id="a" type="number" min="0" max="120"></div><div><label>الجنس</label><select id="g"><option>ذكر</option><option>أنثى</option></select></div><div><label>الطبيب المُرسِل <small>(اختياري)</small></label><input id="rf" placeholder="يمكن تركه فارغاً"></div></div>
<h3><b>2</b>نوع التصوير</h3>
<div class="g">
  <div class="w">
    <label>اختر نوع التصوير</label>
    <select id="md">
      <option value="">-- اختر نوع التصوير --</option>
      ${TYPES.map((t) => `<option value="${t[0]}">${t[1]} · ${t[0]}</option>`).join('')}
    </select>
  </div>
</div>
<h3><b>3</b>المنطقة والفحص المطلوب</h3><div id="ex"><span class="empty">اختر نوع التصوير أولاً، ثم اختر الفحوصات المطلوبة (يمكن اختيار أكثر من فحص).</span></div>
<h3><b>4</b>الصبغة والبروتوكول</h3><div class="g"><div>
  <label>نوع الفحص</label>
  <select id="pr">
    <option value="Normal">فحص عادي بدون صبغة</option>
    <option value="Contrast">فحص مع صبغة</option>
    <option value="Oncology">فحص أورام</option>
    <option value="Angiography">فحص Angio</option>
  </select>
</div>

<div>
  <label>الصبغة</label>
  <select id="ct" disabled>
    ${Object.keys(CONS).map((k) => `<option value="${k}">${CONS[k]}</option>`).join('')}
  </select>
</div></div>

<h3><b>5</b>المعلومات السريرية والأولوية</h3>
<div class="g">
  <div class="w">
    <label>المشاكل والأعراض والتاريخ السريري</label>
    <textarea id="cp"></textarea>
  </div>
  <div class="w">
    <label>إرفاق أوليات المريض أو ورقة الفحص (صور أو PDF)</label>
    <input type="file" id="hf" multiple accept="image/*,.pdf">
  </div>
</div>

<div class="chips" id="pi" data-s="1" style="margin-top:12px">
  <button type="button" class="chip big" data-v="R" aria-pressed="true">عادي</button>
  <button type="button" class="chip big" data-v="U" aria-pressed="false">عاجل</button>
  <button type="button" class="chip big stat" data-v="S" aria-pressed="false">طارئ STAT</button>
</div>

<h3><b>6</b>رفع صور الفحص</h3>
<input type="file" id="ff" multiple>
<div class="msg" id="fc">DICOM أو PDF أو JPG، ويمكن رفع أكثر من ملف.</div>
<progress class="bar" id="pg" value="0" max="100" hidden></progress>

<div class="msg err" id="fm"></div>
<button class="btn" id="up">إرسال للطبيب</button></div>`;
}

function vCases() {
  const all = S.list;
  const o = all.find((e) => e.id === S.open);

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  // البحث باسم المريض
  const search = (S.caseSearch || '').trim().toLowerCase();

  // نوع الفلترة الزمنية
  const filter = S.caseFilter || 'all';
  const selectedDate = S.caseDate || '';

  let l = all.filter((e) => {
    if (
      search &&
      !String(e.patient_name || '').toLowerCase().includes(search)
    ) {
      return false;
    }

    const d = parse(e.created_at);
    if (!d) return true;

    if (filter === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return d >= start && d <= end;
    }

    if (filter === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return d >= start && d <= end;
    }

    if (filter === 'month') {
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return d >= start && d <= end;
    }

    if (filter === 'year') {
      const start = new Date();
      start.setDate(start.getDate() - 364);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return d >= start && d <= end;
    }

    if (filter === 'date' && selectedDate) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${y}-${m}-${day}` === selectedDate;
    }

    return true;
  });

  const td = now.toDateString();

  const c = [
    [
      'حالات اليوم',
      all.filter((e) => {
        const d = parse(e.created_at);
        return d && d.toDateString() === td;
      }).length
    ],
    ['بانتظار التقرير', all.filter((e) => e.status < 4).length],
    ['تقارير مكتملة', all.filter((e) => e.status >= 4).length]
  ];

  let h = `
    <div class="dash">
      ${c.map((x) => `
        <div>
          <span>${x[0]}</span>
          <b>${x[1]}</b>
        </div>
      `).join('')}
    </div>

    ${S.msg ? `<div class="msg">${E(S.msg)}</div>` : ''}

    <div class="card">
      <h2>فحوصاتي</h2>

      <div class="g" style="grid-template-columns:minmax(260px,2fr) minmax(180px,1fr) minmax(180px,1fr);width:100%;grid-column:1/-1">
        <div class="w">
          <label>البحث باسم المريض</label>
          <input
            id="caseSearch"
            type="search"
            placeholder="اكتب اسم المريض..."
            value="${E(S.caseSearch || '')}">
        </div>

        <div>
          <label>عرض الفحوصات</label>
          <select id="caseFilter">
            <option value="all" ${filter === 'all' ? 'selected' : ''}>كل الفحوصات</option>
            <option value="today" ${filter === 'today' ? 'selected' : ''}>فحوصات اليوم</option>
            <option value="week" ${filter === 'week' ? 'selected' : ''}>آخر أسبوع</option>
            <option value="month" ${filter === 'month' ? 'selected' : ''}>آخر شهر</option>
            <option value="year" ${filter === 'year' ? 'selected' : ''}>آخر سنة</option>
            <option value="date" ${filter === 'date' ? 'selected' : ''}>تاريخ محدد</option>
          </select>
        </div>

        <div>
          <label>التاريخ</label>
          <input
            id="caseDate"
            type="date"
            value="${E(selectedDate)}">
        </div>
      </div>

      <p class="msg">
        عدد النتائج المعروضة: <b>${l.length}</b>
      </p>
  `;

  h += l.length
    ? `
      <div class="tw">
        <table>
          <tr>
            <th>رقم الحالة</th>
            <th>المريض</th>
            <th>الفحص</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>وقت الرفع</th>
            <th></th>
          </tr>

          ${l.map((e) => `
            <tr>
              <td>${e.case_no}</td>
              <td>${E(e.patient_name)}</td>
              <td>${E(e.exam_names.join('، '))}</td>
              <td>${pb(e.priority)}</td>
              <td>${trk(e.status)}</td>
              <td>${T(e.created_at)}</td>

              <td>
                ${e.status < 4
                  ? `<button class="alt" data-ed="${e.id}">✏️ تعديل الفحص</button>`
                  : ''
                }

                ${e.status >= 4
                  ? `<button class="alt" data-rp="${e.id}">عرض التقرير</button>`
                  : ''
                }

                ${e.status === 4
                  ? `<button class="alt" data-dl="${e.id}">تم تسليمه للمريض</button>`
                  : ''
                }
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
    : `<p class="empty">لا توجد فحوصات مطابقة للبحث.</p>`;

  h += `</div>`;

  if (o && o.status >= 4) {
    h += `
      <div class="card sheet">
        <h2>تقرير ${E(o.exam_names.join('، '))}</h2>

        <div class="info">
          <div>
            <span>المريض</span>
            <b>${E(o.patient_name)}</b>
          </div>

          <div>
            <span>العمر والجنس</span>
            <b>${o.age} - ${o.sex}</b>
          </div>

          <div>
            <span>رقم الحالة</span>
            <b>${o.case_no}</b>
          </div>

          <div>
            <span>الطبيب المُرسِل</span>
            <b>${E(o.referrer || '-')}</b>
          </div>

          <div>
            <span>المركز</span>
            <b>${E(S.user.name)}</b>
          </div>

          <div>
            <span>تاريخ التقرير</span>
            <b>${T(o.reported_at)}</b>
          </div>
        </div>

        <h3>التقرير</h3>
        <div class="box">${E(o.report)}</div>

        <p class="msg">
          القارئ: ${E(o.doctor_name || '-')}
        </p>

        <p class="np">
          <button class="btn" id="pt">
            طباعة التقرير للمريض
          </button>
        </p>
      </div>
    `;
  }

  return h;
}
function vEditExam() {
  const e = S.list.find((x) => x.id === S.edit);
  if (!e) return '';

  return `
    <div class="card">
      <h2>✏️ تعديل الفحص</h2>

      <div class="g">
        <div class="w">
          <label>اسم المريض الثلاثي أو الرباعي</label>
          <input id="en" value="${E(e.patient_name)}">
        </div>

        <div>
          <label>العمر</label>
          <input id="ea" type="number" min="0" max="120" value="${e.age}">
        </div>

        <div>
          <label>الجنس</label>
          <select id="eg">
            <option ${e.sex === 'ذكر' ? 'selected' : ''}>ذكر</option>
            <option ${e.sex === 'أنثى' ? 'selected' : ''}>أنثى</option>
          </select>
        </div>

        <div>
          <label>الطبيب المُرسِل (اختياري)</label>
          <input id="erf" value="${E(e.referrer || '')}">
        </div>
      </div>

      <h3>نوع التصوير</h3>
      <select id="emd">
        ${TYPES.map((t) =>
          `<option value="${t[0]}" ${e.modality === t[0] ? 'selected' : ''}>
            ${t[1]} · ${t[0]}
          </option>`
        ).join('')}
      </select>

      <h3>المنطقة والفحص</h3>
      <div id="eex">
        <div class="g">
          <div class="w">
            <label>المنطقة</label>
            <select id="erg">
              <option value="">-- اختر المنطقة --</option>
              ${(CATD[e.modality] || []).map((g, i) => {
                const a = g[0].split('|');
                return `<option value="${i}">${E(a[0] + ' · ' + a[1])}</option>`;
              }).join('')}
            </select>
          </div>
        </div>

        <div id="eExamList" style="margin-top:14px">
          <p class="msg">
            الفحص الحالي: <b>${E((e.exam_names || []).join('، '))}</b>
          </p>
        </div>
      </div>

      <h3>نوع الفحص والصبغة</h3>

      <div class="g">
        <div>
          <label>نوع الفحص</label>
          <select id="epr">
            <option value="Normal" ${e.protocol === 'Normal' ? 'selected' : ''}>فحص عادي بدون صبغة</option>
            <option value="Contrast" ${e.protocol === 'Contrast' ? 'selected' : ''}>فحص مع صبغة</option>
            <option value="Oncology" ${e.protocol === 'Oncology' ? 'selected' : ''}>فحص أورام</option>
            <option value="Angiography" ${e.protocol === 'Angiography' ? 'selected' : ''}>فحص Angio</option>
          </select>
        </div>

        <div>
          <label>الصبغة</label>
          <select id="ect" ${e.protocol === 'Normal' ? 'disabled' : ''}>
            ${Object.keys(CONS).map((k) =>
              `<option value="${k}" ${e.contrast === k ? 'selected' : ''}>
                ${CONS[k]}
              </option>`
            ).join('')}
          </select>
        </div>
      </div>

      <h3>المعلومات السريرية</h3>
      <textarea id="ecp">${E(e.clinical_info || '')}</textarea>

      <h3>الأولوية</h3>
      <select id="epi">
        <option value="R" ${e.priority === 'R' ? 'selected' : ''}>عادي</option>
        <option value="U" ${e.priority === 'U' ? 'selected' : ''}>عاجل</option>
        <option value="S" ${e.priority === 'S' ? 'selected' : ''}>طارئ STAT</option>
      </select>

      <div class="msg err" id="eem"></div>

      <p>
        <button class="btn" id="saveEdit" data-id="${e.id}">
          حفظ التعديلات
        </button>

        <button class="alt" id="cancelEdit">
          إلغاء
        </button>
      </p>
    </div>
  `;
}

function vDoctor() {
  const l = S.list;
  const o = l.find((e) => e.id === S.open);

  let h = `<div class="card"><h2>حالات اختصاص ${E(S.user.specialty)}</h2>`;

  h += l.length
    ? `<div class="tw"><table><tr><th>رقم الحالة</th><th>الأولوية</th><th>المريض</th><th>الفحص</th><th>الحالة</th><th></th></tr>${l.map((e) => `<tr><td>${e.case_no}</td><td>${pb(e.priority)}</td><td>${E(e.patient_name)}</td><td>${E(e.exam_names.join('، '))}</td><td>${trk(e.status)}</td><td><button class="alt" data-op="${e.id}">فتح</button></td></tr>`).join('')}</table></div>`
    : '<p class="empty">لا توجد حالات لهذا الاختصاص حالياً.</p>';

  h += '</div>';

  if (!o) return h;

  const prior = o.files.filter((f) => f.kind === 'prior');
  const study = o.files.filter((f) => f.kind === 'study');

  const link = (f) =>
    `<a class="alt" href="/api/files/${f.id}">${E(f.original_name)}</a>`;

  h += `
<div class="card">
<h2>${E(o.patient_name)} ${pb(o.priority)}</h2>

<div class="info">
<div><span>رقم الحالة</span><b>${o.case_no}</b></div>
<div><span>العمر والجنس</span><b>${o.age} - ${o.sex}</b></div>
<div><span>الفحص</span><b>${E(o.exam_names.join('، '))}</b></div>
<div><span>المنطقة</span><b>${E(o.regions.join('، '))}</b></div>
<div><span>الصبغة</span><b>${CONS[o.contrast]}</b></div>
<div><span>نوع الدراسة</span><b>${E(o.protocol)}</b></div>
<div><span>الطبيب المُرسِل</span><b>${E(o.referrer || '-')}</b></div>
<div><span>وقت الرفع</span><b>${T(o.created_at)}</b></div>
<div><span>بدء القراءة</span><b>${T(o.started_at)}</b></div>
</div>

<h3>المشاكل والتاريخ السريري</h3>
<div class="box">${E(o.clinical_info)}</div>

<h3>أوليات المريض وورقة الفحص</h3>

${prior.length
  ? `<div class="th">${prior.map((f) =>
      isImg(f.original_name)
        ? `<a href="/api/files/${f.id}" target="_blank"><img src="/api/files/${f.id}" alt="${E(f.original_name)}"></a>`
        : link(f)
    ).join('')}</div>`
  : '<p class="empty">لا توجد مرفقات.</p>'
}

<div class="view">عارض الصور (قيد التطوير)</div>
<div class="chips">${study.map(link).join('')}</div>`;

  h += o.status >= 4
    ? `<h3>التقرير المعتمد</h3><div class="box">${E(o.report)}</div>`
    : `<h3>التقرير</h3><textarea id="rt"></textarea><div class="msg err" id="rm"></div><button class="alt" id="tp">إدراج قالب</button> <button class="btn" id="sb" data-id="${o.id}">اعتماد ورفع التقرير</button>`;

  return h + '</div>';
}

function vCenterStatement() {
  const s = S.stmt || {
    cases: 0,
    exams: 0,
    by_modality: {},
    no_contrast: 0,
    with_contrast: 0,
    angiography: 0,
    oncology: 0,
    total: 0
  };

  const mods = Object.entries(s.by_modality || {})
    .map(([k, n]) => `<tr><td>${E(k)}</td><td>${n}</td></tr>`)
    .join('');

  return `
    <div class="card">
      <h2>الجرد الشهري</h2>

      <div class="g">
        <div class="w">
          <label>الشهر</label>
          <input type="month" id="cmo" value="${S.month}">
        </div>
      </div>

      <div class="ms">
        <span>عدد الحالات: <b>${s.cases}</b></span>
        <span>عدد الفحوصات: <b>${s.exams}</b></span>
        <span>بدون صبغة: <b>${s.no_contrast}</b></span>
        <span>مع صبغة: <b>${s.with_contrast}</b></span>
        <span>Angio: <b>${s.angiography}</b></span>
        <span>أورام: <b>${s.oncology}</b></span>
      </div>

      <div class="tw">
        <table>
          <tr>
            <th>نوع التصوير</th>
            <th>العدد</th>
          </tr>
          ${mods || '<tr><td colspan="2">لا توجد فحوصات لهذا الشهر</td></tr>'}
        </table>
      </div>

      <h3>
        المبلغ الكلي:
        ${Number(s.total || 0).toLocaleString('ar-IQ')} د.ع
      </h3>

      <button id="pcst">طباعة الجرد</button>
    </div>
  `;
}

function vAdmin() {
  const C = S.centers[S.pc];
  const st = S.stmt;

  const acc = (u, k) =>
    `<li>
      <span>
        ${E(u.name)}
        ${u.specialty ? ' - ' + E(u.specialty) : ''}
        <br>
        <small class="empty">
          ${E(u.email)}
          ${u.active ? '' : ' (معطّل)'}
        </small>
      </span>

      <span>
        <button class="alt" data-pw="${u.id}">
          كلمة مرور جديدة
        </button>

        <button
          class="alt dn"
          data-act="${u.id}"
          data-v="${u.active ? 0 : 1}">
          ${u.active ? 'تعطيل' : 'تفعيل'}
        </button>
      </span>
    </li>`;

  return `
<div class="g">

<div class="card">
<h2>إضافة مركز أو مستشفى</h2>

<label>الاسم</label>
<input id="nc">

<label>البريد الإلكتروني</label>
<input id="ce" type="email">

<label>كلمة المرور (8 أحرف على الأقل)</label>
<input id="cw">

<div class="msg err" id="am1">${E(S.msg)}</div>

<button class="btn" id="ac">إضافة</button>

<ul class="rl">
${S.centers.map(acc).join('')}
</ul>
</div>

<div class="card">
<h2>إضافة طبيب</h2>

<label>الاسم</label>
<input id="nd">

<label>الاختصاص</label>
<select id="ns">${L(SPECS)}</select>

<label>البريد الإلكتروني</label>
<input id="de" type="email">

<label>كلمة المرور (8 أحرف على الأقل)</label>
<input id="dw">

<div class="msg err" id="am2"></div>

<button class="btn" id="ad">إضافة</button>

<ul class="rl">
${S.doctors.map(acc).join('')}
</ul>
</div>

</div>

<div class="card">
<h2>الأسعار (د.ع لكل فحص)</h2>

${C
  ? `<div class="g">
      <div class="w">
        <label>المركز</label>
        <select id="pcs">
          ${O(S.centers.map((c) => c.name), S.pc)}
        </select>
      </div>

      ${TYPES.map((t) =>
        `<div>
          <label>${t[0]} · ${t[1]}</label>
          <input
            type="number"
            min="0"
            data-p="${t[0]}"
            value="${C.prices[t[0]] ?? 0}">
        </div>`
      ).join('')}
    </div>

    <p>
      <button class="btn" id="sp1">
        حفظ أسعار المركز
      </button>
    </p>`
  : '<p class="empty">أضف مركزاً أولاً.</p>'
}

<div class="g">
<div>
<label>إضافة الصبغة (كل المراكز)</label>
<input
  type="number"
  min="0"
  id="cf"
  value="${S.settings.contrast_fee}">
</div>
</div>

<p>
<button class="btn" id="sp2">
حفظ رسوم الصبغة
</button>

<span class="msg" id="pm"></span>
</p>

<p class="msg">
الطبيب لا يرى الأسعار ولا الحسابات.
</p>
</div>

<div class="card">
<h2>الجرد الشهري</h2>

<div class="g">
<div>
<label>الشهر</label>
<input type="month" id="mo" value="${S.month}">
</div>
</div>

<div class="tw">
<table>

<tr>
<th>المركز</th>
<th>الحالات</th>
<th>حسب النوع</th>
<th>بدون صبغة</th>
<th>مع صبغة</th>
<th>Angio</th>
<th>Oncology</th>
<th>المبلغ</th>
</tr>

${st.centers.map((s) =>
  `<tr>
    <td>${E(s.center)}</td>
    <td>${s.cases}</td>
    <td>${Object.keys(s.by_modality).map((k) =>
      k + ': ' + s.by_modality[k]
    ).join(' | ') || '-'}</td>
    <td>${s.no_contrast}</td>
    <td>${s.with_contrast}</td>
    <td>${s.angiography}</td>
    <td>${s.oncology}</td>
    <td>${fmt(s.total)}</td>
  </tr>`
).join('')}

</table>
</div>

<p class="msg">
تُحسب الحالات التي صار تقريرها جاهزاً فقط.
إجمالي المستحقات
</p>

<div class="tot">
${fmt(st.grand_total)}
</div>

<p class="np">
<button class="alt" id="pa">
طباعة كشف الحساب
</button>
</p>

</div>`;
}
function X() {
  const m = v('md');

  if (!m) {
    $('ex').innerHTML =
      '<span class="empty">اختر نوع التصوير أولاً.</span>';
    return;
  }

  $('ex').innerHTML = `
    <div class="g">
      <div class="w">
        <label>المنطقة</label>
        <select id="rg">
          <option value="">-- اختر المنطقة --</option>
          ${CATD[m].map((g, i) => {
            const a = g[0].split('|');
            const label = a[0] + ' · ' + a[1];
            return `<option value="${i}">${E(label)}</option>`;
          }).join('')}
        </select>
      </div>
    </div>

    <div id="examList" style="margin-top:14px">
      <span class="empty">اختر المنطقة لعرض الفحوصات المطلوبة.</span>
    </div>
  `;
}

function R() {
  const u = S.user, role = u && u.role;

  const N = !u
    ? []
    : role === 'center'
      ? [
          ['new', 'إضافة فحص'],
          ['cases', 'فحوصاتي'],
          ['statement', 'الجرد الشهري']
        ]
      : role === 'doctor'
        ? [['cases', 'الحالات']]
        : [['admin', 'الإدارة والجرد']];

  $('hp').textContent = u ? 'مرحباً، ' + u.name : '';

  $('nav').innerHTML =
    N.map(
      (x) =>
        `<button role="tab" aria-selected="${S.tab === x[0]}" data-t="${x[0]}">${x[1]}</button>`
    ).join('') +
    (u ? '<button class="lo" data-lo="1">تسجيل الخروج</button>' : '');

  if (role === 'center' && S.edit) {
    $('app').innerHTML = vEditExam();
    return;
  }

  $('app').innerHTML = !u
    ? vLogin()
    : role === 'admin'
      ? vAdmin()
      : role === 'doctor'
        ? vDoctor()
        : S.tab === 'new'
          ? vNew()
          : S.tab === 'statement'
            ? vCenterStatement()
            : vCases();
}

/* ---------- اختيار الفحوصات ---------- */

function A() {
  // اختيار الفحوصات يبقى يدويًا.
  // نوع الفحص والصبغة يحددهما المستخدم من الحقول المخصصة.
}

function submitExam() {
  const fm = $('fm');
  const m = v('md');
  const q = [
    ...document.querySelectorAll('#ex .chip[aria-pressed=true]')
  ];
  const ff = $('ff').files;

  if (v('n').split(/\s+/).filter(Boolean).length < 3) {
    fm.textContent = 'اكتب اسم المريض الثلاثي على الأقل.';
    return;
  }

  if (!v('a') || !v('cp') || !m || !q.length || !ff.length) {
    fm.textContent =
      'أكمل العمر والمشاكل، واختر نوع التصوير والفحص، وأرفق صور الفحص.';
    return;
  }

  fm.textContent = '';

  const fd = new FormData();

  Object.entries({
    patient_name: v('n'),
    age: v('a'),
    sex: v('g'),
    referrer: v('rf'),
    modality: m,
    regions: JSON.stringify([
      ...new Set(q.map((x) => x.dataset.g))
    ]),
    exam_names: JSON.stringify(q.map((x) => x.dataset.v)),
    contrast: v('ct'),
    protocol: v('pr'),
    priority: pr('pi')[0],
    clinical_info: v('cp')
  }).forEach(([k, val]) => fd.append(k, val));

  [...ff].forEach((f) => fd.append('study', f));
  [...$('hf').files].forEach((f) => fd.append('prior', f));

  $('up').disabled = true;
  $('pg').hidden = false;

  const x = new XMLHttpRequest();
  x.open('POST', '/api/exams');

  x.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      $('pg').value = (e.loaded / e.total) * 100;

      $('fc').textContent =
        `جارٍ الرفع ${Math.round((e.loaded / e.total) * 100)}% ` +
        `(${(e.loaded / 1048576).toFixed(1)} من ${(e.total / 1048576).toFixed(1)} MB)`;
    }
  };

  x.onerror = () => {
    fm.textContent = 'تعذر الاتصال بالخادم.';
    $('up').disabled = false;
  };

  x.onload = async () => {
    let j = {};

    try {
      j = JSON.parse(x.responseText);
    } catch (e) {
      /* ignore */
    }

    if (x.status !== 201) {
      fm.textContent = j.error || 'فشل الرفع';
      $('up').disabled = false;
      return;
    }

    S.tab = 'cases';
    S.msg = `تم الإرسال برقم الحالة ${j.case_no}.`;

    await load();
    R();
  };

  x.send(fd);
}

/* ---------- الأحداث ---------- */

async function act(fn) {
  try {
    await fn();
  } catch (e) {
    if (e.status === 401 && S.user) {
      S.user = null;
      S.msg = 'انتهت الجلسة، سجّل الدخول من جديد.';
      R();
      return;
    }

    const t = $('rm') || $('am1') || $('lm') || $('fm');

    if (t) {
      t.textContent = e.message;
    } else {
      alert(e.message);
    }
  }
}

const home = () =>
  S.user.role === 'center'
    ? 'new'
    : S.user.role === 'doctor'
      ? 'cases'
      : 'admin';

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button');

  if (!b) return;

  const D = b.dataset;

  if (b.classList.contains('chip') && D.lr === undefined) {
    const gp = b.parentNode;

    if (gp.dataset.s) {
      [...gp.children].forEach((x) =>
        x.setAttribute('aria-pressed', 'false')
      );

      b.setAttribute('aria-pressed', 'true');
    } else {
      b.setAttribute(
        'aria-pressed',
        b.getAttribute('aria-pressed') === 'true'
          ? 'false'
          : 'true'
      );
    }

    if (b.closest('#ex')) A();

    return;
  }

  act(async () => {
    if (D.lr !== undefined) {
      S.lr = D.lr;
      S.msg = '';
      R();
    }

    else if (b.id === 'li') {
      const r = await send('POST', '/auth/login', {
        email: v('em'),
        password: $('pw').value,
        portal: PORTAL[S.lr]
      });

      S.user = r.user;
      S.tab = home();
      S.msg = '';
      S.open = null;

      await load();
      R();
    }

    else if (D.lo) {
      await send('POST', '/auth/logout');

      S.user = null;
      S.lr = '';
      S.tab = '';
      S.open = null;
      S.msg = '';

      R();
    }

    else if (D.t) {
      S.tab = D.t;
      S.open = null;
      S.msg = '';

      if (D.t === 'cases' || D.t === 'statement') {
        await load();
      }

      R();
    }

    else if (D.ed) {
      S.open = +D.ed;
      S.edit = +D.ed;
      R();
    }

    else if (D.rp) {
      S.open = S.open === +D.rp ? null : +D.rp;
      R();
    }

    else if (D.dl) {
      await send('POST', `/exams/${D.dl}/deliver`);
      await load();
      R();
    }

    else if (b.id === 'pt') {
      document.body.classList.add('pr');
      window.print();
      document.body.classList.remove('pr');
    }

    else if (b.id === 'pa') {
      window.print();
    }

    else if (b.id === 'pcst') {
      window.print();
    }

    else if (D.op) {
      const r = await send(
        'POST',
        `/doctor/cases/${D.op}/open`
      );

      S.list = S.list.map((e) =>
        e.id === r.id ? r : e
      );

      S.open = r.id;
      R();
    }

    else if (b.id === 'tp') {
      if (!$('rt').value) {
        $('rt').value =
          'الفحص:\nالمقارنة:\nالموجودات:\n\nالانطباع:\n';
      }
    }

    else if (b.id === 'sb') {
      if (!v('rt')) {
        $('rm').textContent =
          'اكتب التقرير قبل الرفع.';
        return;
      }

      await send(
        'POST',
        `/doctor/cases/${D.id}/report`,
        { report: v('rt') }
      );

      await load();
      R();
    }

    else if (b.id === 'up') {
      submitExam();
    }

    else if (b.id === 'cancelEdit') {
      S.edit = null;
      S.open = null;
      R();
    }
        else if (b.id === 'saveEdit') {
      const e = S.list.find((x) => x.id === S.edit);

      const q = [
        ...document.querySelectorAll(
          '#eExamList .chip[aria-pressed=true]'
        )
      ];

      const regions = [
        ...new Set(q.map((x) => x.dataset.g))
      ];

      const exams = q.map((x) => x.dataset.v);

      if (
        v('en')
          .trim()
          .split(/\s+/)
          .filter(Boolean).length < 3
      ) {
        $('eem').textContent =
          'اكتب اسم المريض الثلاثي على الأقل';
        return;
      }

      const data = {
        patient_name: v('en'),
        age: Number(v('ea')),
        sex: v('eg'),
        referrer: v('erf'),
        modality: v('emd'),
        regions: regions.length
          ? regions
          : (e.regions || []),
        exam_names: exams.length
          ? exams
          : (e.exam_names || []),
        protocol: v('epr'),
        contrast:
          v('epr') === 'Normal'
            ? 'N'
            : v('ect'),
        priority: v('epi'),
        clinical_info: v('ecp')
      };

      await send(
        'PUT',
        `/exams/${S.edit}`,
        data
      );

      S.edit = null;
      S.open = null;
      S.msg = 'تم تعديل الفحص بنجاح';

      await load();
      R();
    }

    else if (b.id === 'ac') {
      S.msg = '';

      await send('POST', '/admin/centers', {
        name: v('nc'),
        email: v('ce'),
        password: $('cw').value
      });

      await load();
      R();
    }

    else if (b.id === 'ad') {
      await send('POST', '/admin/doctors', {
        name: v('nd'),
        email: v('de'),
        password: $('dw').value,
        specialty: v('ns')
      });

      await load();
      R();
    }

    else if (D.act) {
      await send(
        'PATCH',
        `/admin/users/${D.act}`,
        { active: D.v === '1' }
      );

      await load();
      R();
    }

    else if (D.pw) {
      const p = prompt(
        'كلمة المرور الجديدة (8 أحرف على الأقل):'
      );

      if (p) {
        await send(
          'PATCH',
          `/admin/users/${D.pw}`,
          { password: p }
        );

        alert('تم تغيير كلمة المرور');
      }
    }

    else if (b.id === 'sp1') {
      const o = {};

      document
        .querySelectorAll('[data-p]')
        .forEach((i) => {
          o[i.dataset.p] =
            parseInt(i.value, 10) || 0;
        });

      await send(
        'PUT',
        `/admin/centers/${S.centers[S.pc].id}/prices`,
        o
      );

      await load();
      R();

      $('pm').textContent = 'تم الحفظ';
    }

    else if (b.id === 'sp2') {
      await send(
        'PUT',
        '/admin/settings',
        {
          contrast_fee:
            parseInt($('cf').value, 10) || 0
        }
      );

      await load();
      R();

      $('pm').textContent = 'تم الحفظ';
    }
  });
});

document.addEventListener('change', (ev) => {
  const t = ev.target;

  if (t.id === 'caseFilter') {
    const newFilter = t.value;

    S.caseFilter = newFilter;

    if (newFilter !== 'date') {
      S.caseDate = '';
    }

    R();
    return;
  }

  if (t.id === 'caseDate') {
    S.caseDate = t.value;
    S.caseFilter = 'date';
    R();
    return;
  }

  if (t.id === 'emd') {
    const box = $('eex');

    box.innerHTML = `
      <div class="g">
        <div class="w">
          <label>المنطقة</label>

          <select id="erg">
            <option value="">
              -- اختر المنطقة --
            </option>

            ${(CATD[t.value] || [])
              .map((g, i) => {
                const a = g[0].split('|');

                return `
                  <option value="${i}">
                    ${E(a[0] + ' · ' + a[1])}
                  </option>
                `;
              })
              .join('')}
          </select>
        </div>
      </div>

      <div
        id="eExamList"
        style="margin-top:14px">

        <p class="msg">
          اختر المنطقة لعرض الفحوصات.
        </p>
      </div>
    `;

    return;
  }

  if (t.id === 'erg') {
    const modality = v('emd');

    const group =
      (CATD[modality] || [])[Number(t.value)];

    const box = $('eExamList');

    if (!group) {
      box.innerHTML = '';
      return;
    }

    const region = group[0];
    const exams = group[1].split(';');

    box.innerHTML = `
      <div class="chips">
        ${exams
          .map(
            (x) => `
              <button
                type="button"
                class="chip"
                aria-pressed="false"
                data-g="${E(region)}"
                data-v="${E(x)}">
                ${E(x)}
              </button>
            `
          )
          .join('')}
      </div>
    `;

    return;
  }

  if (t.id === 'md') {
    X();
    return;
  }

  if (t.id === 'epr') {
    const ct = $('ect');

    if (t.value === 'Normal') {
      ct.value = 'N';
      ct.disabled = true;
    } else {
      ct.disabled = false;

      if (ct.value === 'N') {
        ct.value = 'IV';
      }
    }

    return;
  }

  if (t.id === 'pr') {
    const ct = $('ct');

    if (t.value === 'Normal') {
      ct.value = 'N';
      ct.disabled = true;
    } else {
      ct.disabled = false;

      if (ct.value === 'N') {
        ct.value = 'IV';
      }
    }

    return;
  }

  if (t.id === 'rg') {
    const m = v('md');
    const i = Number(t.value);

    if (
      t.value === '' ||
      !CATD[m] ||
      !CATD[m][i]
    ) {
      $('examList').innerHTML =
        '<span class="empty">اختر المنطقة لعرض الفحوصات المطلوبة.</span>';

      return;
    }

    const g = CATD[m][i];
    const a = g[0].split('|');

    const region =
      a[0] + ' · ' + a[1];

    $('examList').innerHTML = `
      <label>
        الفحوصات المطلوبة
      </label>

      <div
        class="chips"
        id="examChoices">

        ${g[1]
          .split(';')
          .map(
            (n) => `
              <button
                type="button"
                class="chip"
                data-v="${E(n)}"
                data-g="${E(region)}"
                aria-pressed="false">
                ${E(n)}
              </button>
            `
          )
          .join('')}
      </div>

      <p class="msg">
        يمكن اختيار أكثر من فحص.
      </p>
    `;

    return;
  }

  if (t.id === 'pcs') {
    S.pc = +t.value;
    R();
  }

  else if (
    t.id === 'mo' &&
    t.value
  ) {
    act(async () => {
      S.month = t.value;

      S.stmt = await send(
        'GET',
        '/admin/statement?month=' +
          S.month
      );

      R();
    });
  }

  else if (
    t.id === 'cmo' &&
    t.value
  ) {
    act(async () => {
      S.month = t.value;

      S.stmt = await send(
        'GET',
        '/exams/statement?month=' +
          S.month
      );

      R();
    });
  }

  else if (t.id === 'ff') {
    let z = 0;

    [...t.files].forEach((x) => {
      z += x.size;
    });

    $('fc').textContent =
      `${t.files.length} ملف ` +
      `(${(z / 1048576).toFixed(1)} MB تقريباً)`;
  }
});

document.addEventListener('input', (ev) => {
  if (ev.target.id === 'caseSearch') {
    S.caseSearch = ev.target.value;

    const pos =
      ev.target.selectionStart;

    R();

    const input = $('caseSearch');

    if (input) {
      input.focus();
      input.setSelectionRange(pos, pos);
    }
  }
});

/* ---------- البدء: استرجاع الجلسة إن وُجدت ---------- */

(async () => {
  try {
    S.user =
      (await send('GET', '/auth/me')).user;

    S.tab = home();

    await load();
  } catch (e) {
    S.user = null;
  }

  R();
})();
