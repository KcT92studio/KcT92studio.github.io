/* คืนหน้าค้นหาเดิม: ชื่อ–รหัส–บิดา–มารดา โดยข้อมูลถูกส่งจาก Apps Script ตามสิทธิ์ */
let legacyRooms = [];
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

function legacyEscape(value) { const node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
function legacyText(value) { return value == null || value === '' ? '-' : String(value); }
function legacyRole() { return String((currentAccess && currentAccess.role) || '').toLowerCase(); }
function legacyCanBrowse() { return ['admin', 'teacher', 'teacher_viewer'].includes(legacyRole()); }
function legacyCanEdit() { return ['admin', 'teacher'].includes(legacyRole()); }
function legacyDisplayName(student) {
  const first = String(student.firstName || '').trim(); const last = String(student.lastName || '').trim();
  const hasPrefix = /^(ທ້າວ|ນາງ|ນ\.|ທ\.|ດ\.ຊ\.|ດ\.ຍ\.)/i.test(first);
  const male = String(student.gender || '').toLowerCase().includes('ຊາຍ') || String(student.gender || '').toLowerCase() === 'male';
  return ((hasPrefix ? first : (male ? 'ທ້າວ ' : 'ນາງ ') + first) + ' ' + last).trim();
}

async function init() {
  if (!currentAccess) return;
  const source = document.getElementById('dataSourceText');
  if (legacyCanBrowse()) {
    if (source) source.textContent = 'ຄົ້ນຫາຂໍ້ມູນນັກຮຽນຕາມສິດທີ່ໄດ້ຮັບ';
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
  const res = await callAPI('getAccessibleRooms', {});
  if (!res || res.error || !Array.isArray(res.rooms)) { document.getElementById('searchList').innerHTML = '<div class="empty">ບໍ່ສາມາດໂຫຼດຫ້ອງຮຽນໄດ້</div>'; return; }
  legacyRooms = res.rooms.filter(Boolean);
  const select = document.getElementById('legacyRoomSelect');
  if (select) {
    select.replaceChildren();
    legacyRooms.forEach(function(room) { const option = document.createElement('option'); option.value = room; option.textContent = room; select.append(option); });
    document.getElementById('secureRoomChooser').style.display = legacyRooms.length > 1 ? 'block' : 'none';
  }
  if (!legacyRooms.length) document.getElementById('searchList').innerHTML = '<div class="empty">ຍັງບໍ່ມີຫ້ອງຮຽນທີ່ອະນຸຍາດ</div>';
  else renderSearch();
}

function legacySelectedRoom() { const select = document.getElementById('legacyRoomSelect'); return select && select.value ? select.value : (legacyRooms[0] || ''); }

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
    list.innerHTML = '<div class="empty">ກຳລັງໂຫຼດລາຍຊື່ທັງໝົດໃນຫ້ອງ…</div>';
    const res = await callAPI('getRosterDirectory', { room: room });
    if (!res || res.error) { list.innerHTML = '<div class="empty">ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໄດ້</div>'; return; }
    fullRosterCache[room] = res.students || [];
  }

  const students = fullRosterCache[room];
  
  // ກັ່ນຕອງຂໍ້ມູນໃນ Browser ທັນທີ (Smart Search)
  const searchKey = (val) => String(val || '').toLowerCase().replace(/[\s\.,\-_/()]+/g, '');
  const nQ = searchKey(nameQuery), iQ = searchKey(idQuery), pQ = searchKey(parentQuery);
  
  const filtered = students.filter(s => {
    return (!nQ || searchKey(s.firstName + ' ' + s.lastName).indexOf(nQ) >= 0) &&
           (!iQ || searchKey(s.studentId).indexOf(iQ) >= 0) &&
           (!pQ || searchKey(s.father + ' ' + s.mother).indexOf(pQ) >= 0);
  });

  document.getElementById('roomCountSearch').textContent = filtered.length ? '1' : '0';
  document.getElementById('studentCountSearch').textContent = filtered.length;

  if (!filtered.length) {
    list.innerHTML = '<div class="empty">ບໍ່ພົບຂໍ້ມູນ</div>';
    return;
  }

  list.innerHTML = filtered.map(function(student) {
    const male = String(student.gender || '').toLowerCase().includes('ຊາຍ') || String(student.gender || '').toLowerCase() === 'male';
    return '<div class="card" onclick="showDetail(\'' + legacyEscape(student.ref) + '\')"><div class="gender-badge ' + (male ? 'boy' : 'girl') + '">' + (male ? '♂' : '♀') + '</div><div style="flex:1;"><div class="card-name">' + legacyEscape(legacyDisplayName(student)) + '</div><div class="card-meta">' + legacyEscape(student.room) + ' · ' + legacyEscape(student.studentId || '-') + '</div></div><button class="dl-btn small" onclick="event.stopPropagation();showDetail(\'' + legacyEscape(student.ref) + '\')">📘</button></div>';
  }).join('');
}

