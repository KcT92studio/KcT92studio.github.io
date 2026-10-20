/* คืนหน้าค้นหาเดิม: ชื่อ–รหัส–บิดา–มารดา โดยข้อมูลถูกส่งจาก Apps Script ตามสิทธิ์ */
let legacyRooms = [];
let legacyRoomSummaries = [];
let legacyStudents = [];
let legacySelectedReport = null;
let legacySearchSequence = 0;

const REPORT_COLUMNS = ['09', '10', '11', '12', 'Avg I', 'Exam I', 'Tot I', '02', '03', '04', '05', 'Avg II', 'Exam II', 'Tot II', 'Year', 'Fix', 'Note'];
const REPORT_SUBJECTS = [
  { group: 'ກຸ່ມພາສາ', subject: 'ພາສາລາວ-ວັນນະຄະດີ' },
  { group: 'ກຸ່ມພາສາ', subject: 'ຄະນິດສາດ' },
  { group: 'ກຸ່ມພາສາ', subject: 'ສຶກສາພົນລະເມືອງ' },
  { group: 'ວິທະຍາສາດທຳມະຊາດ', subject: 'ຟີຊິກສາດ' },
  { group: 'ວິທະຍາສາດທຳມະຊາດ', subject: 'ເຄມີສາດ' },
  { group: 'ວິທະຍາສາດທຳມະຊາດ', subject: 'ຊີວະສາດ' },
  { group: 'ວິທະຍາສາດສັງຄົມ', subject: 'ພູມສາດ' },
  { group: 'ວິທະຍາສາດສັງຄົມ', subject: 'ປະຫວັດສາດ' },
  { group: 'ວິທະຍາສາດສັງຄົມ', subject: 'ເຕັກໂນໂລຊີ (ICT)' },
  { group: 'ວິທະຍາສາດສັງຄົມ', subject: 'ພື້ນຖານວິຊາຊີບ' },
  { group: 'ສິລະປະສຶກສາ', subject: 'ສິລະປະດົນຕີ' },
  { group: 'ສິລະປະສຶກສາ', subject: 'ສິລະປະກຳ' },
  { group: 'ພາສາຕ່າງປະເທດ', subject: 'ພາສາອັງກິດ' },
  { group: 'ພາສາຕ່າງປະເທດ', subject: 'ພາສາຝຣັ່ງ' },
  { group: 'ພາສາຕ່າງປະເທດ', subject: 'ພາສາ.........' },
  { group: 'ພລະ-ປ້ອງກັນຊາດ', subject: 'ພລະສຶກສາ' },
  { group: 'ພລະ-ປ້ອງກັນຊາດ', subject: 'ປ້ອງກັນຊາດ' },
  { group: 'ກຸ່ມພາສາບາລີ', subject: 'ທັມມະ' },
  { group: 'ກຸ່ມພາສາບາລີ', subject: 'ວິນັຍ' },
  { group: 'ກຸ່ມພາສາບາລີ', subject: 'ແຕ່ງ, ແປບາລີ' },
  { group: 'ກຸ່ມພາສາບາລີ', subject: 'ແປພຸດທະປະຫວັດ' },
  { group: 'ກິດຈະກຳ', subject: 'ຄະແນນອອກແຮງງານ' },
  { group: 'ກິດຈະກຳ', subject: 'ຄະແນນຄຸນສົມບັດ' },
  { group: 'ສະຖິຕິ', subject: 'ຈຳນວນວັນຂາດຮຽນ' },
  { group: 'ສະຖິຕິ', subject: 'ຈັດທີ' }
];

