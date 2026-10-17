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

async function init() {
  await loadConfig();
  if (sheetConfig.rosterSheetId) {
    await fetchRosterFromSheet(sheetConfig.rosterSheetId);
  }
  applyRoleRestrictions();
  renderSearch();
}

function onLoginSuccessFromAuth(access) {
  currentAccess = access;
  const userBadge = document.getElementById('userBadge');
  if (userBadge) {
    userBadge.textContent = `👤 ${access.role}${access.room ? ' | ຫ້ອງ ' + access.room : ''}`;
  }
  init();
  if (typeof loadNews === 'function') loadNews(); // refresh news so ✏️/🗑️ show for teacher/admin
  if (typeof loadApps === 'function') loadApps(); // refresh apps so ✏️/🗑️ show for teacher/admin
  if (typeof loadBooks === 'function') loadBooks(); // refresh books so ✏️/🗑️ show for admin

  // ຈື່ການລ໋ອກອິນໄວ້ໃນເຄື່ອງ — ຈະບໍ່ຫລຸດອອກລະບົບທຸກຄັ້ງທີ່ Refresh (token ຈະໝົດອາຍຸເອງໃນ ~1 ຊົ່ວໂມງ ຕາມມາດຕະຖານ Google)
  if (currentIdToken) {
    try { localStorage.setItem('kct_id_token', currentIdToken); } catch (e) {}
  }
  updateHeaderAuthUI(true, currentUser ? currentUser.name : access.role);
}

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

function logoutUser() {
  currentAccess = null;
  currentUser = null;
  currentIdToken = null;
  try { localStorage.removeItem('kct_id_token'); } catch (e) {}

  updateHeaderAuthUI(false);
  closeApp(); // ປິດໜ້າຕ່າງລະບົບຄະແນນ ຖ້າເປີດຢູ່
  // ກັບຄືນ loginGate ໃຫ້ພ້ອມໃຫ້ Login ໃໝ່ໃນຄັ້ງຕໍ່ໄປ
  const loginGate = document.getElementById('loginGate');
  const mainApp = document.getElementById('mainApp');
  if (loginGate) loginGate.style.display = 'block';
  if (mainApp) mainApp.style.display = 'none';
  const loginStep = document.getElementById('loginStep');
  const requestStep = document.getElementById('requestStep');
  const pendingStep = document.getElementById('pendingStep');
  if (loginStep) loginStep.style.display = 'block';
  if (requestStep) requestStep.style.display = 'none';
  if (pendingStep) pendingStep.style.display = 'none';

  if (typeof loadNews === 'function') loadNews();
  if (typeof loadApps === 'function') loadApps();
  if (typeof loadBooks === 'function') loadBooks();
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

function applyRoleRestrictions() {
  if (!currentAccess) return;
  const gearBtn = document.getElementById('gearBtn');
  if (gearBtn) {
    const isAdmin = currentAccess.role && currentAccess.role.toLowerCase() === 'admin';
    gearBtn.style.display = isAdmin ? 'block' : 'none';
  }
  if (currentAccess.role && currentAccess.role.toLowerCase() === 'student' && currentAccess.room) {
    students = students.filter(s => s.room === currentAccess.room);
  }
}

function canEditRoom(room) {
  if (!currentAccess) return false;
  const role = (currentAccess.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (role === 'teacher' && currentAccess.room && room && currentAccess.room.trim() === room.trim()) return true;
  return false;
}

async function loadConfig() {
  try {
    const s1 = localStorage.getItem('sheetConfig');
    if (s1) sheetConfig = JSON.parse(s1);
    const s2 = localStorage.getItem('settingsConfig');
    if (s2) settingsConfig = JSON.parse(s2);
  } catch(e) {}
  if (!sheetConfig.scoreSheetsByRoom) sheetConfig.scoreSheetsByRoom = {};
}

async function fetchRosterFromSheet(rosterId) { return; }

function buildStudentsFromRows(rows) {
  if (rows.length < 1) return { error: 'ບໍ່ພົບຂໍ້ມູນ' };
  let extractedHeaderRoom = '';
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = (rows[i] || []).join(' ');
    const match = rowStr.match(/ຊັ້ນຮຽນ\s*:\s*([^\s,]+)/i) || rowStr.match(/(ມ\.\s*\d+(\/\d+)?)/i);
    if (match) { extractedHeaderRoom = (match[1] || match[2]).trim(); break; }
  }
  let fallbackRoom = extractedHeaderRoom || (Object.keys(sheetConfig.scoreSheetsByRoom)[0]) || 'ມ.4';
  const newStudents = [];
  let startIdx = 1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rStr = (rows[i] || []).join(' ');
    if (rStr.includes('ຊື່') || rStr.includes('ນາມສະກຸນ') || rStr.includes('ລຳດັບ')) { startIdx = i + 1; break; }
  }
  for (let i = startIdx; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2) continue;
    const col1 = (r[1] || '').trim();
    if (!col1 || col1.includes('ຊື່') || col1.includes('ລຳດັບ')) continue;
    newStudents.push({
      firstName: col1, lastName: (r[2] || '').trim(), gender: (r[3] || '').trim(),
      id: (r[4] || '').trim(), room: (r[5] || '').trim() || fallbackRoom,
      dob: (r[6] || '').trim(), father: (r[7] || '').trim(), mother: (r[8] || '').trim(),
      phone: (r[9] || '').trim(), address: (r[10] || '').trim(), rowIdx: i
    });
  }
  return { students: newStudents };
}