async function renderRooms() {
  const list = document.getElementById('roomsList'); list.innerHTML = '<div class="empty">ກຳລັງໂຫຼດຫ້ອງ…</div>';
  const results = await Promise.all(legacyRooms.map(async function(room) { return [room, await callAPI('getRosterDirectory', { room: room, nameQuery: '', idQuery: '', parentQuery: '' })]; }));
  list.innerHTML = results.map(function(pair) {
    const room = pair[0], res = pair[1], total = res && !res.error ? (res.totalInRoom || 0) : 0;
    return '<div class="room-card" onclick="showRoomScores(\'' + legacyEscape(room) + '\')"><div class="room-top"><div class="room-name">ຫ້ອງ ' + legacyEscape(room) + '</div><div style="display:flex;gap:5px;"><button class="dl-btn small" onclick="event.stopPropagation(); showRoomScores(\'' + legacyEscape(room) + '\')">👥</button><button class="dl-btn small" style="background:#167c45;" onclick="event.stopPropagation(); showClassScores(\'' + legacyEscape(room) + '\')">📊</button></div></div><div class="room-stats"><div class="stat-item"><span class="dot total"></span>ທັງໝົດ <span class="stat-num">' + total + '</span></div></div></div>';
  }).join('');
}

function showRoomScores(room) {
  const select = document.getElementById('legacyRoomSelect'); if (select) select.value = room;
  switchTab('search'); renderSearch(true);
}

async function showDetail(ref) {
  const overlay = document.getElementById('detailOverlay');
  overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ກຳລັງໂຫຼດປຶ້ມຕິດຕາມ…</div><button class="close-btn" onclick="closeDetail()">✕</button></div></div></div>';
  const report = await callAPI('getRosterStudentReport', { ref: ref });
  if (!report || report.error) { overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ປຶ້ມຕິດຕາມ</div><button class="close-btn" onclick="closeDetail()">✕</button></div><div class="empty">ບໍ່ສາມາດເປີດປຶ້ມຕິດຕາມ: ' + legacyEscape(report && report.error) + '</div></div></div>'; return; }
  legacySelectedReport = report; legacyRenderReport(report, overlay);
}

async function legacyShowMyReport() {
  const overlay = document.getElementById('detailOverlay');
  overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ກຳລັງໂຫຼດປຶ້ມຕິດຕາມ…</div></div></div></div>';
  const report = await callAPI('getMyReport', {});
  if (!report || report.error) { overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-name">ບໍ່ພົບປຶ້ມຕິດຕາມ: ' + legacyEscape(report && report.error) + '</div></div></div>'; return; }
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
    const res = await callAPI('updateReportScore', { ref: report.ref, subjectIndex: Number(input.dataset.subject), columnIndex: Number(input.dataset.column), value: input.value.trim() });
    if (!res || res.error) return alert('ບັນທຶກບໍ່ສຳເລັດ: ' + (res && res.error ? res.error : 'ERROR'));
    input.dataset.original = input.value.trim();
  }
  alert('ບັນທຶກຄະແນນສຳເລັດ');
}

function downloadExcel() { const table = document.getElementById('scoreTable'); if (!table || !window.XLSX) return; const workbook = XLSX.utils.table_to_book(table); XLSX.writeFile(workbook, 'ປຶ້ມຕິດຕາມ.xlsx'); }
function openSettings() { return; }
function closeSettings() { return; }
function applyRoleRestrictions() { return; }
async function loadConfig() { return; }
async function fetchRosterFromSheet() { return; }
async function submitAccessRequest(name, room) { return callAPI('requestAccess', { name: name, room: room }); }
function doAccessRequest() { const name = (document.getElementById('nameReqInput') || {}).value || ''; const room = (document.getElementById('roomReqInput') || {}).value || ''; if (!name.trim() || !room.trim()) return alert('ກະລຸນາໃສ່ຊື່–ນາມສະກຸນ ແລະ ຫ້ອງ'); submitAccessRequest(name.trim(), room.trim()).then(function(res) { if (res && !res.error) { showPendingApprovalState(); startPollingApprovalStatus(); } else alert('ສົ່ງຄຳຂໍບໍ່ສຳເລັດ: ' + (res && res.error ? res.error : 'ERROR')); }); }
