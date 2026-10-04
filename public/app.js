// الواجهة الأمامية: تتصل بالخادم عبر /api
const PORTAL = { c: 'center', d: 'doctor', a: 'admin' };
const $ = (id) => document.getElementById(id);
const E = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const L = (a) => a.map((x) => `<option>${E(x)}</option>`).join('');
const O = (a, s) => a.map((x, i) => `<option value="${i}"${i == s ? ' selected' : ''}>${E(x)}</option>`).join('');
const parse = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z') : null);
const T = (s) => { const d = parse(s); return d ? d.toLocaleString('ar-IQ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'; };
const fmt = (n) => Number(n || 0).toLocaleString('ar-IQ') + ' د.ع';
const pb = (p) => `<span class="pb ${p}">${PRI[p]}</span>`;
const v = (id) => $(id).value.trim();
const pr = (id) => [...document.querySelectorAll(`#${id} .chip[aria-pressed=true]`)].map((x) => x.dataset.v);
const isImg = (n) => /\.(jpe?g|png|gif|webp)$/i.test(n);
const trk = (s) => `<span class="trk${s > 3 ? ' k' : ''}">${[1, 2, 3, 4, 5].map((i) => `<i${i <= s ? ' class="on"' : ''}></i>`).join('')}</span>${SN[s]}`;

const S = { user: null, lr: '', tab: '', open: null, msg: '', list: [], centers: [], doctors: [], settings: { contrast_fee: 0 }, stmt: null, month: new Date().toISOString().slice(0, 7), pc: 0 };

async function send(method, path, body) {
  const r = await fetch('/api' + path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) { /* no body */ }
  if (!r.ok) { const e = new Error(j.error || 'حدث خطأ'); e.status = r.status; throw e; }
  return j;
}

async function load() {
  const u = S.user.role;
  if (u === 'center') S.list = await send('GET', '/exams');
  else if (u === 'doctor') S.list = await send('GET', '/doctor/cases');
  else {
    [S.centers, S.doctors, S.settings, S.stmt] = await Promise.all([send('GET', '/admin/centers'), send('GET', '/admin/doctors'), send('GET', '/admin/settings'), send('GET', '/admin/statement?month=' + S.month)]);
    if (S.pc >= S.centers.length) S.pc = 0;
  }
}

/* ---------- الواجهات ---------- */
function vLogin() {
  if (!S.lr) return '<div class="card hero"><h2>مرحباً بك في المنصة</h2><p class="msg">اختر نوع الحساب للدخول.</p><div class="chips"><button class="chip big" data-lr="c">دخول المراكز والمستشفيات</button><button class="chip big" data-lr="d">دخول الأطباء</button><button class="chip big" data-lr="a">دخول الإدارة</button></div></div>';
  const N = { c: 'المراكز والمستشفيات', d: 'الأطباء', a: 'الإدارة' }[S.lr];
  return `<div class="card hero"><h2>دخول ${N}</h2><label>البريد الإلكتروني</label><input id="em" type="email" autocomplete="username"><label style="margin-top:12px">كلمة المرور</label><input id="pw" type="password" autocomplete="current-password"><div class="msg err" id="lm">${E(S.msg)}</div><button class="btn" id="li">دخول</button> <button class="alt" data-lr="">رجوع</button></div>`;
}

function vNew() {
  return `<div class="card"><h2>إضافة فحص جديد</h2>
<h3><b>1</b>بيانات المريض</h3><div class="g"><div class="w"><label>الاسم الرباعي</label><input id="n" autocomplete="off"></div><div><label>العمر</label><input id="a" type="number" min="0" max="120"></div><div><label>الجنس</label><select id="g"><option>ذكر</option><option>أنثى</option></select></div><div><label>الطبيب المُرسِل</label><input id="rf"></div></div>
<h3><b>2</b>نوع التصوير</h3><div class="chips" id="md" data-s="1">${TYPES.map((t) => `<button type="button" class="chip big" data-v="${t[0]}" aria-pressed="false">${t[1]} · ${t[0]}</button>`).join('')}</div>
<h3><b>3</b>المنطقة والفحص المطلوب</h3><div id="ex"><span class="empty">اختر نوع التصوير أولاً، ثم اختر الفحوصات المطلوبة (يمكن اختيار أكثر من فحص).</span></div>
<h3><b>4</b>الصبغة والبروتوكول</h3><div class="g"><div><label>الصبغة</label><select id="ct">${Object.keys(CONS).map((k) => `<option value="${k}">${CONS[k]}</option>`).join('')}</select></div><div><label>نوع الدراسة</label><select id="pr">${L(PROTO)}</select></div><div><label>اختصاص الطبيب القارئ</label><select id="sp">${L(SPECS)}</select></div></div>
<h3><b>5</b>المعلومات السريرية والأولوية</h3><div class="g"><div class="w"><label>المشاكل والأعراض والتاريخ السريري</label><textarea id="cp"></textarea></div><div class="w"><label>إرفاق أوليات المريض أو ورقة الفحص (صور أو PDF)</label><input type="file" id="hf" multiple accept="image/*,.pdf"></div></div>
<div class="chips" id="pi" data-s="1" style="margin-top:12px"><button type="button" class="chip big" data-v="R" aria-pressed="true">عادي</button><button type="button" class="chip big" data-v="U" aria-pressed="false">عاجل</button><button type="button" class="chip big stat" data-v="S" aria-pressed="false">طارئ STAT</button></div>
<h3><b>6</b>رفع صور الفحص</h3><input type="file" id="ff" multiple><div class="msg" id="fc">DICOM أو PDF أو JPG، ويمكن رفع أكثر من ملف.</div><progress class="bar" id="pg" value="0" max="100" hidden></progress>
<div class="msg err" id="fm"></div><button class="btn" id="up">إرسال للطبيب</button></div>`;
}

function vCases() {
  const l = S.list, td = new Date().toDateString(), o = l.find((e) => e.id === S.open);
  const c = [['حالات اليوم', l.filter((e) => parse(e.created_at).toDateString() === td).length], ['بانتظار التقرير', l.filter((e) => e.status < 4).length], ['تقارير مكتملة', l.filter((e) => e.status >= 4).length]];
  let h = `<div class="dash">${c.map((x) => `<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>${S.msg ? `<div class="msg">${E(S.msg)}</div>` : ''}<div class="card"><h2>الفحوصات المرفوعة</h2>`;
  h += l.length ? `<div class="tw"><table><tr><th>رقم الحالة</th><th>المريض</th><th>الفحص</th><th>الأولوية</th><th>الحالة</th><th>وقت الرفع</th><th></th></tr>${l.map((e) => `<tr><td>${e.case_no}</td><td>${E(e.patient_name)}</td><td>${E(e.exam_names.join('، '))}</td><td>${pb(e.priority)}</td><td>${trk(e.status)}</td><td>${T(e.created_at)}</td><td>${e.status >= 4 ? `<button class="alt" data-rp="${e.id}">عرض التقرير</button> ` : ''}${e.status === 4 ? `<button class="alt" data-dl="${e.id}">تم تسليمه للمريض</button>` : ''}</td></tr>`).join('')}</table></div>` : '<p class="empty">لا توجد فحوصات بعد.</p>';
  h += '</div>';
  if (o && o.status >= 4) h += `<div class="card sheet"><h2>تقرير ${E(o.exam_names.join('، '))}</h2><div class="info"><div><span>المريض</span><b>${E(o.patient_name)}</b></div><div><span>العمر والجنس</span><b>${o.age} - ${o.sex}</b></div><div><span>رقم الحالة</span><b>${o.case_no}</b></div><div><span>الطبيب المُرسِل</span><b>${E(o.referrer || '-')}</b></div><div><span>المركز</span><b>${E(S.user.name)}</b></div><div><span>تاريخ التقرير</span><b>${T(o.reported_at)}</b></div></div><h3>التقرير</h3><div class="box">${E(o.report)}</div><p class="msg">القارئ: ${E(o.doctor_name || '-')}</p><p class="np"><button class="btn" id="pt">طباعة التقرير للمريض</button></p></div>`;
  return h;
}

function vDoctor() {
  const l = S.list, o = l.find((e) => e.id === S.open);
  let h = `<div class="card"><h2>حالات اختصاص ${E(S.user.specialty)}</h2>`;
  h += l.length ? `<div class="tw"><table><tr><th>رقم الحالة</th><th>الأولوية</th><th>المريض</th><th>الفحص</th><th>الحالة</th><th></th></tr>${l.map((e) => `<tr><td>${e.case_no}</td><td>${pb(e.priority)}</td><td>${E(e.patient_name)}</td><td>${E(e.exam_names.join('، '))}</td><td>${trk(e.status)}</td><td><button class="alt" data-op="${e.id}">فتح</button></td></tr>`).join('')}</table></div>` : '<p class="empty">لا توجد حالات لهذا الاختصاص حالياً.</p>';
  h += '</div>';
  if (!o) return h;
  const prior = o.files.filter((f) => f.kind === 'prior'), study = o.files.filter((f) => f.kind === 'study');
  const link = (f) => `<a class="alt" href="/api/files/${f.id}">${E(f.original_name)}</a>`;
  h += `<div class="card"><h2>${E(o.patient_name)} ${pb(o.priority)}</h2><div class="info"><div><span>رقم الحالة</span><b>${o.case_no}</b></div><div><span>العمر والجنس</span><b>${o.age} - ${o.sex}</b></div><div><span>الفحص</span><b>${E(o.exam_names.join('، '))}</b></div><div><span>المنطقة</span><b>${E(o.regions.join('، '))}</b></div><div><span>الصبغة</span><b>${CONS[o.contrast]}</b></div><div><span>نوع الدراسة</span><b>${E(o.protocol)}</b></div><div><span>الطبيب المُرسِل</span><b>${E(o.referrer || '-')}</b></div><div><span>وقت الرفع</span><b>${T(o.created_at)}</b></div><div><span>بدء القراءة</span><b>${T(o.started_at)}</b></div></div>
<h3>المشاكل والتاريخ السريري</h3><div class="box">${E(o.clinical_info)}</div>
<h3>أوليات المريض وورقة الفحص</h3>${prior.length ? `<div class="th">${prior.map((f) => (isImg(f.original_name) ? `<a href="/api/files/${f.id}" target="_blank"><img src="/api/files/${f.id}" alt="${E(f.original_name)}"></a>` : link(f))).join('')}</div>` : '<p class="empty">لا توجد مرفقات.</p>'}
<div class="view">عارض الصور (قيد التطوير)</div><div class="chips">${study.map(link).join('')}</div>`;
  h += o.status >= 4 ? `<h3>التقرير المعتمد</h3><div class="box">${E(o.report)}</div>` : `<h3>التقرير</h3><textarea id="rt"></textarea><div class="msg err" id="rm"></div><button class="alt" id="tp">إدراج قالب</button> <button class="btn" id="sb" data-id="${o.id}">اعتماد ورفع التقرير</button>`;
  return h + '</div>';
}

function vAdmin() {
  const C = S.centers[S.pc], st = S.stmt;
  const acc = (u, k) => `<li><span>${E(u.name)}${u.specialty ? ' - ' + E(u.specialty) : ''}<br><small class="empty">${E(u.email)}${u.active ? '' : ' (معطّل)'}</small></span><span><button class="alt" data-pw="${u.id}">كلمة مرور جديدة</button> <button class="alt dn" data-act="${u.id}" data-v="${u.active ? 0 : 1}">${u.active ? 'تعطيل' : 'تفعيل'}</button></span></li>`;
  return `<div class="g"><div class="card"><h2>إضافة مركز أو مستشفى</h2><label>الاسم</label><input id="nc"><label>البريد الإلكتروني</label><input id="ce" type="email"><label>كلمة المرور (8 أحرف على الأقل)</label><input id="cw"><div class="msg err" id="am1">${E(S.msg)}</div><button class="btn" id="ac">إضافة</button><ul class="rl">${S.centers.map(acc).join('')}</ul></div>
<div class="card"><h2>إضافة طبيب</h2><label>الاسم</label><input id="nd"><label>الاختصاص</label><select id="ns">${L(SPECS)}</select><label>البريد الإلكتروني</label><input id="de" type="email"><label>كلمة المرور (8 أحرف على الأقل)</label><input id="dw"><div class="msg err" id="am2"></div><button class="btn" id="ad">إضافة</button><ul class="rl">${S.doctors.map(acc).join('')}</ul></div></div>
<div class="card"><h2>الأسعار (د.ع لكل فحص)</h2>${C ? `<div class="g"><div class="w"><label>المركز</label><select id="pcs">${O(S.centers.map((c) => c.name), S.pc)}</select></div>${TYPES.map((t) => `<div><label>${t[0]} · ${t[1]}</label><input type="number" min="0" data-p="${t[0]}" value="${C.prices[t[0]] ?? 0}"></div>`).join('')}</div><p><button class="btn" id="sp1">حفظ أسعار المركز</button></p>` : '<p class="empty">أضف مركزاً أولاً.</p>'}
<div class="g"><div><label>إضافة الصبغة (كل المراكز)</label><input type="number" min="0" id="cf" value="${S.settings.contrast_fee}"></div></div><p><button class="btn" id="sp2">حفظ رسوم الصبغة</button> <span class="msg" id="pm"></span></p><p class="msg">الطبيب لا يرى الأسعار ولا الحسابات.</p></div>
<div class="card"><h2>الجرد الشهري</h2><div class="g"><div><label>الشهر</label><input type="month" id="mo" value="${S.month}"></div></div><div class="tw"><table><tr><th>المركز</th><th>الحالات</th><th>حسب النوع</th><th>بدون صبغة</th><th>مع صبغة</th><th>Angio</th><th>Oncology</th><th>المبلغ</th></tr>${st.centers.map((s) => `<tr><td>${E(s.center)}</td><td>${s.cases}</td><td>${Object.keys(s.by_modality).map((k) => k + ': ' + s.by_modality[k]).join(' | ') || '-'}</td><td>${s.no_contrast}</td><td>${s.with_contrast}</td><td>${s.angiography}</td><td>${s.oncology}</td><td>${fmt(s.total)}</td></tr>`).join('')}</table></div><p class="msg">تُحسب الحالات التي صار تقريرها جاهزاً فقط. إجمالي المستحقات</p><div class="tot">${fmt(st.grand_total)}</div><p class="np"><button class="alt" id="pa">طباعة كشف الحساب</button></p></div>`;
}

function R() {
  const u = S.user, role = u && u.role;
  const N = !u ? [] : role === 'center' ? [['new', 'إضافة فحص'], ['cases', 'فحوصاتي']] : role === 'doctor' ? [['cases', 'الحالات']] : [['admin', 'الإدارة والجرد']];
  $('hp').textContent = u ? 'مرحباً، ' + u.name : '';
  $('nav').innerHTML = N.map((x) => `<button role="tab" aria-selected="${S.tab === x[0]}" data-t="${x[0]}">${x[1]}</button>`).join('') + (u ? '<button class="lo" data-lo="1">تسجيل الخروج</button>' : '');
  $('app').innerHTML = !u ? vLogin() : role === 'admin' ? vAdmin() : role === 'doctor' ? vDoctor() : S.tab === 'new' ? vNew() : vCases();
}

/* ---------- اختيار الفحوصات ---------- */
function X() {
  const m = pr('md')[0], old = pr('ex');
  if (!m) return;
  $('ex').innerHTML = CATD[m].map((g) => { const a = g[0].split('|'), l = a[0] + ' · ' + a[1]; return `<div class="gl">${E(l)}</div><div class="chips">${g[1].split(';').map((n) => `<button type="button" class="chip" data-v="${E(n)}" data-g="${E(l)}" aria-pressed="${old.includes(n)}">${E(n)}</button>`).join('')}</div>`; }).join('');
}
function A() {
  const q = [...document.querySelectorAll('#ex .chip[aria-pressed=true]')], s = q.map((x) => x.dataset.v).join(' ');
  if (/Contrast|CTA|CTPA|Urography|Triphasic|Perfusion|MRA|MRV|Enterography|Staging/.test(s)) $('ct').value = 'IV';
  if (/CTA|CTPA|MRA|MRV/.test(s)) $('pr').value = 'Angiography';
  if (q.some((x) => x.dataset.g.includes('Oncology'))) { $('pr').value = 'Oncology/Staging'; $('sp').value = 'أورام'; }
}

function submitExam() {
  const fm = $('fm'), m = pr('md')[0], q = [...document.querySelectorAll('#ex .chip[aria-pressed=true]')], ff = $('ff').files;
  if (v('n').split(/\s+/).length < 4) { fm.textContent = 'اكتب اسم المريض الرباعي.'; return; }
  if (!v('a') || !v('cp') || !m || !q.length || !ff.length) { fm.textContent = 'أكمل العمر والمشاكل، واختر نوع التصوير والفحص، وأرفق صور الفحص.'; return; }
  fm.textContent = '';
  const fd = new FormData();
  Object.entries({ patient_name: v('n'), age: v('a'), sex: v('g'), referrer: v('rf'), modality: m, regions: JSON.stringify([...new Set(q.map((x) => x.dataset.g))]), exam_names: JSON.stringify(q.map((x) => x.dataset.v)), contrast: v('ct'), protocol: v('pr'), specialty: v('sp'), priority: pr('pi')[0], clinical_info: v('cp') }).forEach(([k, val]) => fd.append(k, val));
  [...ff].forEach((f) => fd.append('study', f));
  [...$('hf').files].forEach((f) => fd.append('prior', f));
  $('up').disabled = true; $('pg').hidden = false;
  const x = new XMLHttpRequest();
  x.open('POST', '/api/exams');
  x.upload.onprogress = (e) => { if (e.lengthComputable) { $('pg').value = (e.loaded / e.total) * 100; $('fc').textContent = `جارٍ الرفع ${Math.round((e.loaded / e.total) * 100)}% (${(e.loaded / 1048576).toFixed(1)} من ${(e.total / 1048576).toFixed(1)} MB)`; } };
  x.onerror = () => { fm.textContent = 'تعذر الاتصال بالخادم.'; $('up').disabled = false; };
  x.onload = async () => {
    let j = {}; try { j = JSON.parse(x.responseText); } catch (e) { /* ignore */ }
    if (x.status !== 201) { fm.textContent = j.error || 'فشل الرفع'; $('up').disabled = false; return; }
    S.tab = 'cases'; S.msg = `تم الإرسال برقم الحالة ${j.case_no}.`;
    await load(); R();
  };
  x.send(fd);
}

/* ---------- الأحداث ---------- */
async function act(fn) {
  try { await fn(); } catch (e) {
    if (e.status === 401 && S.user) { S.user = null; S.msg = 'انتهت الجلسة، سجّل الدخول من جديد.'; R(); return; }
    const t = $('rm') || $('am1') || $('lm') || $('fm'); if (t) t.textContent = e.message; else alert(e.message);
  }
}
const home = () => (S.user.role === 'center' ? 'new' : S.user.role === 'doctor' ? 'cases' : 'admin');

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button'); if (!b) return; const D = b.dataset;
  if (b.classList.contains('chip') && D.lr === undefined) {
    const gp = b.parentNode;
    if (gp.dataset.s) { [...gp.children].forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); } else b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    if (gp.id === 'md') X(); if (b.closest('#ex')) A(); return;
  }
  act(async () => {
    if (D.lr !== undefined) { S.lr = D.lr; S.msg = ''; R(); }
    else if (b.id === 'li') { const r = await send('POST', '/auth/login', { email: v('em'), password: $('pw').value, portal: PORTAL[S.lr] }); S.user = r.user; S.tab = home(); S.msg = ''; S.open = null; await load(); R(); }
    else if (D.lo) { await send('POST', '/auth/logout'); S.user = null; S.lr = ''; S.tab = ''; S.open = null; S.msg = ''; R(); }
    else if (D.t) { S.tab = D.t; S.open = null; S.msg = ''; if (D.t === 'cases') await load(); R(); }
    else if (D.rp) { S.open = S.open === +D.rp ? null : +D.rp; R(); }
    else if (D.dl) { await send('POST', `/exams/${D.dl}/deliver`); await load(); R(); }
    else if (b.id === 'pt') { document.body.classList.add('pr'); window.print(); document.body.classList.remove('pr'); }
    else if (b.id === 'pa') window.print();
    else if (D.op) { const r = await send('POST', `/doctor/cases/${D.op}/open`); S.list = S.list.map((e) => (e.id === r.id ? r : e)); S.open = r.id; R(); }
    else if (b.id === 'tp') { if (!$('rt').value) $('rt').value = 'الفحص:\nالمقارنة:\nالموجودات:\n\nالانطباع:\n'; }
    else if (b.id === 'sb') { if (!v('rt')) { $('rm').textContent = 'اكتب التقرير قبل الرفع.'; return; } await send('POST', `/doctor/cases/${D.id}/report`, { report: v('rt') }); await load(); R(); }
    else if (b.id === 'up') submitExam();
    else if (b.id === 'ac') { S.msg = ''; await send('POST', '/admin/centers', { name: v('nc'), email: v('ce'), password: $('cw').value }); await load(); R(); }
    else if (b.id === 'ad') { await send('POST', '/admin/doctors', { name: v('nd'), email: v('de'), password: $('dw').value, specialty: v('ns') }); await load(); R(); }
    else if (D.act) { await send('PATCH', `/admin/users/${D.act}`, { active: D.v === '1' }); await load(); R(); }
    else if (D.pw) { const p = prompt('كلمة المرور الجديدة (8 أحرف على الأقل):'); if (p) { await send('PATCH', `/admin/users/${D.pw}`, { password: p }); alert('تم تغيير كلمة المرور'); } }
    else if (b.id === 'sp1') { const o = {}; document.querySelectorAll('[data-p]').forEach((i) => { o[i.dataset.p] = parseInt(i.value, 10) || 0; }); await send('PUT', `/admin/centers/${S.centers[S.pc].id}/prices`, o); await load(); R(); $('pm').textContent = 'تم الحفظ'; }
    else if (b.id === 'sp2') { await send('PUT', '/admin/settings', { contrast_fee: parseInt($('cf').value, 10) || 0 }); await load(); R(); $('pm').textContent = 'تم الحفظ'; }
  });
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'pcs') { S.pc = +t.value; R(); }
  else if (t.id === 'mo' && t.value) act(async () => { S.month = t.value; S.stmt = await send('GET', '/admin/statement?month=' + S.month); R(); });
  else if (t.id === 'ff') { let z = 0; [...t.files].forEach((x) => { z += x.size; }); $('fc').textContent = `${t.files.length} ملف، ${(z / 1048576).toFixed(1)} MB جاهزة للرفع`; }
});

/* ---------- البدء: استرجاع الجلسة إن وُجدت ---------- */
(async () => {
  try { S.user = (await send('GET', '/auth/me')).user; S.tab = home(); await load(); } catch (e) { S.user = null; }
  R();
})();
