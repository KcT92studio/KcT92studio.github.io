function openApp() {
  document.getElementById('appSection').classList.add('open');
  document.body.style.overflow = 'hidden';
  window.scrollTo(0, 0);
}
function closeApp() {
  document.getElementById('appSection').classList.remove('open');
  document.body.style.overflow = '';
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx10wFqFdxjoF0ytC8OpaeCI4cFx_viL0BGzwrUeP8F_9HOaOWtMC-AuIdb4geNxNS7Ww/exec';
const GOOGLE_CLIENT_ID = '842445966044-uqi522iqaqmfbc2jg4ks9k9gj9dhj3rp.apps.googleusercontent.com';

let students = [];
let currentTab = 'search';
let sheetConfig = { rosterSheetId: '', scoreSheetsByRoom: {} };
let settingsConfig = { approvedEmail: '', autoRefreshEnabled: false, autoRefreshInterval: 30 };
let tempScoreSheets = [];
let currentAccess = null;
let currentUser = null;
let currentIdToken = null; // raw Google ID token (JWT) — sent with every privileged request so Apps Script can verify identity itself
let pollingInterval = null;

function updateHeaderAuthUI(loggedIn, label) {
  const loginBtn = document.getElementById('headerLoginBtn');
  const chip = document.getElementById('headerUserChip');
  const chipLabel = document.getElementById('headerUserLabel');
  if (!loginBtn || !chip) return;
  if (loggedIn) {
    loginBtn.style.display = 'none';
    chip.style.display = 'flex';
    if (chipLabel) chipLabel.textContent = '👋 ' + (label || 'ເຂົ້າສູ່ລະບົບແລ້ວ');
  } else {
    loginBtn.style.display = 'inline-flex';
    chip.style.display = 'none';
  }
}

async function restoreLoginFromStorage() {
  let saved;
  try { saved = localStorage.getItem('kct_id_token'); } catch (e) { return; }
  if (!saved) return;

  // ກວດເບື້ອງຕົ້ນຝັ່ງ browser ວ່າ token ໝົດອາຍຸແລ້ວບໍ່ (Apps Script ຈະຢືນຢັນອີກຄັ້ງແບບເປັນທາງການຢູ່ດີ)
  try {
    const payload = JSON.parse(base64UrlDecode(saved.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('kct_id_token');
      return;
    }
    currentIdToken = saved;
    currentUser = { email: payload.email, name: payload.name };
    setLoginBusy(true, 'ກຳລັງເຂົ້າສູ່ລະບົບອັດຕະໂນມັດ…');
    try { prefetchForRole_(localStorage.getItem('kct_role')); } catch (e) {} // ໂຫຼດຄະແນນຂະໜານໄປກັບການກວດສິດ
  } catch (e) {
    try { localStorage.removeItem('kct_id_token'); } catch (e2) {}
    return;
  }

  const res = await callAPI('login', {});
  setLoginBusy(false);
  if (res && res.found && res.status === 'ອະນຸມັດ') {
    try { localStorage.setItem('kct_role', String(res.role || '')); } catch (e) {}
    onLoginSuccessFromAuth(res);
  } else {
    // token ໝົດອາຍຸ ຫຼື ບໍ່ຜ່ານການຢືນຢັນ — ລຶບອອກຢ່າງງຽບໆ ບໍ່ຕ້ອງລົບກວນຜູ້ໃຊ້
    currentIdToken = null;
    currentUser = null;
    try { localStorage.removeItem('kct_id_token'); } catch (e) {}
  }
}

function closeDetail() { document.getElementById('detailOverlay').innerHTML = ''; }
// ORIGINAL GOOGLE LOGIN LOGIC
function initGoogleLogin(buttonElementId) {
  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
      auto_select: false,
      itp_support: true
    });
    google.accounts.id.renderButton(
      document.getElementById(buttonElementId),
      { theme: 'outline', size: 'large', text: 'signin_with' }
    );
  } catch (err) {}
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
}

