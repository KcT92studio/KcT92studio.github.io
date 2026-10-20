let studentMonthsCache = [];
let studentProfileCache = null;
let studentClassMonthCache = Object.create(null);
let studentCurrentMonth = '';
function monthlyEsc(value){const e=document.createElement('div');e.textContent=value==null?'':String(value);return e.innerHTML;}
function monthlyClose(){const modal=document.getElementById('studentMonthlyModal');if(modal)modal.remove();}
function monthlyModal(content){monthlyClose();const wrap=document.createElement('div');wrap.id='studentMonthlyModal';wrap.className='student-modal';wrap.innerHTML='<div class="student-modal-card"><button class="student-modal-close" onclick="monthlyClose()">×</button>'+content+'</div>';wrap.addEventListener('click',function(event){if(event.target===wrap)monthlyClose();});document.body.appendChild(wrap);}


function studentInjectStyle(){
  if(document.getElementById('studentPortalStyle'))return;
  const st=document.createElement('style');st.id='studentPortalStyle';
  st.textContent=''
  +'body.student-mode{overflow:hidden !important;}'
  +'#studentMonthlyModal{z-index:2147483000 !important;}'
  /* ໜ້າເຕັມຈໍ ບັງສ່ວນຫົວເວັບທັງໝົດ */
  +'.student-portal{position:fixed !important;top:0;left:0;right:0;bottom:0;z-index:40;display:flex;flex-direction:column;overflow:hidden;padding:0 !important;margin:0 !important;max-width:none !important;width:auto !important;box-sizing:border-box;}'
  +'.student-portal .student-top{flex:0 0 auto;padding:calc(6px + env(safe-area-inset-top,0px)) 12px 0;box-sizing:border-box;}'
  +'.student-portal .student-head h1{font-size:1.35rem !important;line-height:1.25 !important;margin:0 0 6px !important;}'
  +'.student-portal .student-actions{display:flex;gap:6px !important;margin:0 0 6px !important;flex-wrap:nowrap;}'
  +'.student-portal .student-action{flex:1 1 0;font-size:0.82rem !important;padding:6px 8px !important;min-height:0 !important;border-radius:14px !important;white-space:nowrap;}'
  +'.student-portal .student-month-title{font-size:0.9rem !important;margin:4px 0 4px !important;line-height:1.2 !important;}'
  /* ແຖບເດືອນ + ປຸ່ມລູກສອນຍ້ອນກັບ */
  +'.student-portal .student-bar{display:flex;align-items:center;gap:8px;padding:2px 0 6px;}'
  +'.student-portal .student-back{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,.15);background:#fff;font-size:1.15rem;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;}'
  +'.student-portal #studentMonthCards{flex:1 1 auto;min-width:0;margin:0 !important;padding:0 !important;display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;}'
  +'.student-portal .month-card{flex:0 0 auto;font-size:0.82rem !important;padding:5px 10px !important;min-height:0 !important;white-space:nowrap;}'
  /* ເລື່ອນຕາຕະລາງຂຶ້ນ: ເຊື່ອງຫົວຂໍ້ ແລະປຸ່ມ ເຫຼືອແຕ່ ← ແລະເດືອນ */
  +'.student-portal.compact .student-head{display:none;}'
  +'.student-portal.compact .student-top{padding-top:calc(4px + env(safe-area-inset-top,0px));}'
  /* ຕາຕະລາງ style-04: ເຕັມຊ້າຍ-ຂວາ-ລຸ່ມ */
  +'.student-portal #studentMonthTable{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;width:100%;padding:0;margin:0;box-sizing:border-box;}'
  +'.student-portal .class-report-a4-landscape{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;max-width:none;width:100%;padding:0 !important;margin:0 !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;background:#fff;box-sizing:border-box;}'
  +'.student-portal .report-table-wrap{flex:1 1 auto;min-height:0;width:100%;overflow:auto;-webkit-overflow-scrolling:touch;padding:0 !important;margin:0 !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;background:#fff !important;max-height:none;box-sizing:border-box;}'
  +'.student-portal .class-scores-table{margin:0 !important;width:max-content !important;min-width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;}'
  /* ຄໍລຳຊື່ໃຫ້ແຄບລົງ ແຕ່ຫ້າມຕັດຊື່ເປັນສອງແຖວ */
  +'.student-portal .class-scores-table th:first-child,.student-portal .class-scores-table td:first-child{width:130px !important;min-width:130px !important;max-width:130px !important;white-space:nowrap;overflow:hidden;text-overflow:clip;}'
  /* ຄໍລຳ GD, TB ແລະຄໍລຳຄະແນນອື່ນໆໃຫ້ແຄບ */
  +'.student-portal .class-scores-table thead th:nth-child(n+2){writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;text-align:center;vertical-align:middle;width:34px !important;min-width:34px !important;max-width:34px !important;font-size:10px;font-weight:800;padding:4px 3px 6px;}'
  +'.student-portal .class-scores-table tbody td:nth-child(n+2){width:34px !important;min-width:34px !important;max-width:34px !important;white-space:nowrap;text-align:center;padding-left:3px;padding-right:3px;font-size:12px;}'
  /* ຫົວຕາຕະລາງຕິດຂອບເທິງຂອງພື້ນທີ່ເລື່ອນ ແລະບໍ່ເຫຼືອຊ່ອງວ່າງ */
  +'.student-portal .report-table-wrap{position:relative;align-self:stretch;overflow:auto;scroll-padding-top:0;padding-top:0 !important;}'
  +'.student-portal .class-scores-table thead th{height:auto;padding-bottom:4px;position:sticky;top:0;z-index:3;background:#f0f4f7;box-shadow:inset 0 -1px 0 #333,inset -1px 0 0 #333;}'
  +'.student-portal .class-scores-table thead th:first-child{position:sticky;left:0;top:0;z-index:6;background:#f0f4f7;}'
  +'.student-portal .class-scores-table th:first-child,.student-portal .class-scores-table td:first-child{text-align:left;padding-left:6px;font-size:12px;font-weight:600;}'
  +'.student-portal .student-action.absent-action{background:#fff7ed !important;border-color:#f59e0b !important;color:#9a3412 !important;}'
  +'.student-portal .student-action.absent-action:active{transform:scale(.97);}'
  +'.student-portal .student-loading{padding:12px 16px;color:#5a6b7a;font-size:14px;}';
  document.head.appendChild(st);
}
function studentGoBack(){
  const items=document.querySelectorAll('a,button');
  for(let i=0;i<items.length;i++){
    const el=items[i];
    if(el.closest('.student-portal'))continue;
    if((el.textContent||'').indexOf('ກັບຄືນ')>-1){el.click();return;}
  }
  if(history.length>1)history.back();
}
function studentFitTable(){
  const portal=document.querySelector('.student-portal');if(!portal)return;
  const wrap=portal.querySelector('.report-table-wrap');if(!wrap)return;
  portal.classList.remove('compact');wrap.scrollTop=0;
  wrap.onscroll=function(){
    const y=wrap.scrollTop;
    if(y>24&&!portal.classList.contains('compact'))portal.classList.add('compact');
    else if(y<=2&&portal.classList.contains('compact'))portal.classList.remove('compact');
  };
}