function getScoreSheetId(room) { return ''; }

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tabSearch').classList.toggle('active', tab === 'search');
  document.getElementById('tabRooms').classList.toggle('active', tab === 'rooms');
  document.getElementById('searchPanel').style.display = tab === 'search' ? 'block' : 'none';
  document.getElementById('roomsPanel').style.display = tab === 'rooms' ? 'block' : 'none';
  if (tab === 'rooms') renderRooms();
}

function formatStudentName(s) {
  if (!s) return '';
  const firstName = (s.firstName || '').trim();
  const lastName = (s.lastName || '').trim();
  const isBoy = s.gender ? s.gender.includes('ຊາຍ') : false;
  const prefixRegex = /^(ທ້າວ|ນາງ|ນ\.|ທ\.|ດ\.ຊ\.|ດ\.ຍ\.|ນ\s|ທ\s|ດຊ|ດຍ)/i;
  let formattedFirstName = firstName;
  if (!prefixRegex.test(firstName)) {
    const prefix = isBoy ? 'ທ້າວ' : 'ນາງ';
    formattedFirstName = `${prefix} ${firstName}`;
  }
  return (formattedFirstName + ' ' + lastName).trim();
}

function renderSearch() {
  const nQ = document.getElementById('nameInput').value.toLowerCase().trim();
  const idQ = document.getElementById('idInput').value.toLowerCase().trim();
  const pQ = document.getElementById('parentInput').value.toLowerCase().trim();
  const listEl = document.getElementById('searchList');
  if (!nQ && !idQ && !pQ) {
    document.getElementById('roomCountSearch').textContent = '0';
    document.getElementById('studentCountSearch').textContent = '0';
    listEl.innerHTML = '<div class="empty">🔍 ກະລຸນາພິມຄຳຄົ້ນຫາ (ຊື່, ລະຫັດ, ຫຼື ຊື່ຜູ້ປົກຄອງ) ເພື່ອສະແດງຂໍ້ມູນ</div>';
    return;
  }
  const filtered = students.filter(s => 
    (s.firstName + ' ' + s.lastName).toLowerCase().includes(nQ) &&
    (s.id||'').toLowerCase().includes(idQ) &&
    ((s.father||'') + ' ' + (s.mother||'')).toLowerCase().includes(pQ)
  );
  document.getElementById('roomCountSearch').textContent = new Set(filtered.map(s => s.room)).size;
  document.getElementById('studentCountSearch').textContent = filtered.length;
  if (filtered.length === 0) { listEl.innerHTML = '<div class="empty">ບໍ່ພົບຂໍ້ມູນ</div>'; return; }
  listEl.innerHTML = filtered.map((s, idx) => `
    <div class="card" onclick="showDetail(${students.indexOf(s)})">
      <div class="gender-badge ${s.gender && s.gender.includes('ຊາຍ') ? 'boy' : 'girl'}">${s.gender && s.gender.includes('ຊາຍ') ? '♂' : '♀'}</div>
      <div>
        <div class="card-name">${formatStudentName(s)}</div>
        <div class="card-meta">${s.room || '-'} · ${s.id || '-'}</div>
      </div>
    </div>
  `).join('');
}