function handleGoogleLogin(response) {
  try {
    currentIdToken = response.credential; // ເກັບ token ດິບໄວ້ ສົ່ງໄປໃຫ້ Apps Script ຢືນຢັນເອງທຸກຄັ້ງ
    const payload = JSON.parse(base64UrlDecode(response.credential.split('.')[1]));
    currentUser = { email: payload.email, name: payload.name }; // ໃຊ້ສະແດງຜົນໃນໜ້າເວັບເທົ່ານັ້ນ — ບໍ່ໄດ້ໃຊ້ຢືນຢັນສິດອີກຕໍ່ໄປ
    apiCache_.clear(); // ລ້າງສະເພາະຂໍ້ມູນສ່ວນຕົວ (ຂ່າວ/ແອັບ/ປຶ້ມ ທີ່ເປັນສາທາລະນະຍັງໃຊ້ຕໍ່ໄດ້)
    setLoginBusy(true, 'ກຳລັງກວດສອບບັນຊີ…');
    try { prefetchForRole_(localStorage.getItem('kct_role')); } catch (e) {}
    checkMyAccess();
  } catch (err) { setLoginBusy(false); }
}

async function checkMyAccess() {
  const res = await callAPI('login', { email: currentUser.email });
  if (res && res.error) {
    setLoginBusy(false);
    const dbg = document.getElementById('debug-error');
    if (dbg) { dbg.style.display = 'block'; dbg.textContent = '❌ ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ (' + res.error + ') ກະລຸນາລອງໃໝ່ອີກຄັ້ງ'; }
    return;
  }
  const dbg0 = document.getElementById('debug-error'); if (dbg0) dbg0.style.display = 'none';
  currentAccess = res;
  setLoginBusy(false);
  if (!res.found) showRequestAccessForm();
  else if (res.status !== 'ອະນຸມັດ') { showPendingApprovalState(); startPollingApprovalStatus(); }
  else { stopPollingApprovalStatus(); onLoginSuccess(res); }
}

/* ===== ຊັ້ນ API: cache + ກັນເອີ້ນຊ້ຳ + ໂຕບອກສະຖານະກຳລັງໂຫຼດ ===== */
const API_CACHE_TTL_ = { getNews: 60e3, getApps: 60e3, getBooks: 60e3, getAccessibleRooms: 300e3, getMyMonths: 300e3, getMyStudentProfile: 300e3, getMyClassMonth: 120e3, getMyReport: 120e3, getClassMonths: 300e3, getClassScores: 120e3, getRosterDirectory: 120e3, getRosterStudentReport: 120e3 };
const apiCache_ = new Map();
function clearApiCache() { apiCache_.clear(); publicBundleP_ = null; }

let apiPending_ = 0, apiBarTimer_ = null, apiToastTimer_ = null, apiSlowTimer_ = null, apiBarPct_ = 0;
function apiBusyUI_(on) {
  let bar = document.getElementById('kctTopBar'), toast = document.getElementById('kctToast');
  if (!bar) { bar = document.createElement('div'); bar.id = 'kctTopBar'; document.body.appendChild(bar); }
  if (!toast) { toast = document.createElement('div'); toast.id = 'kctToast'; toast.setAttribute('role', 'status'); toast.innerHTML = '<span class="kct-spin"></span><span id="kctToastText">ກຳລັງໂຫຼດຂໍ້ມູນ…</span>'; document.body.appendChild(toast); }
  if (on) {
    bar.style.opacity = '1'; apiBarPct_ = 15; bar.style.width = '15%';
    clearInterval(apiBarTimer_); apiBarTimer_ = setInterval(function () { apiBarPct_ += (90 - apiBarPct_) * 0.12; bar.style.width = apiBarPct_ + '%'; }, 400);
    clearTimeout(apiToastTimer_); apiToastTimer_ = setTimeout(function () { toast.style.display = 'flex'; document.getElementById('kctToastText').textContent = 'ກຳລັງໂຫຼດຂໍ້ມູນ…'; }, 500);
    clearTimeout(apiSlowTimer_); apiSlowTimer_ = setTimeout(function () { var t = document.getElementById('kctToastText'); if (t) t.textContent = 'ເຊີບເວີກຳລັງເລີ່ມທຳງານ ອາດໃຊ້ເວລາສອງສາມວິນາທີ…'; }, 6000);
  } else {
    clearInterval(apiBarTimer_); clearTimeout(apiToastTimer_); clearTimeout(apiSlowTimer_);
    bar.style.width = '100%'; setTimeout(function () { if (!apiPending_) { bar.style.opacity = '0'; setTimeout(function () { if (!apiPending_) bar.style.width = '0'; }, 350); } }, 250);
    toast.style.display = 'none';
  }
}