function onLoginSuccessFromAuth(access) {
  currentAccess = access;
  const badge = document.getElementById('userBadge');
  if (badge) badge.textContent = '👤 ' + (access.role || '') + (access.room ? ' | ຫ້ອງ ' + access.room : '');
  if (typeof loadNews === 'function') loadNews();
  if (typeof loadApps === 'function') loadApps();
  if (typeof loadBooks === 'function') loadBooks();
  updateHeaderAuthUI(true, currentUser ? currentUser.name : access.role);
  if (String(access.role || '').toLowerCase() === 'student') studentMonthlyInit();
  else init();
}
function logoutUser(){
  try{localStorage.removeItem('kct_id_token');localStorage.removeItem('kct_role');}catch(e){}
  currentIdToken=null; currentUser=null; currentAccess=null;
  const portal=document.getElementById('teacherScorePortal');if(portal)portal.remove();
  const main=document.getElementById('mainApp');if(main){main.innerHTML='';main.style.display='none';}
  const gate=document.getElementById('loginGate');if(gate)gate.style.display='block';
  const loginStep=document.getElementById('loginStep');if(loginStep)loginStep.style.display='block';
  ['requestStep','pendingStep'].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display='none';});
  document.body.classList.remove('student-mode');
  document.body.style.overflow='';
  document.documentElement.style.overflow='';
  if(typeof updateHeaderAuthUI==='function')updateHeaderAuthUI(false,'');
  if(typeof closeApp==='function')closeApp(true);
  window.scrollTo(0,0);
}

