let studentMonthsCache = [];
let studentProfileCache = null;
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
  +'.student-portal .class-scores-table th:first-child,.student-portal .class-scores-table td:first-child{width:180px !important;min-width:180px !important;max-width:180px !important;white-space:nowrap;overflow:hidden;text-overflow:clip;}'
  /* ຄໍລຳ GD, TB ແລະຄໍລຳຄະແນນອື່ນໆໃຫ້ແຄບ */
  +'.student-portal .class-scores-table thead th:nth-child(n+2){writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;text-align:left;width:34px !important;min-width:34px !important;max-width:34px !important;font-size:8px;padding:3px 2px 4px;}'
  +'.student-portal .class-scores-table tbody td:nth-child(n+2){width:34px !important;min-width:34px !important;max-width:34px !important;white-space:nowrap;padding-left:3px;padding-right:3px;font-size:11px;}'
  /* ຫົວຕາຕະລາງຕິດຂອບເທິງຂອງພື້ນທີ່ເລື່ອນ ແລະບໍ່ເຫຼືອຊ່ອງວ່າງ */
  +'.student-portal .report-table-wrap{position:relative;align-self:stretch;overflow:auto;scroll-padding-top:0;padding-top:0 !important;}'
  +'.student-portal .class-scores-table thead th{height:auto;padding-bottom:4px;position:sticky;top:0;z-index:3;background:#f0f4f7;box-shadow:inset 0 -1px 0 #333,inset -1px 0 0 #333;}'
  +'.student-portal .class-scores-table thead th:first-child{position:sticky;left:0;top:0;z-index:6;background:#f0f4f7;}'
  +'.student-portal .class-scores-table th:first-child,.student-portal .class-scores-table td:first-child{text-align:left;padding-left:8px;}'
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
function logoutUser(){ try{localStorage.removeItem('kct_id_token');}catch(e){} location.reload(); }