async function callAPIRaw_(action, data) {
  apiPending_++; if (apiPending_ === 1) apiBusyUI_(true);
  try {
    const retryable = action === 'login' || action === 'getPublicContent' || !!API_CACHE_TTL_[action];
    for (let attempt = 0; attempt < (retryable ? 2 : 1); attempt++) {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 45000) : null;
      try {
        // ແນບ idToken ໄປທຸກຄັ້ງທີ່ມີ — Apps Script ຈະເປັນຄົນຢືນຢັນ token ນີ້ກັບ Google ເອງ
        const body = { action, idToken: currentIdToken, ...data };
        const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined });
        return await res.json();
      } catch (err) {
        if (attempt === 0 && retryable) continue; // Apps Script ຕື່ນນອນຊ້າ/ຕໍ່ບໍ່ຕິດຄັ້ງທຳອິດ — ລອງອີກຄັ້ງອັດຕະໂນມັດ
        return { error: 'ເຊື່ອມຕໍ່ບໍ່ໄດ້' };
      } finally { if (timer) clearTimeout(timer); }
    }
  } finally { apiPending_--; if (apiPending_ === 0) apiBusyUI_(false); }
}

function seedApiCache_(boot) {
  if (!Array.isArray(boot)) return;
  boot.forEach(function (item) {
    if (item && item.a && item.r && !item.r.error) apiCache_.set(item.a + '|' + JSON.stringify(item.d || {}), { t: Date.now(), v: item.r });
  });
}

/* ຂ່າວ + ແອັບ + ປຶ້ມ ໂຫຼດພ້ອມກັນໃນການເອີ້ນເຊີບເວີຄັ້ງດຽວ (getPublicContent). ຖ້າເຊີບເວີຍັງເປັນໂຄດເກົ່າ ຈະກັບໄປເອີ້ນແຍກ 3 ຄັ້ງຄືເກົ່າອັດຕະໂນມັດ */
const PUBLIC_BUNDLE_KEYS_ = { getNews: 'news', getApps: 'apps', getBooks: 'books' };
let publicBundleP_ = null, publicBundleSupported_ = true;
function publicBundle_() {
  if (!publicBundleP_) {
    const p = callAPIRaw_('getPublicContent', {}).then(function (r) {
      if (!r || r.error) { publicBundleSupported_ = !(r && r.error === 'UNKNOWN_ACTION') && publicBundleSupported_; if (publicBundleP_ === p) publicBundleP_ = null; return null; }
      setTimeout(function () { if (publicBundleP_ === p) publicBundleP_ = null; }, 60000);
      return r;
    });
    publicBundleP_ = p;
  }
  return publicBundleP_;
}

function callAPI(action, data) {
  if (action === 'login') {
    return callAPIRaw_(action, data).then(function (res) {
      if (res && res.boot) { seedApiCache_(res.boot); delete res.boot; try { localStorage.setItem('kct_boot', '1'); } catch (e) {} }
      return res;
    });
  }
  const ttl = API_CACHE_TTL_[action];
  if (/^(add|update|delete|upload)/.test(action)) clearApiCache();
  if (action === 'getMyReport' || action === 'getRosterStudentReport' || action === 'getMyClassMonth' || action === 'getClassScores') ensureExportLibs();
  if (PUBLIC_BUNDLE_KEYS_[action] && publicBundleSupported_) {
    return publicBundle_().then(function (r) {
      if (r) { const o = {}; o[PUBLIC_BUNDLE_KEYS_[action]] = r[PUBLIC_BUNDLE_KEYS_[action]] || []; return o; }
      return callAPIRaw_(action, data); // ສຳຮອງ: ເອີ້ນແຍກແບບເກົ່າ
    });
  }
  if (!ttl) return callAPIRaw_(action, data);
  const key = action + '|' + JSON.stringify(data || {});
  const hit = apiCache_.get(key);
  if (hit && hit.p) return hit.p;
  if (hit && Date.now() - hit.t < ttl) return Promise.resolve(hit.v);
  const p = callAPIRaw_(action, data).then(function (v) {
    if (v && !v.error) apiCache_.set(key, { t: Date.now(), v: v }); else apiCache_.delete(key);
    return v;
  });
  apiCache_.set(key, { p: p });
  return p;
}