async function studentMonthlyInit(){
  const main = document.getElementById('mainApp');
  if (!main) return;
  main.style.display='block';
  studentInjectStyle();document.body.classList.add('student-mode');
  main.innerHTML='<main class="student-portal"><div class="student-top"><div class="student-head"><h1>ຄະແນນຂອງຂ້ອຍ</h1><div class="student-actions"><button class="student-action" onclick="studentShowProfile()">👤 ຂໍ້ມູນຂອງຂ້ອຍ</button><button class="student-action absent-action" onclick="studentShowAbsentScores()">⚠️ ຄະແນນບໍ່ໄດ້ເສັງ</button></div><h3 class="student-month-title">ເລືອກເດືອນ</h3></div><div class="student-bar"><button class="student-back" onclick="studentGoBack()" aria-label="ກັບຄືນ">←</button><div id="studentMonthCards" class="month-cards"><span>ກຳລັງໂຫຼດ…</span></div></div></div><div id="studentMonthTable"></div></main>';
  (function(){const c=getComputedStyle(document.body).backgroundColor;const bg=(!c||c==='rgba(0, 0, 0, 0)'||c==='transparent')?'#faf5ea':c;const m=main.querySelector('.student-portal');if(m)m.style.background=bg;})();
  const [monthsRes, profileRes] = await Promise.all([callAPI('getMyMonths',{}), callAPI('getMyStudentProfile',{})]);
  if (!monthsRes || monthsRes.error) { document.getElementById('studentMonthCards').innerHTML='<span>ບໍ່ພົບຂໍ້ມູນເດືອນ</span>'; return; }
  studentMonthsCache = monthsRes.months || [];
  studentProfileCache = profileRes && profileRes.student ? profileRes.student : {name:(currentUser||{}).name||'',room:(currentAccess||{}).room||''};
  document.getElementById('studentMonthCards').innerHTML=studentMonthsCache.map(function(month){return '<button class="month-card" onclick="studentOpenMonth(\''+monthlyEsc(month)+'\')">📅 '+monthlyEsc(month)+'</button>';}).join('');
  if (studentMonthsCache.length) studentOpenMonth(studentMonthsCache[0]);
}
async function studentOpenMonth(month){ return studentOpenMonthWith(month, function(m){ return callAPI('getMyClassMonth',{month:m}); }); }
async function studentOpenMonthWith(month, fetcher){
  studentCurrentMonth=month;
  document.querySelectorAll('.month-card').forEach(function(button){button.classList.toggle('active',button.textContent.trim().endsWith(month));});
  const host=document.getElementById('studentMonthTable');host.innerHTML='<div class="student-loading">ກຳລັງໂຫຼດ '+monthlyEsc(month)+'…</div>';
  const res=studentClassMonthCache[month]||await fetcher(month);
  if(res&&!res.error)studentClassMonthCache[month]=res;
  if(!res||res.error){host.innerHTML='<div class="student-loading">ບໍ່ສາມາດເປີດຕາຕະລາງໄດ້</div>';return;}
  /* ເຊື່ອງ GD, TB ແລະຄໍລຳຊັ້ນຮຽນຈາກສ່ວນສະແດງ ໂດຍບໍ່ປ່ຽນຂໍ້ມູນຕົ້ນສະບັບ */
  const rawHeader=res.header||[];
  const hiddenCols=[];
  rawHeader.forEach(function(cell,i){
    const label=String(cell==null?'':cell).trim().toLowerCase().replace(/\\s+/g,'');
    if(label==='gd'||label==='tb'||label.indexOf('ຊັ້ນຮຽນ')!==-1||label.indexOf('ຫ້ອງຮຽນ')!==-1)hiddenCols.push(i);
  });
  /* ຖ້າຫົວຕາຕະລາງບໍ່ມີຊື່ຄໍລຳທີ່ກວດພົບ ໃຊ້ລຳດັບເກົ່າເປັນຕົວສຳຮອງ */
  if(!hiddenCols.length&&rawHeader.length>4)hiddenCols.push(1,2,3);
  const dropCols=function(r){r=r||[];return r.filter(function(_,i){return hiddenCols.indexOf(i)===-1;});};
  const head=dropCols(rawHeader).map(function(cell){return '<th>'+monthlyEsc(cell)+'</th>';}).join('');
  const rows=(res.rows||[]).map(function(row){return '<tr>'+dropCols(row).map(function(cell){return '<td>'+monthlyEsc(cell)+'</td>';}).join('')+'</tr>';}).join('');
  host.innerHTML='<div class="class-report-a4-landscape"><div class="report-table-wrap"><table class="report-table class-scores-table"><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  studentFitTable();
}
function studentShowProfile(){
  const s=studentProfileCache||{};
  monthlyModal('<h2 style="margin-top:0;">👤 ຂໍ້ມູນຂອງຂ້ອຍ</h2><div class="student-info"><p><b>ຊື່:</b> '+monthlyEsc(s.name || ((s.firstName||'')+' '+(s.lastName||'')))+'</p><p><b>ຫ້ອງ:</b> '+monthlyEsc(s.room)+'</p><p><b>ເພດ:</b> '+monthlyEsc(s.gender)+'</p><p><b>ວັນເກີດ:</b> '+monthlyEsc(s.dob)+'</p><p><b>ພໍ່:</b> '+monthlyEsc(s.father)+'</p><p><b>ແມ່:</b> '+monthlyEsc(s.mother)+'</p><p><b>ເບີໂທ:</b> '+monthlyEsc(s.phone)+'</p><p><b>ທີ່ຢູ່:</b> '+monthlyEsc(s.address)+'</p></div>');
}
function studentAbsentValue(value){
  const v=String(value==null?'':value).trim().toLowerCase().replace(/\s+/g,'');
  if(!v)return true;
  return v==='ບໍ່ໄດ້ເສັງ'||v==='ບໍ່ເສັງ'||v==='ບໍ່ໄດ້ສອບ'||v==='ບໍ່ສອບ'||v==='absent'||v==='ຂາດ'||v==='ຂາດສອບ'||v==='ບໍ່ມີຄະແນນ'||v==='-';
}
function studentRowKey(value){
  return String(value==null?'':value).trim().toLowerCase()
    .replace(/^\s*(ທ້າວ|ນາງ|ເດັກຊາຍ|ເດັກຍິງ|ນ\.|ທ\.|ດ\.ຊ\.|ດ\.ຍ\.)\s*/,'')
    .replace(/[\u0EC8-\u0ECC\s\u200B-\u200D\uFEFF.,\-_\/()]+/g,'')
    .replace(/ຫຼ/g,'ຫລ');
}
function studentFindOwnRow(result){
  const profile=studentProfileCache||{};
  const candidates=[profile.name,((profile.firstName||'')+' '+(profile.lastName||'')),currentUser&&currentUser.name,profile.studentId,currentUser&&currentUser.studentId].map(studentRowKey).filter(Boolean);
  const rows=result&&result.rows||[];
  return rows.find(function(row){
    const first=studentRowKey(row&&row[0]);
    return first && candidates.some(function(key){return first===key||first.indexOf(key)>=0||key.indexOf(first)>=0;});
  });
}
async function studentShowAbsentScores(){
  const month=studentCurrentMonth||(studentMonthsCache||[])[0];
  if(!month){monthlyModal('<div class="student-no-download">ບໍ່ພົບເດືອນຄະແນນ</div>');return;}
  let res=studentClassMonthCache[month];
  if(!res){monthlyModal('<div class="student-no-download">ກຳລັງອ່ານແຖວຄະແນນ M2…</div>');res=await callAPI('getMyClassMonth',{month:month});if(res&&!res.error)studentClassMonthCache[month]=res;}
  const row=studentFindOwnRow(res);
  if(!res||res.error||!row){monthlyModal('<h2 style="margin-top:0;">⚠️ ຄະແນນບໍ່ໄດ້ເສັງ</h2><div class="student-no-download">ບໍ່ພົບແຖວຊື່ຂອງນັກຮຽນໃນຕາຕະລາງ M2</div>');return;}
    const rawHeader=res.header||[], hidden=[];
    rawHeader.forEach(function(cell,i){
      const label=String(cell==null?'':cell).trim().toLowerCase().replace(/\s+/g,'');
      if(i===0||label==='gd'||label==='tb'||label.indexOf('ຊັ້ນຮຽນ')!==-1||label.indexOf('ຫ້ອງຮຽນ')!==-1)hidden.push(i);
    });
    const cells=[];
    rawHeader.forEach(function(header,i){
      if(hidden.indexOf(i)!==-1)return;
      const value=row[i]==null?'':row[i];
      if(studentAbsentValue(value))cells.push('<tr><th>'+monthlyEsc(header)+'</th><td class="absent-cell">'+monthlyEsc(value||'—')+'</td></tr>');
    });
    if(cells.length){
      monthlyModal('<h2 style="margin-top:0;">⚠️ ຄະແນນບໍ່ໄດ້ເສັງ</h2><p style="margin-top:-6px;color:#6b6259;font-size:13px;">ແຖວຂອງນັກຮຽນຈາກຕາຕະລາງ M2 ເດືອນ '+monthlyEsc(month)+'</p><div class="absent-month-section"><table class="student-sheet absent-score-table"><thead><tr><th>ວິຊາ</th><th>ສະຖານະ/ຄະແນນ</th></tr></thead><tbody>'+cells.join('')+'</tbody></table></div>');
      return;
    }
  monthlyModal('<h2 style="margin-top:0;">✅ ຄະແນນບໍ່ໄດ້ເສັງ</h2><div class="student-no-download">ເດືອນນີ້ບໍ່ພົບວິຊາທີ່ບໍ່ໄດ້ເສັງ</div>');
}
async function studentShowMyBook(){
  monthlyModal('<div class="student-no-download">ກຳລັງໂຫຼດປຶ້ມຕິດຕາມ…</div>');
  const res=await callAPI('getMyReport',{});if(!res||res.error){monthlyModal('<div class="student-no-download">ບໍ່ສາມາດເປີດປຶ້ມຕິດຕາມ: '+monthlyEsc(typeof legacyReportError==='function'?legacyReportError(res&&res.error):((res&&res.error)||'ERROR'))+'</div>');return;}
  const subjects=res.subjects||[], headers=subjects.map(function(item){return '<th>'+monthlyEsc(item.subject||'')+'</th>';}).join('');
  const rows=(res.columns||[]).map(function(month, index){return '<tr><th>'+monthlyEsc(month)+'</th>'+subjects.map(function(item){return '<td>'+monthlyEsc(item.scores&&item.scores[index]!=null?item.scores[index]:'')+'</td>';}).join('')+'</tr>';}).join('');
  monthlyModal('<h2 style="margin-top:0;">📘 ປຶ້ມຕິດຕາມຂອງຂ້ອຍ</h2><div class="student-sheet-wrap"><table class="student-sheet"><thead><tr><th>ເດືອນ</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div>');
}
function downloadPDF(filename){const element=document.getElementById('reportCardContent');if(!element||!window.html2pdf)return;html2pdf().set({margin:0.28,filename:(filename||'report')+'.pdf',html2canvas:{scale:2},pagebreak:{mode:['css','legacy'],avoid:['tr']},jsPDF:{unit:'in',format:'a4',orientation:'landscape'}}).from(element).save();}

