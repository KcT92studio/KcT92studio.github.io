let studentMonthsCache = [];
let studentProfileCache = null;
function monthlyEsc(value){const e=document.createElement('div');e.textContent=value==null?'':String(value);return e.innerHTML;}
function monthlyClose(){const modal=document.getElementById('studentMonthlyModal');if(modal)modal.remove();}
function monthlyModal(content){monthlyClose();const wrap=document.createElement('div');wrap.id='studentMonthlyModal';wrap.className='student-modal';wrap.innerHTML='<div class="student-modal-card"><button class="student-modal-close" onclick="monthlyClose()">×</button>'+content+'</div>';wrap.addEventListener('click',function(event){if(event.target===wrap)monthlyClose();});document.body.appendChild(wrap);}

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
  main.innerHTML='<main class="student-portal"><div class="eyebrow">ລະບົບນັກຮຽນ</div><h1>ຄະແນນ ແລະ ປຶ້ມຕິດຕາມ</h1><p class="lead">ເບິ່ງຂໍ້ມູນສ່ວນຕົວ ແລະ ຕາຕະລາງຄະແນນປະຈຳເດືອນຂອງຫ້ອງ ' + monthlyEsc(currentAccess.room || '') + '</p><div class="student-actions"><button class="student-action" onclick="studentShowProfile()">👤 ຂໍ້ມູນຂອງຂ້ອຍ</button><button class="student-action" onclick="studentShowMyBook()">📘 ປຶ້ມຕິດຕາມຂອງຂ້ອຍ</button></div><div class="student-no-download">🔒 ໜ້ານີ້ເບິ່ງໄດ້ຢ່າງດຽວ — ບໍ່ມີການແກ້ໄຂ ຫຼື ດາວໂຫຼດຄະແນນຫ້ອງ</div><h3 style="margin:20px 0 4px;">ເລືອກເດືອນ</h3><div id="studentMonthCards" class="month-cards"><span>ກຳລັງໂຫຼດ…</span></div><div id="studentMonthTable"><div class="student-no-download">ເລືອກເດືອນເພື່ອເບິ່ງຕາຕະລາງຄະແນນທັງຫ້ອງ</div></div></main>';
  const [monthsRes, profileRes] = await Promise.all([callAPI('getMyMonths',{}), callAPI('getMyStudentProfile',{})]);
  if (!monthsRes || monthsRes.error) { document.getElementById('studentMonthCards').innerHTML='<span>ບໍ່ພົບຂໍ້ມູນເດືອນ</span>'; return; }
  studentMonthsCache = monthsRes.months || [];
  studentProfileCache = profileRes && profileRes.student ? profileRes.student : {name:(currentUser||{}).name||'',room:(currentAccess||{}).room||''};
  document.getElementById('studentMonthCards').innerHTML=studentMonthsCache.map(function(month){return '<button class="month-card" onclick="studentOpenMonth(\''+monthlyEsc(month)+'\')">📅 '+monthlyEsc(month)+'</button>';}).join('');
  if (studentMonthsCache.length) studentOpenMonth(studentMonthsCache[0]);
}
async function studentOpenMonth(month){
  document.querySelectorAll('.month-card').forEach(function(button){button.classList.toggle('active',button.textContent.trim().endsWith(month));});
  const host=document.getElementById('studentMonthTable');host.innerHTML='<div class="student-no-download">ກຳລັງໂຫຼດຕາຕະລາງ '+monthlyEsc(month)+'…</div>';
  const res=await callAPI('getMyClassMonth',{month:month});
  if(!res||res.error){host.innerHTML='<div class="student-no-download">ບໍ່ສາມາດເປີດຕາຕະລາງໄດ້</div>';return;}
  const title=(res.titleRows||[]).map(function(row){return '<p class="student-sheet-title">'+monthlyEsc(row.filter(Boolean).join(' '))+'</p>';}).join('');
  const head=(res.header||[]).map(function(cell){return '<th>'+monthlyEsc(cell)+'</th>';}).join('');
  const rows=(res.rows||[]).map(function(row){return '<tr>'+row.map(function(cell){return '<td>'+monthlyEsc(cell)+'</td>';}).join('')+'</tr>';}).join('');
  host.innerHTML='<div class="student-sheet-head">'+title+'<p>ຫ້ອງ '+monthlyEsc(res.room)+' — ເດືອນ '+monthlyEsc(res.month)+'</p></div><div class="student-sheet-wrap"><table class="student-sheet"><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
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
  monthlyModal('<h2 style="margin-top:0;">📘 ປຶ້ມຕິດຕາມຂອງຂ້ອຍ</h2><div class="student-sheet-wrap"><table class="student-sheet"><thead><tr><th>ເດືອນ</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div><div class="student-no-download">ເບິ່ງໄດ້ຢ່າງດຽວ — ບໍ່ມີປຸ່ມດາວໂຫຼດ ຫຼື ແກ້ໄຂ</div>');
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