/* ໂຫຼດ xlsx/html2pdf ເມື່ອຈຳເປັນເທົ່ານັ້ນ (ເມື່ອເປີດຄະແນນ) — ບໍ່ບລັອກການເປີດໜ້າເວັບ */
let exportLibsRequested_ = false;
function ensureExportLibs() {
  if (exportLibsRequested_) return; exportLibsRequested_ = true;
  ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'].forEach(function (src) {
    const el = document.createElement('script'); el.src = src; el.async = true; document.head.appendChild(el);
  });
}

/* ສະແດງ/ເຊື່ອງໂຕບອກ "ກຳລັງເຂົ້າສູ່ລະບົບ" ໃນໜ້າ Login */
let loginBusyTimer_ = null;
function setLoginBusy(on, text) {
  const busy = document.getElementById('loginBusy'), btn = document.getElementById('google-login-btn');
  const t = document.getElementById('loginBusyText'), sub = document.getElementById('loginBusySub');
  if (!busy) return;
  clearTimeout(loginBusyTimer_);
  if (on) {
    busy.style.display = 'block'; if (btn) btn.style.display = 'none';
    if (t) t.textContent = text || 'ກຳລັງເຂົ້າສູ່ລະບົບ…';
    if (sub) sub.textContent = 'ກະລຸນາລໍຖ້າ ຢ່າປິດໜ້ານີ້';
    loginBusyTimer_ = setTimeout(function () { if (sub) sub.textContent = 'ເຊີບເວີກຳລັງເລີ່ມທຳງານ ອາດໃຊ້ເວລາສອງສາມວິນາທີ — ລະບົບຍັງເຮັດວຽກຢູ່'; }, 6000);
  } else {
    busy.style.display = 'none'; if (btn) btn.style.display = 'flex';
  }
}

function prefetchForRole_(role) {
  try { if (localStorage.getItem('kct_boot') === '1') return; } catch (e) {} // ເຊີບເວີຮວມຂໍ້ມູນມາກັບ login ແລ້ວ ບໍ່ຕ້ອງເອີ້ນຊ້ຳ
  role = String(role || '').toLowerCase();
  if (role === 'student') { callAPI('getMyMonths', {}); callAPI('getMyStudentProfile', {}); }
  else if (role === 'admin' || role === 'teacher' || role === 'teacher_viewer') callAPI('getAccessibleRooms', {});
}

function showRequestAccessForm() {
  const nameInput = document.getElementById('nameReqInput');
  if (nameInput && !nameInput.value && currentUser && currentUser.name) nameInput.value = currentUser.name;
  document.getElementById('loginStep').style.display = 'none';
  document.getElementById('requestStep').style.display = 'block';
}

function showPendingApprovalState() {
  document.getElementById('loginStep').style.display = 'none';
  document.getElementById('requestStep').style.display = 'none';
  document.getElementById('pendingStep').style.display = 'block';
}

function startPollingApprovalStatus() {
  stopPollingApprovalStatus();
  pollingInterval = setInterval(async () => {
    const res = await callAPI('login', { email: currentUser.email });
    if (res.status === 'ອະນຸມັດ') { stopPollingApprovalStatus(); currentAccess = res; onLoginSuccess(res); }
  }, 3000);
}

function stopPollingApprovalStatus() { if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; } }

function onLoginSuccess(access) {
  try { localStorage.setItem('kct_role', String(access.role || '')); } catch (e) {}
  document.getElementById('loginGate').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  onLoginSuccessFromAuth(access);
}

(function waitForGoogleAndInit() {
  const btn = document.getElementById('google-login-btn');
  if (!btn) { setTimeout(waitForGoogleAndInit, 150); return; }
  if (window.google && window.google.accounts) initGoogleLogin('google-login-btn');
  else {
    let count = 0;
    const timer = setInterval(() => {
      count++;
      if (window.google && window.google.accounts) { clearInterval(timer); initGoogleLogin('google-login-btn'); }
      else if (count > 30) clearInterval(timer);
    }, 150);
  }
})();