/* =====================================================================
   ຄູ/Admin: "ເບິ່ງຄະແນນ ມ.x" — ໜ້າແບບດຽວກັບທີ່ນັກຮຽນເຫັນ (ເຕັມຈໍ, ເລືອກເດືອນ, ຕາຕະລາງຄະແນນຫ້ອງ)
   ຕ່າງກັນແຕ່: ມີປຸ່ມ 🔍 ຄົ້ນຫາ ຢູ່ມຸມຂວາເທິງ ເພື່ອກັບໄປໜ້າຄົ້ນຫານັກຮຽນ
   ===================================================================== */
let teacherScoreRoom = '';
function teacherScoreClose(popNav) {
  const el = document.getElementById('teacherScorePortal'); if (el) el.remove();
  if (el && popNav === true) kctNavPop_(1);
  document.body.classList.remove('student-mode');
  const t = document.getElementById('tabSearch'), r = document.getElementById('tabRooms');
  if (t) t.classList.add('active'); if (r) r.classList.remove('active');
}
/* ລູກສອນ ← ໃນໜ້າຄະແນນຫ້ອງ: ຖອຍກັບໜ້າຄົ້ນຫາ (ໜ້າກ່ອນໜ້າ) ບໍ່ອອກຈາກລະບົບ */
function teacherScoreBack() { teacherScoreClose(true); switchTab('search'); }
function teacherScoreFocusSearch() { teacherScoreClose(true); switchTab('search'); const n = document.getElementById('nameInput'); if (n) setTimeout(function () { try { n.focus(); } catch (e) {} }, 50); }
async function teacherScoreOpen(room) {
  room = room || teacherScoreRoom || (legacyRooms && legacyRooms[0]) || (currentAccess && currentAccess.room) || '';
  if (!room) return alert('ຍັງບໍ່ມີຫ້ອງຮຽນທີ່ອະນຸຍາດ');
  teacherScoreRoom = room;
  const host = document.getElementById('appSection'); if (!host) return;
  studentInjectStyle();
  const hadPortal = !!document.getElementById('teacherScorePortal');
  teacherScoreClose();
  document.body.classList.add('student-mode');
  const multi = legacyRooms && legacyRooms.length > 1;
  const roomSelect = multi ? '<select id="teacherScoreRoomSel" onchange="teacherScoreOpen(this.value)" style="margin:0 0 6px;padding:5px 8px;border-radius:12px;border:1px solid #D8CEBB;font-family:inherit;font-size:.85rem;max-width:100%;">' + legacyRooms.map(function (r) { return '<option value="' + monthlyEsc(r) + '"' + (r === room ? ' selected' : '') + '>ຫ້ອງ ' + monthlyEsc(r) + '</option>'; }).join('') + '</select>' : '';
  const portal = document.createElement('main');
  portal.id = 'teacherScorePortal'; portal.className = 'student-portal';
  portal.innerHTML = '<div class="student-top"><div class="student-head"><h1>📊 ເບິ່ງຄະແນນ ' + monthlyEsc(room) + '</h1>' + roomSelect + '<h3 class="student-month-title">ເລືອກເດືອນ</h3></div>'
    + '<div class="student-bar"><button class="student-back" onclick="teacherScoreBack()" aria-label="ກັບຄືນໜ້າຄົ້ນຫາ">←</button><div id="studentMonthCards" class="month-cards"><span class="student-loading" style="padding:0">ກຳລັງໂຫຼດ…</span></div>'
    + '<button class="teacher-search-btn" onclick="teacherScoreFocusSearch()" aria-label="ຄົ້ນຫານັກຮຽນ">🔍 ຄົ້ນຫາ</button></div></div><div id="studentMonthTable"></div>';
  const c = getComputedStyle(document.body).backgroundColor;
  portal.style.background = (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') ? '#faf5ea' : c;
  host.appendChild(portal);
  if (!hadPortal) kctNavPush_();
  const tr = document.getElementById('tabRooms'), ts = document.getElementById('tabSearch');
  if (tr) tr.classList.add('active'); if (ts) ts.classList.remove('active');
  document.getElementById('studentMonthTable').innerHTML = '<div class="student-loading">ກຳລັງໂຫຼດຄະແນນ…</div>';
  const monthsRes = await callAPI('getClassMonths', { room: room });
  const cards = document.getElementById('studentMonthCards'); if (!cards) return;
  if (!monthsRes || monthsRes.error || !(monthsRes.months || []).length) { cards.innerHTML = '<span>ບໍ່ພົບຂໍ້ມູນເດືອນ</span>'; document.getElementById('studentMonthTable').innerHTML = '<div class="student-loading">ບໍ່ພົບຂໍ້ມູນຄະແນນ</div>'; return; }
  const months = monthsRes.months;
  cards.innerHTML = months.map(function (m) { return '<button class="month-card" onclick="teacherOpenMonth(\'' + monthlyEsc(m) + '\')">📅 ' + monthlyEsc(m) + '</button>'; }).join('');
  teacherOpenMonth(months[0]);
}
function teacherOpenMonth(month) { const room = teacherScoreRoom; return studentOpenMonthWith(month, function (m) { return callAPI('getClassScores', { room: room, month: m }); }); }

/* ແທັບ "ເບິ່ງຄະແນນ": ຖ້າມີຫ້ອງດຽວ (ຄູປະຈຳຫ້ອງ) ເປີດຄະແນນເລີຍ; ຫຼາຍຫ້ອງ (Admin) ໃຫ້ເລືອກຫ້ອງກ່ອນ */
function kctScoreRoomsOfUser() { return (legacyRooms && legacyRooms.length) ? legacyRooms : ((currentAccess && currentAccess.room) ? [currentAccess.room] : []); }
function kctUpdateScoreTabLabel() {
  const tab = document.getElementById('tabRooms'); if (!tab) return;
  const rooms = kctScoreRoomsOfUser();
  tab.textContent = '📊 ເບິ່ງຄະແນນ' + (rooms.length === 1 ? ' ' + rooms[0] : '');
}
function switchTab(tab) {
  currentTab = tab;
  const portal = document.getElementById('teacherScorePortal'); if (portal && tab === 'search') teacherScoreClose(true);
  document.getElementById('tabSearch').classList.toggle('active', tab === 'search');
  document.getElementById('tabRooms').classList.toggle('active', tab === 'rooms');
  document.getElementById('searchPanel').style.display = tab === 'search' ? 'block' : 'none';
  document.getElementById('roomsPanel').style.display = tab === 'rooms' ? 'block' : 'none';
  if (tab === 'rooms') {
    const rooms = kctScoreRoomsOfUser();
    if (rooms.length === 1) { document.getElementById('roomsPanel').style.display = 'none'; document.getElementById('searchPanel').style.display = 'block'; teacherScoreOpen(rooms[0]); }
    else renderRooms();
  }
}