function kctSkeletonCards(n) { let h = ''; for (let i = 0; i < n; i++) h += '<div class="card kct-skel"><div class="gender-badge" style="background:#e6dfd0"></div><div style="flex:1"><div class="kct-skel-line" style="width:62%"></div><div class="kct-skel-line" style="width:30%;height:10px;margin-top:8px"></div></div></div>'; return h; }
function legacyEscape(value) { const node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
function legacyRole() { return String((currentAccess && currentAccess.role) || '').toLowerCase(); }
function legacyCanBrowse() { return ['admin', 'teacher', 'teacher_viewer'].includes(legacyRole()); }
function legacyDisplayName(student) {
  const first = String(student.firstName || '').trim(); const last = String(student.lastName || '').trim();
  const hasPrefix = /^(ທ້າວ|ນາງ|ນ\.|ທ\.|ດ\.ຊ\.|ດ\.ຍ\.)/i.test(first);
  const male = String(student.gender || '').toLowerCase().includes('ຊາຍ') || String(student.gender || '').toLowerCase() === 'male';
  return ((hasPrefix ? first : (male ? 'ທ້າວ ' : 'ນາງ ') + first) + ' ' + last).trim();
}

async function init() {
  if (!currentAccess) return;
  if (typeof kctUpdateScoreTabLabel === 'function') kctUpdateScoreTabLabel();
  const source = document.getElementById('dataSourceText');
  if (legacyCanBrowse()) {
    if (source) source.textContent = 'ເລືອກຫ້ອງ ເພື່ອເບິ່ງຄະແນນ';
    document.querySelector('.tabs').style.display = 'none';
    document.getElementById('searchPanel').style.display = 'none';
    document.getElementById('roomsPanel').style.display = 'block';
    await legacyLoadRooms();
  } else {
    if (source) source.textContent = 'ສະແດງສະເພາະປຶ້ມຕິດຕາມຂອງທ່ານ';
    document.getElementById('searchPanel').style.display = 'none';
    document.getElementById('roomsPanel').style.display = 'none';
    document.querySelector('.tabs').style.display = 'none';
    await legacyShowMyReport();
  }
}

async function legacyLoadRooms() {
  const res = await callAPI('getRoomSummaries', {});
  if (!res || res.error || !Array.isArray(res.rooms)) { document.getElementById('searchList').innerHTML = '<div class="empty">ບໍ່ສາມາດໂຫຼດຫ້ອງຮຽນໄດ້</div>'; return; }
  legacyRooms = res.rooms.filter(Boolean);
  legacyRoomSummaries = Array.isArray(res.summaries) ? res.summaries : legacyRooms.map(function(room) { return { room: room, total: 0 }; });
  const totalStudentsLabel = document.getElementById('dataSourceText');
  if (totalStudentsLabel && Number.isFinite(Number(res.totalStudents))) totalStudentsLabel.textContent = 'ນັກຮຽນທັງໝົດ ' + Number(res.totalStudents) + ' ຄົນ · ' + legacyRooms.length + ' ຫ້ອງ';
  if (typeof kctUpdateScoreTabLabel === 'function') kctUpdateScoreTabLabel();
  const select = document.getElementById('legacyRoomSelect');
  if (select) {
    select.replaceChildren();
    legacyRooms.forEach(function(room) { const option = document.createElement('option'); option.value = room; option.textContent = room; select.append(option); });
    document.getElementById('secureRoomChooser').style.display = legacyRooms.length > 1 ? 'block' : 'none';
  }
  if (!legacyRooms.length) document.getElementById('roomsList').innerHTML = '<div class="empty">ຍັງບໍ່ມີຫ້ອງຮຽນທີ່ອະນຸຍາດ</div>';
  else renderRooms();
}

function legacySelectedRoom() { const select = document.getElementById('legacyRoomSelect'); return select && select.value ? select.value : (legacyRooms[0] || ''); }

/* ===== ຄົ້ນຫາຊື່ແບບລາວ =====
   - ບໍ່ສົນວັນນະຍຸດ (່ ້ ໊ ໋) ແລະ ຊ່ອງວ່າງ
   - ພະຍັນຊະນະຕົ້ນ: ພິມ "ສ" ຕ້ອງພົບ ສົມ..., ເສີນ..., ແສງ..., ໂສ... (ຂ້າມສະຫຼະນຳໜ້າ ເ ແ ໂ ໄ ໃ)
   - ພິມສະຫຼະນຳໜ້າມາດ້ວຍ ເຊັ່ນ "ເສ" ກໍພົບ ເສີນ... (ແລະບໍ່ປົນກັບ ແສ...)
   - ຄຳຄົ້ນສັ້ນ (1–2 ໂຕ) ກົງຫົວຄຳເທົ່ານັ້ນ, ຄຳຍາວ (3 ໂຕຂຶ້ນໄປ) ຄົ້ນກາງຄຳໄດ້ */
function laoStripTitle(first) { return String(first || '').replace(/^\s*(ທ້າວ|ນາງ|ເດັກຊາຍ|ເດັກຍິງ|ນ\.|ທ\.|ດ\.ຊ\.|ດ\.ຍ\.)\s*/, ''); }
function laoClean(v) { return String(v || '').toLowerCase().replace(/[\u0EC8-\u0ECC]/g, ''); }
function laoWords(v) { return laoClean(v).split(/[\s.,\-_/()]+/).filter(Boolean); }
function laoCore(w) { return w.replace(/^[ເແໂໄໃ]+/, ''); }
function laoMatcher(query) {
  const tokens = laoWords(query);
  if (!tokens.length) return function () { return 0; };
  return function (text, firstName) {
    const words = laoWords(text);
    const cores = words.map(laoCore);
    const concat = cores.join('');
    const firstWords = laoWords(firstName);
    let rank = 2;
    for (let i = 0; i < tokens.length; i++) {
      const q = tokens[i], qCore = laoCore(q), hasLead = q !== qCore;
      if (!qCore) { // ພິມສະຫຼະນຳໜ້າຢ່າງດຽວ: ເອົາຄຳທີ່ຂຶ້ນຕົ້ນດ້ວຍສະຫຼະນັ້ນ
        if (!words.some(function (w) { return w.charAt(0) === q.charAt(0); })) return -1;
        continue;
      }
      const prefixOk = words.some(function (w, k) { return hasLead ? w.indexOf(q) === 0 : cores[k].indexOf(qCore) === 0; });
      const innerOk = !prefixOk && qCore.length >= 3 && (hasLead ? words.some(function (w) { return w.indexOf(q) >= 0; }) : concat.indexOf(qCore) >= 0);
      if (!prefixOk && !innerOk) return -1;
      if (i === 0 && prefixOk && firstWords.some(function (w) { return hasLead ? w.indexOf(q) === 0 : laoCore(w).indexOf(qCore) === 0; })) rank = 0;
      else if (i === 0 && prefixOk && rank > 1) rank = 1;
    }
    return rank;
  };
}

let fullRosterCache = {}; // Cache ລາຍຊື່ທັງໝົດແຍກຕາມຫ້ອງ

async function renderSearch(force) {
  if (!legacyCanBrowse()) return;
  const room = legacySelectedRoom();
  const nameQuery = (document.getElementById('nameInput').value || '').trim();
  const idQuery = (document.getElementById('idInput').value || '').trim();
  const parentQuery = (document.getElementById('parentInput').value || '').trim();
  const list = document.getElementById('searchList');
  if (!room) return;

  // ຖ້າຫ້ອງປ່ຽນ ຫຼື ຍັງບໍ່ມີຂໍ້ມູນໃນ Cache, ໃຫ້ໂຫຼດລາຍຊື່ທັງໝົດມາໄວ້ກ່ອນ
  if (!fullRosterCache[room] || force) {
    list.innerHTML = kctSkeletonCards(6) + '<div class="empty kct-loading" style="padding-top:6px">ກຳລັງໂຫຼດລາຍຊື່ນັກຮຽນ…</div>';
    const res = await callAPI('getRosterDirectory', { room: room });
    if (!res || res.error) { list.innerHTML = '<div class="empty">ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໄດ້</div>'; return; }
    fullRosterCache[room] = res.students || [];
  }

  const students = fullRosterCache[room];
  
  // ກັ່ນຕອງຂໍ້ມູນໃນ Browser ທັນທີ (Smart Search ແບບລາວ: ຮອງຮັບສະຫຼະນຳໜ້າ ເ ແ ໂ ໄ ໃ)
  const searchKey = (val) => String(val || '').toLowerCase().replace(/[\s\.,\-_/()]+/g, '');
  const iQ = searchKey(idQuery);
  const nameMatcher = laoMatcher(nameQuery), parentMatcher = laoMatcher(parentQuery);
  const filtered = students.map(function(s, idx) {
    const first = laoStripTitle(s.firstName), last = String(s.lastName || '');
    const nm = nameMatcher(first + ' ' + last, first);
    if (nm < 0) return null;
    if (iQ && searchKey(s.studentId).indexOf(iQ) < 0) return null;
    if (parentQuery && parentMatcher(String(s.father || '') + ' ' + String(s.mother || ''), '') < 0) return null;
    return { s: s, rank: nm, idx: idx };
  }).filter(Boolean);
  if (nameQuery) filtered.sort(function(a, b) { return a.rank - b.rank || a.idx - b.idx; });
  const filteredStudents = filtered.map(function(x) { return x.s; });

  document.getElementById('roomCountSearch').textContent = filteredStudents.length ? '1' : '0';
  document.getElementById('studentCountSearch').textContent = filteredStudents.length;

  if (!filteredStudents.length) {
    list.innerHTML = '<div class="empty">ບໍ່ພົບຂໍ້ມູນ</div>';
    return;
  }

  list.innerHTML = filteredStudents.map(function(student) {
    const male = String(student.gender || '').toLowerCase().includes('ຊາຍ') || String(student.gender || '').toLowerCase() === 'male';
    return '<div class="card" onclick="showDetail(\'' + legacyEscape(student.ref) + '\')"><div class="gender-badge ' + (male ? 'boy' : 'girl') + '">' + (male ? '♂' : '♀') + '</div><div style="flex:1;"><div class="card-name">' + legacyEscape(legacyDisplayName(student)) + '</div><div class="card-meta">' + legacyEscape(student.room) + ' · ' + legacyEscape(student.studentId || '-') + '</div></div><button class="dl-btn small" onclick="event.stopPropagation();showDetail(\'' + legacyEscape(student.ref) + '\')">📘</button></div>';
  }).join('');
}

async function renderRooms() {
  const list = document.getElementById('roomsList'); list.innerHTML = '<div class="empty kct-loading">ກຳລັງໂຫຼດຫ້ອງ…</div>';
  list.innerHTML = legacyRoomSummaries.map(function(item) {
    const room = item.room, total = Number(item.total || 0);
    return '<div class="room-card" onclick="teacherScoreOpen(\'' + legacyEscape(room) + '\')"><div class="room-top"><div class="room-name">ຫ້ອງ ' + legacyEscape(room) + '</div><button class="dl-btn small" style="background:#167c45;color:#fff;" onclick="event.stopPropagation(); teacherScoreOpen(\'' + legacyEscape(room) + '\')">📊 ເບິ່ງຄະແນນ</button></div><div class="room-stats"><div class="stat-item"><span class="dot total"></span>ນັກຮຽນ <span class="stat-num">' + total + ' ຄົນ</span></div></div></div>';
  }).join('');
}

function showRoomScores(room) {
  const select = document.getElementById('legacyRoomSelect'); if (select) select.value = room;
  switchTab('search'); renderSearch(true);
}

function legacyReportError(code) {
  const map = {
    REPORT_SELECTION_EXPIRED: 'ລາຍຊື່ໝົດອາຍຸ — ກະລຸນາກົດຄົ້ນຫາໃໝ່ແລ້ວລອງອີກຄັ້ງ',
    REPORT_NOT_FOUND: 'ບໍ່ພົບແຖບປຶ້ມຕິດຕາມຂອງນັກຮຽນຄົນນີ້ໃນ Google Sheet (ຊື່ແຖບຕ້ອງກົງກັບຊື່ນັກຮຽນ)',
    ROOM_NOT_CONFIGURED: 'ຫ້ອງນີ້ຍັງບໍ່ໄດ້ຕັ້ງຄ່າໄຟລ໌ຄະແນນ (Rooms_Secure)',
    PROFILE_INCOMPLETE: 'ຂໍ້ມູນນັກຮຽນບໍ່ຄົບ (ຊື່ ຫຼື ຫ້ອງ)',
    FORBIDDEN: 'ບໍ່ມີສິດເປີດຂໍ້ມູນນີ້',
    UNAUTHENTICATED: 'ເຊສຊັນໝົດອາຍຸ — ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່',
    REQUEST_FAILED: 'ເຊີບເວີຜິດພາດ ກະລຸນາລອງໃໝ່'
  };
  const c = String(code || 'ERROR'); const key = Object.keys(map).find(function(k) { return c.indexOf(k) === 0; });
  return key ? map[key] + ' [' + c + ']' : c;
}

async function showDetail(ref) {
  const overlay = document.getElementById('detailOverlay');
  overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name"><span class="kct-spin"></span> ກຳລັງໂຫຼດປຶ້ມຕິດຕາມ…</div><button class="close-btn" onclick="closeDetail()">✕</button></div></div></div>';
  const room = legacySelectedRoom();
  let report = await callAPI('getRosterStudentReport', { ref: ref, room: room });
  if (report && report.error === 'REPORT_SELECTION_EXPIRED') {
    // ລາຍຊື່ເກົ່າໝົດອາຍຸ: ໂຫຼດລາຍຊື່ໃໝ່ ແລ້ວຫານັກຮຽນຄົນເກົ່າດ້ວຍລະຫັດ+ຊື່ ແລະລອງອີກຄັ້ງອັດຕະໂນມັດ
    const old = (fullRosterCache[room] || []).find(function(s) { return s.ref === ref; });
    clearApiCache(); delete fullRosterCache[room];
    const fresh = await callAPI('getRosterDirectory', { room: room });
    if (fresh && !fresh.error) {
      fullRosterCache[room] = fresh.students || [];
      const again = old && fullRosterCache[room].find(function(s) { return s.studentId === old.studentId && s.firstName === old.firstName && s.lastName === old.lastName; });
      if (again) report = await callAPI('getRosterStudentReport', { ref: again.ref, room: room });
    }
  }
  if (!report || report.error) { overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ປຶ້ມຕິດຕາມ</div><button class="close-btn" onclick="closeDetail()">✕</button></div><div class="empty">ບໍ່ສາມາດເປີດປຶ້ມຕິດຕາມ: ' + legacyEscape(legacyReportError(report && report.error)) + '</div></div></div>'; return; }
  legacySelectedReport = report; legacyRenderReport(report, overlay);
}

async function legacyShowMyReport() {
  const overlay = document.getElementById('detailOverlay');
  overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ກຳລັງໂຫຼດປຶ້ມຕິດຕາມ…</div></div></div></div>';
  const report = await callAPI('getMyReport', {});
  if (!report || report.error) { overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-name">ບໍ່ສາມາດເປີດປຶ້ມຕິດຕາມ: ' + legacyEscape(legacyReportError(report && report.error)) + '</div></div></div>'; return; }
  legacySelectedReport = report; legacyRenderReport(report, overlay);
}

function legacyRenderReport(report, host) {
  const student = report.student || {}, editable = !!report.editable;
  const info = '<div class="report-info"><div><b>ຊື່ ແລະ ນາມສະກຸນ:</b> ' + legacyEscape(student.name || legacyDisplayName(student)) + '</div><div><b>ຫ້ອງ:</b> ' + legacyEscape(student.room) + '</div><div><b>ພໍ່:</b> ' + legacyEscape(student.father || '-') + '</div><div><b>ແມ່:</b> ' + legacyEscape(student.mother || '-') + '</div></div>';
  const columns = report.columns || REPORT_COLUMNS;
  const subjects = report.subjects || [];
  const headers = subjects.map(function(item) { return '<th>' + legacyEscape(item.subject || item.sourceSubject || '') + '</th>'; }).join('');
  const rows = columns.map(function(month, columnIndex) {
    const scores = subjects.map(function(item, subjectIndex) {
      const value = item.scores && item.scores[columnIndex] != null ? item.scores[columnIndex] : '';
      const fullSubjectIndex = REPORT_SUBJECTS.findIndex(function(x) { return x.subject === item.subject; });
      return '<td>' + (editable && fullSubjectIndex >= 0 ? '<input class="legacy-score-edit" data-subject="' + fullSubjectIndex + '" data-column="' + columnIndex + '" data-original="' + legacyEscape(value) + '" value="' + legacyEscape(value) + '">' : legacyEscape(value)) + '</td>';
    }).join('');
    return '<tr><th style="text-align:left;">' + legacyEscape(month) + '</th>' + scores + '</tr>';
  }).join('');
  
  host.innerHTML = '<div class="detail-overlay" onclick="if(event.target===this)closeDetail()"><div class="detail-card" id="reportCardContent"><div class="detail-header"><div class="detail-name">📊 ປຶ້ມຕິດຕາມນັກຮຽນ</div><button class="close-btn" onclick="closeDetail()">✕</button></div><div class="btn-group" style="margin-bottom:15px; display:flex; gap:10px;"><button class="dl-btn" onclick="downloadExcel()">⬇ Excel</button><button class="dl-btn" onclick="downloadPDF(\'' + legacyEscape(student.name || 'report') + '\')">⬇ PDF</button>' + (editable ? '<button class="dl-btn" style="background:#167c45;color:#fff;" onclick="saveLegacyReportEdits()">💾 ບັນທຶກຄະແນນ</button>' : '') + '</div>' + info + '<div class="report-table-wrap" style="overflow:auto;"><table class="report-table" id="scoreTable"><thead><tr><th>ເດືອນ</th>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
}

async function saveLegacyReportEdits() {
  const report = legacySelectedReport; if (!report || !report.ref) return;
  const inputs = Array.from(document.querySelectorAll('.legacy-score-edit')).filter(function(input) { return input.value.trim() !== String(input.dataset.original || '').trim(); });
  if (!inputs.length) return alert('ບໍ່ມີຄະແນນທີ່ແກ້ໄຂ');
  if (!confirm('ຢືນຢັນບັນທຶກຄະແນນ ' + inputs.length + ' ລາຍການ?')) return;
  for (const input of inputs) {
    const res = await callAPI('updateReportScore', { ref: report.ref, room: (report.student && report.student.room) || legacySelectedRoom(), subjectIndex: Number(input.dataset.subject), columnIndex: Number(input.dataset.column), value: input.value.trim() });
    if (!res || res.error) return alert('ບັນທຶກບໍ່ສຳເລັດ: ' + legacyReportError(res && res.error));
    input.dataset.original = input.value.trim();
  }
  alert('ບັນທຶກຄະແນນສຳເລັດ');
}

function downloadExcel() { const table = document.getElementById('scoreTable'); if (!table || !window.XLSX) return; const workbook = XLSX.utils.table_to_book(table); XLSX.writeFile(workbook, 'ປຶ້ມຕິດຕາມ.xlsx'); }
async function submitAccessRequest(name, room) { return callAPI('requestAccess', { name: name, room: room }); }
function doAccessRequest() {
  const name = (document.getElementById('nameReqInput') || {}).value || '';
  const room = (document.getElementById('roomReqInput') || {}).value || '';
  if (!name.trim() || !room.trim()) return alert('ກະລຸນາໃສ່ຊື່–ນາມສະກຸນ ແລະ ຫ້ອງ');
  const btn = document.getElementById('requestSubmitBtn');
  if (btn && btn.disabled) return;
  const label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="kct-spin" style="border-color:rgba(255,255,255,.35);border-top-color:#fff;"></span> ກຳລັງສົ່ງຄຳຂໍ…'; }
  submitAccessRequest(name.trim(), room.trim()).then(function(res) {
    if (res && !res.error) { showPendingApprovalState(); startPollingApprovalStatus(); }
    else alert('ສົ່ງຄຳຂໍບໍ່ສຳເລັດ: ' + (res && res.error ? res.error : 'ERROR'));
  }).finally(function() { if (btn) { btn.disabled = false; btn.textContent = label; } });
}