/* =====================================================================
   ແຈ້ງເຕືອນ: ເປີດ "ໂໝດຄອມພິວເຕີ (Desktop site)" ໃນໂທລະສັບ
   ===================================================================== */
(function desktopModeHint() {
  function isDesktopModeOnPhone() {
    const touch = (navigator.maxTouchPoints || 0) > 0;
    const smallScreen = Math.min(screen.width, screen.height) <= 600; // ຂະໜາດຈໍແທ້ຂອງໂທລະສັບ (CSS px)
    return touch && smallScreen && window.innerWidth >= 760;           // ແຕ່ໜ້າເວັບກວ້າງແບບຄອມ
  }
  function closedBefore() { try { return sessionStorage.getItem('kct_dm_closed') === '1'; } catch (e) { return false; } }
  function show() {
    if (document.getElementById('kctDesktopHint')) return;
    const k = Math.max(1.4, Math.min(3.2, window.innerWidth / Math.min(screen.width, screen.height))); // ຂະຫຍາຍຕົວໜັງສືໃຫ້ອ່ານງ່າຍເຖິງຈະຢູ່ໂໝດຄອມ
    const box = document.createElement('div');
    box.id = 'kctDesktopHint'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'ຄຳແນະນຳເປີດໂໝດໂທລະສັບ');
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483600;background:#fffbea;border-top:' + (3 * k) + 'px solid #B8603F;box-shadow:0 -6px 24px rgba(0,0,0,.25);padding:' + (12 * k) + 'px ' + (14 * k) + 'px ' + (14 * k) + 'px;font-family:"Noto Sans Lao",sans-serif;color:#2A2420;font-size:' + (14 * k) + 'px;line-height:1.5;box-sizing:border-box;';
    box.innerHTML = '<button id="kctDesktopHintClose" aria-label="ປິດ" style="position:absolute;top:' + (6 * k) + 'px;right:' + (8 * k) + 'px;width:' + (40 * k) + 'px;height:' + (40 * k) + 'px;border-radius:50%;border:2px solid #2A2420;background:#fff;color:#2A2420;font-size:' + (26 * k) + 'px;font-weight:700;line-height:1;cursor:pointer;padding:0;">✕</button>'
      + '<div style="font-weight:700;font-size:' + (16 * k) + 'px;padding-right:' + (50 * k) + 'px;">📱 ກຳລັງເປີດແບບ "ໂໝດຄອມພິວເຕີ"</div>'
      + '<div style="margin-top:' + (4 * k) + 'px;">ໜ້າເວັບຈຶ່ງນ້ອຍ ແລະ ອ່ານຍາກ. ປິດໂໝດນີ້ເພື່ອໃຫ້ໃຫຍ່ ແລະ ເບິ່ງງ່າຍຂຶ້ນ:</div>'
      + '<div style="margin-top:' + (6 * k) + 'px;"><b>Chrome / Android:</b> ກົດ <b>⋮</b> (ສາມຈຸດ) → <b>ເອົາຕິກອອກ</b> ຢູ່ "ເວັບໄຊສຳລັບຄອມພິວເຕີ" (Desktop site)</div>'
      + '<div style="margin-top:' + (4 * k) + 'px;"><b>iPhone / Safari:</b> ກົດ <b>ᴀA</b> ຂ້າງແຖບທີ່ຢູ່ → <b>ຮ້ອງຂໍເວັບໄຊສຳລັບມືຖື</b> (Request Mobile Website)</div>'
      + '<div style="margin-top:' + (4 * k) + 'px;color:#6b6259;font-size:' + (12 * k) + 'px;">ຖ້າເປີດຜ່ານແອັບ Facebook/Messenger ໃຫ້ເລືອກ "ເປີດໃນ Chrome/Safari" ແລ້ວປິດໂໝດຄອມຕາມຂ້າງເທິງ.</div>';
    document.body.appendChild(box);
    document.getElementById('kctDesktopHintClose').addEventListener('click', function () { box.remove(); try { sessionStorage.setItem('kct_dm_closed', '1'); } catch (e) {} });
  }
  function check() { if (!closedBefore() && isDesktopModeOnPhone()) show(); }
  if (document.readyState === 'complete') setTimeout(check, 600); else window.addEventListener('load', function () { setTimeout(check, 600); });
})();