async function studentMonthlyInit(){
  const main = document.getElementById('mainApp');
  if (!main) return;
  main.style.display='block';
  studentInjectStyle();document.body.classList.add('student-mode');
  main.innerHTML='<main class="student-portal"><div class="student-top"><div class="student-head"><h1>ຄະແນນ ແລະ ປຶ້ມຕິດຕາມ</h1><div class="student-actions"><button class="student-action" onclick="studentShowProfile()">👤 ຂໍ້ມູນຂອງຂ້ອຍ</button><button class="student-action" onclick="studentShowMyBook()">📘 ປຶ້ມຕິດຕາມຂອງຂ້ອຍ</button></div><h3 class="student-month-title">ເລືອກເດືອນ</h3></div><div class="student-bar"><button class="student-back" onclick="studentGoBack()" aria-label="ກັບຄືນ">←</button><div id="studentMonthCards" class="month-cards"><span>ກຳລັງໂຫຼດ…</span></div></div></div><div id="studentMonthTable"></div></main>';
  (function(){const c=getComputedStyle(document.body).backgroundColor;const bg=(!c||c==='rgba(0, 0, 0, 0)'||c==='transparent')?'#faf5ea':c;const m=main.querySelector('.student-portal');if(m)m.style.background=bg;})();
  const [monthsRes, profileRes] = await Promise.all([callAPI('getMyMonths',{}), callAPI('getMyStudentProfile',{})]);
  if (!monthsRes || monthsRes.error) { document.getElementById('studentMonthCards').innerHTML='<span>ບໍ່ພົບຂໍ້ມູນເດືອນ</span>'; return; }
  studentMonthsCache = monthsRes.months || [];
  studentProfileCache = profileRes && profileRes.student ? profileRes.student : {name:(currentUser||{}).name||'',room:(currentAccess||{}).room||''};
  document.getElementById('studentMonthCards').innerHTML=studentMonthsCache.map(function(month){return '<button class="month-card" onclick="studentOpenMonth(\''+monthlyEsc(month)+'\')">📅 '+monthlyEsc(month)+'</button>';}).join('');
  if (studentMonthsCache.length) studentOpenMonth(studentMonthsCache[0]);
}
async function studentOpenMonth(month){
  document.querySelectorAll('.month-card').forEach(function(button){button.classList.toggle('active',button.textContent.trim().endsWith(month));});
  const host=document.getElementById('studentMonthTable');host.innerHTML='<div class="student-loading">ກຳລັງໂຫຼດ '+monthlyEsc(month)+'…</div>';
  const res=await callAPI('getMyClassMonth',{month:month});
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
async function studentShowMyBook(){
  monthlyModal('<div class="student-no-download">ກຳລັງໂຫຼດປຶ້ມຕິດຕາມ…</div>');
  const res=await callAPI('getMyReport',{});if(!res||res.error){monthlyModal('<div class="student-no-download">ບໍ່ພົບປຶ້ມຕິດຕາມ</div>');return;}
  const subjects=res.subjects||[], headers=subjects.map(function(item){return '<th>'+monthlyEsc(item.subject||'')+'</th>';}).join('');
  const rows=(res.columns||[]).map(function(month, index){return '<tr><th>'+monthlyEsc(month)+'</th>'+subjects.map(function(item){return '<td>'+monthlyEsc(item.scores&&item.scores[index]!=null?item.scores[index]:'')+'</td>';}).join('')+'</tr>';}).join('');
  monthlyModal('<h2 style="margin-top:0;">📘 ປຶ້ມຕິດຕາມຂອງຂ້ອຍ</h2><div class="student-sheet-wrap"><table class="student-sheet"><thead><tr><th>ເດືອນ</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div>');
}
function downloadPDF(filename){const element=document.getElementById('reportCardContent');if(!element||!window.html2pdf)return;html2pdf().set({margin:0.28,filename:(filename||'report')+'.pdf',html2canvas:{scale:2},pagebreak:{mode:['css','legacy'],avoid:['tr']},jsPDF:{unit:'in',format:'a4',orientation:'landscape'}}).from(element).save();}

async function showClassScores(room) {
  const overlay = document.getElementById('detailOverlay');
  overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ກຳລັງໂຫຼດຄະແນນຫ້ອງ ' + legacyEscape(room) + '…</div><button class="close-btn" onclick="closeDetail()">✕</button></div></div></div>';
  
  const monthsRes = await callAPI('getClassMonths', { room: room });
  if (!monthsRes || monthsRes.error || !monthsRes.months || !monthsRes.months.length) {
    overlay.innerHTML = '<div class="detail-overlay"><div class="detail-card"><div class="detail-header"><div class="detail-name">📊 ຄະແນນຫ້ອງ ' + legacyEscape(room) + '</div><button class="close-btn" onclick="closeDetail()">✕</button></div><div class="empty">ບໍ່ພົບຂໍ້ມູນຄະແນນ</div></div></div>';
    return;
  }
  
  const months = monthsRes.months;
  const monthButtons = months.map(m => `<button class="month-card" onclick="loadClassMonthScores('${legacyEscape(room)}', '${legacyEscape(m)}')">📅 ${legacyEscape(m)}</button>`).join('');
  
  overlay.innerHTML = `
    <div class="detail-overlay" onclick="if(event.target===this)closeDetail()">
      <div class="detail-card class-score-fullscreen" style="width:100vw; max-width:100vw; height:95vh; max-height:95vh;">
        <div class="detail-header">
          <div class="detail-name">📊 ຄະແນນລວມຫ້ອງ ${legacyEscape(room)}</div>
          <button class="close-btn" onclick="closeDetail()">✕</button>
        </div>
        <div class="month-cards" style="margin-bottom:15px;">${monthButtons}</div>
        <div id="classMonthTableHost" class="report-table-wrap" style="overflow:auto; max-height:60vh;">
          <div class="empty">ເລືອກເດືອນເພື່ອເບິ່ງຄະແນນ</div>
        </div>
      </div>
    </div>
  `;
  
  if (months.length > 0) loadClassMonthScores(room, months[0]);
}

async function loadClassMonthScores(room, month) {
  const host = document.getElementById('classMonthTableHost');
  host.innerHTML = '<div class="empty">ກຳລັງໂຫຼດ…</div>';
  
  const res = await callAPI('getClassScores', { room: room, month: month });
  if (!res || res.error) { host.innerHTML = '<div class="empty">ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໄດ້</div>'; return; }
  
  const header = (res.header || []).map(h => `<th>${legacyEscape(h)}</th>`).join('');
  const rows = (res.rows || []).map(row => `<tr>${row.map(c => `<td>${legacyEscape(c)}</td>`).join('')}</tr>`).join('');
  
  host.innerHTML = `
    <div style="margin-bottom:10px; font-weight:800; color:var(--navy-950); display:flex; align-items:center; justify-content:space-between; gap:10px;"> <span>📅 ເດືອນ ${legacyEscape(month)}</span><button class="dl-btn" onclick="downloadClassPDF('${legacyEscape(room)}','${legacyEscape(month)}')">⬇ PDF</button></div>
    <div class="class-report-a4-landscape">
      <table class="report-table class-scores-table">
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function downloadClassPDF(room, month) {
  const element = document.querySelector('#classMonthTableHost .class-report-a4-landscape');
  if (!element || !window.html2pdf) return;
  html2pdf().set({margin:0.79, filename:'ຄະແນນຫ້ອງ_'+room+'_'+month+'.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2, useCORS:true}, pagebreak:{mode:['css','legacy'],avoid:['tr']}, jsPDF:{unit:'in',format:'a4',orientation:'landscape'}}).from(element).save();
}