function renderRooms() {
  const rooms = {};
  students.forEach(s => {
    const r = s.room || 'ບໍ່ລະບຸຫ້ອງ';
    if (!rooms[r]) rooms[r] = { total: 0 };
    rooms[r].total++;
  });
  const listEl = document.getElementById('roomsList');
  listEl.innerHTML = Object.keys(rooms).sort().map(r => `
    <div class="room-card" onclick="showRoomScores('${r}')">
      <div class="room-top">
        <div class="room-name">ຫ້ອງ ${r}</div>
        <button class="dl-btn small">📊 ເບິ່ງຄະແນນຫ້ອງ</button>
      </div>
      <div class="room-stats">
        <div class="stat-item"><span class="dot total"></span>ທັງໝົດ <span class="stat-num">${rooms[r].total}</span></div>
      </div>
    </div>
  `).join('');
}

async function showRoomScores(room) { return; }

async function showDetail(idx) { return; }

async function fetchStudentScores(s) { return; }

function closeDetail() { document.getElementById('detailOverlay').innerHTML = ''; }
function closeSettings() { document.getElementById('settingsOverlay').innerHTML = ''; }
function extractSheetId(val) { return ''; }
function openSettings() { return; }
function renderScoreSheetRows() { return; }
function addScoreSheetRow() { return; }
async function saveSettings() { return; }

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
    clearApiCache();
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

async function submitAccessRequest(room) {
  const res = await callAPI('requestAccess', { email: currentUser.email, name: currentUser.name, room: room });
  if (res.error) { alert('❌ เกิดข้อผิดพลาด: ' + res.error); return; }
  showPendingApprovalState();
  startPollingApprovalStatus();
}

/* ===== ຊັ້ນ API: cache + ກັນເອີ້ນຊ້ຳ + ໂຕບອກສະຖານະກຳລັງໂຫຼດ ===== */
const API_CACHE_TTL_ = { getNews: 60e3, getApps: 60e3, getBooks: 60e3, getAccessibleRooms: 300e3, getMyMonths: 300e3, getMyStudentProfile: 300e3, getMyClassMonth: 120e3, getMyReport: 120e3, getClassMonths: 300e3, getClassScores: 120e3, getRosterDirectory: 120e3, getRosterStudentReport: 120e3 };
const apiCache_ = new Map();
function clearApiCache() { apiCache_.clear(); }

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
    const retryable = action === 'login' || !!API_CACHE_TTL_[action];
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

function callAPI(action, data) {
  const ttl = API_CACHE_TTL_[action];
  if (/^(add|update|delete|upload)/.test(action)) clearApiCache();
  if (action === 'getMyReport' || action === 'getRosterStudentReport' || action === 'getMyClassMonth' || action === 'getClassScores') ensureExportLibs();
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

function doAccessRequest() {
  const room = document.getElementById('roomReqInput').value.trim();
  if (!room) { alert('ກະລຸນາໃສ່ຫ້ອງ'); return; }
  submitAccessRequest(room);
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

function downloadExcel(idx) {
  const table = document.getElementById('scoreTable');
  const wb = XLSX.utils.table_to_book(table);
  XLSX.writeFile(wb, `ປຶ້ມຕິດຕາມ_${students[idx].firstName}.xlsx`);
}

function downloadPDF(filename) {
  const element = document.getElementById('reportCardContent');
  const opt = { margin: 0.5, filename: filename + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } };
  html2pdf().set(opt).from(element).save();
}
