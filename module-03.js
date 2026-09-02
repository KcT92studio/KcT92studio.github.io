/* =====================================================================
   ຂ່າວສານ — ໃຊ້ Apps Script ຕົວດຽວກັນກັບລະບົບຄະແນນ (APPS_SCRIPT_URL, callAPI,
   currentAccess, currentUser, openApp — ທັງໝົດຖືກປະກາດໄວ້ແລ້ວຢູ່ script
   ຂອງ #appSection ດ້ານເທິງນີ້, ນຳມາໃຊ້ຊ້ຳໄດ້ເລີຍ ບໍ່ຕ້ອງລ໋ອກອິນຊ້ຳ)
   ===================================================================== */

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

let newsCache = {}; // id -> news item, so the edit form can pre-fill without re-fetching
let allNewsItems = [];
let newsExpanded = false;
const NEWS_PREVIEW_COUNT = 3;

async function loadNews(){
  const grid = document.getElementById('newsGrid');
  const toggleBtn = document.getElementById('newsToggleAllBtn');
  if (!grid) return;
  grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ກຳລັງໂຫຼດຂ່າວ...</p>';
  const res = await callAPI('getNews', {});
  if (!res || res.error){
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ຍັງບໍ່ໄດ້ຕໍ່ລະບົບຂ່າວ (ຕ້ອງເພີ່ມ getNews/addNews/deleteNews/updateNews ໃນ Apps Script ກ່ອນ)</p>';
    return;
  }
  allNewsItems = res.news || [];
  newsCache = {};
  allNewsItems.forEach(n => { newsCache[n.id] = n; });

  if (allNewsItems.length === 0){
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ຍັງບໍ່ມີຂ່າວ</p>';
    if (toggleBtn) toggleBtn.style.display = 'none';
    return;
  }

  renderNewsGrid();

  if (toggleBtn){
    toggleBtn.style.display = allNewsItems.length > NEWS_PREVIEW_COUNT ? 'inline-block' : 'none';
    toggleBtn.textContent = newsExpanded ? '← ຫຍໍ້ລົງ' : 'ເບິ່ງຂ່າວທັງໝົດ →';
  }
}

function renderNewsGrid(){
  const grid = document.getElementById('newsGrid');
  const items = newsExpanded ? allNewsItems : allNewsItems.slice(0, NEWS_PREVIEW_COUNT);
  grid.innerHTML = items.map(renderNewsCard).join('');
}

function toggleAllNews(){
  newsExpanded = !newsExpanded;
  renderNewsGrid();
  const toggleBtn = document.getElementById('newsToggleAllBtn');
  if (toggleBtn) toggleBtn.textContent = newsExpanded ? '← ຫຍໍ້ລົງ' : 'ເບິ່ງຂ່າວທັງໝົດ →';
}

function renderNewsCard(n){
  const canManage = currentAccess && ['admin','teacher'].includes((currentAccess.role || '').toLowerCase());
  return `
    <article class="news-card">
      <span class="news-date">${escapeHtml(n.date)}</span>
      <h3>${escapeHtml(n.title)}</h3>
      ${n.imageUrl ? `<img src="${escapeHtml(n.imageUrl)}" style="width:100%; border-radius:10px; margin:0.6rem 0;" alt="">` : ''}
      <p>${escapeHtml(n.body)}</p>
      ${n.pdfUrl ? `<a href="${escapeHtml(n.pdfUrl)}" target="_blank" style="margin-top:0.6rem;">📄 ໄຟລ໌ແນບ →</a>` : ''}
      ${canManage ? `<div style="margin-top:auto; padding-top:0.8rem; display:flex; gap:1rem;">
        <button onclick="editNewsItem('${escapeHtml(n.id)}')" style="background:none; border:none; color:var(--teal-700); font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">✏️ ແກ້ໄຂ</button>
        <button onclick="deleteNewsItem('${escapeHtml(n.id)}')" style="background:none; border:none; color:#a3402c; font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">🗑️ ລຶບ</button>
      </div>` : ''}
    </article>
  `;
}

let editingNewsId = null; // null = ກຳລັງລົງຂ່າວໃໝ່, ບໍ່ null = ກຳລັງແກ້ໄຂຂ່າວອັນນີ້

function editNewsItem(id){
  const n = newsCache[id];
  if (!n) return;
  editingNewsId = id;

  document.getElementById('newsTitleInput').value = n.title || '';
  document.getElementById('newsBodyInput').value = n.body || '';
  document.getElementById('newsPdfInput').value = n.pdfUrl || '';
  clearNewsImage(); // เริ่มฟอร์มโดยไม่มีไฟล์ใหม่ที่เลือกไว้ — รูปเดิมจะยังถูกเก็บไว้ถ้าไม่เลือกรูปใหม่

  if (n.imageUrl){
    document.getElementById('newsImagePreview').src = n.imageUrl;
    document.getElementById('newsImagePreviewWrap').style.display = 'block';
    document.getElementById('newsImageStatus').textContent = 'ຮູບເດີມ — ເລືອກຮູບໃໝ່ຖ້າຕ້ອງການປ່ຽນ';
  }

  document.getElementById('newsFormTitle').textContent = '✏️ ແກ້ໄຂຂ່າວ';
  document.getElementById('newsSubmitBtn').textContent = '💾 ບັນທຶກການແກ້ໄຂ';
  document.getElementById('newsFormPanel').style.display = 'block';
  document.getElementById('newsFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetNewsForm(){
  editingNewsId = null;
  document.getElementById('newsTitleInput').value = '';
  document.getElementById('newsBodyInput').value = '';
  document.getElementById('newsPdfInput').value = '';
  clearNewsImage();
  document.getElementById('newsFormTitle').textContent = '✏️ ລົງຂ່າວໃໝ່';
  document.getElementById('newsSubmitBtn').textContent = '📌 ລົງຂ່າວນີ້';
}

function toggleNewsForm(){
  if (!currentAccess){
    alert('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ (ປຸ່ມ "ເຂົ້າສູ່ລະບົບ" ດ້ານເທິງສຸດ)');
    openApp();
    return;
  }
  const role = (currentAccess.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'teacher'){
    alert('ບັນຊີນີ້ບໍ່ມີສິດລົງຂ່າວ (ສະເພາະຄູອາຈານ ຫຼື ແອດມິນເທົ່ານັ້ນ)');
    return;
  }
  resetNewsForm();
  const panel = document.getElementById('newsFormPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

let selectedNewsImageFile = null; // { filename, mimeType, base64 } — chosen via file picker, uploaded on submit

function previewNewsImage(event){
  const file = event.target.files[0];
  if (!file) return;

  const MAX_BYTES = 4 * 1024 * 1024; // 4MB — keeps upload fast & within Apps Script limits
  if (file.size > MAX_BYTES){
    alert('ຮູບໃຫຍ່ເກີນໄປ (ສູງສຸດ 4MB) ກະລຸນາເລືອກຮູບອື່ນ ຫຼື ຫຍໍ້ຂະໜາດກ່ອນ');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e){
    const dataUrl = e.target.result; // "data:image/png;base64,AAAA..."
    const base64 = dataUrl.split(',')[1];
    selectedNewsImageFile = { filename: file.name, mimeType: file.type, base64: base64 };

    document.getElementById('newsImagePreview').src = dataUrl;
    document.getElementById('newsImagePreviewWrap').style.display = 'block';
    document.getElementById('newsImageStatus').textContent = '';
  };
  reader.readAsDataURL(file);
}

function clearNewsImage(){
  selectedNewsImageFile = null;
  document.getElementById('newsImageFile').value = '';
  document.getElementById('newsImagePreviewWrap').style.display = 'none';
  document.getElementById('newsImageStatus').textContent = '';
}

async function submitNews(){
  const title = document.getElementById('newsTitleInput').value.trim();
  const body = document.getElementById('newsBodyInput').value.trim();
  const pdfUrl = document.getElementById('newsPdfInput').value.trim();
  if (!title || !body){ alert('ກະລຸນາໃສ່ຫົວຂໍ້ ແລະ ເນື້ອຫາຂ່າວ'); return; }

  // ຮູບ: ຖ້າເລືອກໃໝ່ ໃຫ້ອັບໂຫລດ; ຖ້າກຳລັງແກ້ໄຂ ແລະ ບໍ່ໄດ້ເລືອກໃໝ່ ໃຫ້ໃຊ້ຮູບເດີມຄືເກົ່າ
  let imageUrl = editingNewsId && newsCache[editingNewsId] ? (newsCache[editingNewsId].imageUrl || '') : '';

  if (selectedNewsImageFile){
    document.getElementById('newsImageStatus').textContent = '⏳ ກຳລັງອັບໂຫລດຮູບ...';
    const uploadRes = await callAPI('uploadImage', {
      email: currentUser.email,
      filename: selectedNewsImageFile.filename,
      mimeType: selectedNewsImageFile.mimeType,
      base64: selectedNewsImageFile.base64
    });
    if (!uploadRes || uploadRes.error){
      document.getElementById('newsImageStatus').textContent = '';
      alert('❌ ອັບໂຫລດຮູບບໍ່ສຳເລັດ: ' + (uploadRes && uploadRes.error ? uploadRes.error : 'ບໍ່ຮູ້ສາເຫດ'));
      return;
    }
    imageUrl = uploadRes.url;
    document.getElementById('newsImageStatus').textContent = '✅ ອັບໂຫລດຮູບສຳເລັດ';
  }

  const action = editingNewsId ? 'updateNews' : 'addNews';
  const payload = { email: currentUser.email, title, body, imageUrl, pdfUrl };
  if (editingNewsId) payload.id = editingNewsId;

  const res = await callAPI(action, payload);
  if (res && res.error){ alert('❌ ຜິດພາດ: ' + res.error); return; }

  resetNewsForm();
  document.getElementById('newsFormPanel').style.display = 'none';
  loadNews();
}

async function deleteNewsItem(id){
  if (!confirm('ຢືນຢັນລຶບຂ່າວນີ້?')) return;
  const res = await callAPI('deleteNews', { email: currentUser.email, id });
  if (res && res.error){ alert('❌ ຜິດພາດ: ' + res.error); return; }
  loadNews();
}

loadNews();

/* =====================================================================
   ແອັບພລິເຄຊັນ — ລະບົບເປີດ, ເພີ່ມ/ແກ້ໄຂ/ລຶບໄດ້ຕະຫຼອດ ຄືກັນກັບຂ່າວ
   ===================================================================== */

let appsCache = {};

async function loadApps(){
  const grid = document.getElementById('appsGrid');
  if (!grid) return;
  grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ກຳລັງໂຫຼດແອັບ...</p>';
  const res = await callAPI('getApps', {});
  if (!res || res.error){
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ຍັງບໍ່ໄດ້ຕໍ່ລະບົບແອັບ (ຕ້ອງເພີ່ມ getApps/addApp/updateApp/deleteApp ໃນ Apps Script ກ່ອນ)</p>';
    return;
  }
  const apps = res.apps || [];
  appsCache = {};
  apps.forEach(a => { appsCache[a.id] = a; });

  if (apps.length === 0){
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ຍັງບໍ່ມີແອັບ</p>';
    return;
  }
  // ใช้พื้นที่นี้แสดงเว็บตัวที่หนึ่งแทนการ์ดข่าว/แอป โดยเริ่มจากเมนูเลือกหมวดหมู่
  grid.innerHTML = '';
}

function renderAppCard(a, index){
  const canManage = currentAccess && (currentAccess.role || '').toLowerCase() === 'admin';
  const initial = (a.name || '?').trim().charAt(0).toUpperCase();
  if (index === 0) {
    const firstWebUrl = 'https://kct92studio.blogspot.com/';
    return `
      <article class="news-card first-web-card" style="align-items:flex-start;">
        <div style="display:flex; gap:0.8rem; align-items:center; margin-bottom:0.7rem;">
          <div style="width:52px; height:52px; border-radius:12px; background:var(--navy-950); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem; flex:0 0 auto;">${escapeHtml(initial)}</div>
          <h3 style="margin:0;">${escapeHtml(a.name)}</h3>
        </div>
        <div class="first-web-frame"><iframe src="${firstWebUrl}" title="ເວັບຕົວທີໜຶ່ງ" loading="lazy"></iframe></div>
        <a href="${firstWebUrl}" target="_blank" rel="noopener" style="display:inline-block; margin-top:0.8rem; padding:0.5rem 1.1rem; border-radius:8px; background:var(--navy-950); color:#fff; font-weight:800; font-size:0.82rem; text-decoration:none;">↗ ເປີດເຕັມໜ້າ</a>
        ${canManage ? `<div style="margin-top:0.8rem; display:flex; gap:1rem;"><button onclick="editAppItem('${escapeHtml(a.id)}')" style="background:none; border:none; color:var(--teal-700); font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">✏️ ແກ້ໄຂ</button><button onclick="deleteAppItem('${escapeHtml(a.id)}')" style="background:none; border:none; color:#a3402c; font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">🗑️ ລຶບ</button></div>` : ''}
      </article>
    `;
  }
  return `
    <article class="news-card" style="align-items:flex-start;">
      <div style="display:flex; gap:0.8rem; align-items:center; margin-bottom:0.7rem;">
        ${a.iconUrl
          ? `<img src="${escapeHtml(a.iconUrl)}" style="width:52px; height:52px; border-radius:12px; object-fit:cover; flex:0 0 auto;" alt="">`
          : `<div style="width:52px; height:52px; border-radius:12px; background:var(--navy-950); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem; flex:0 0 auto;">${escapeHtml(initial)}</div>`}
        <h3 style="margin:0;">${escapeHtml(a.name)}</h3>
      </div>
      <p>${escapeHtml(a.description)}</p>
      ${a.downloadUrl ? `<a href="${escapeHtml(a.downloadUrl)}" target="_blank" style="display:inline-block; margin-top:0.8rem; padding:0.5rem 1.1rem; border-radius:8px; background:var(--navy-950); color:#fff; font-weight:800; font-size:0.82rem; text-decoration:none;">⬇️ ດາວໂຫຼດ</a>` : ''}
      ${canManage ? `<div style="margin-top:0.8rem; display:flex; gap:1rem;">
        <button onclick="editAppItem('${escapeHtml(a.id)}')" style="background:none; border:none; color:var(--teal-700); font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">✏️ ແກ້ໄຂ</button>
        <button onclick="deleteAppItem('${escapeHtml(a.id)}')" style="background:none; border:none; color:#a3402c; font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">🗑️ ລຶບ</button>
      </div>` : ''}
    </article>
  `;
}

let editingAppId = null;
let selectedAppIconFile = null;

function previewAppIcon(event){
  const file = event.target.files[0];
  if (!file) return;
  const MAX_BYTES = 4 * 1024 * 1024; // ປັບໃຫ້ເທົ່າກັບ Apps Script 4MB
  if (file.size > MAX_BYTES){
    alert('ໄອຄອນໃຫຍ່ເກີນໄປ (ສູງສຸດ 4MB) ກະລຸນາເລືອກຮູບອື່ນ');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    const dataUrl = e.target.result;
    const base64 = dataUrl.split(',')[1];
    selectedAppIconFile = { filename: file.name, mimeType: file.type, base64: base64 };
    document.getElementById('appIconPreview').src = dataUrl;
    document.getElementById('appIconPreviewWrap').style.display = 'block';
    document.getElementById('appIconStatus').textContent = '';
  };
  reader.readAsDataURL(file);
}

function clearAppIcon(){
  selectedAppIconFile = null;
  document.getElementById('appIconFile').value = '';
  document.getElementById('appIconPreviewWrap').style.display = 'none';
  document.getElementById('appIconStatus').textContent = '';
}

function resetAppForm(){
  editingAppId = null;
  document.getElementById('appNameInput').value = '';
  document.getElementById('appDescInput').value = '';
  document.getElementById('appDownloadInput').value = '';
  clearAppIcon();
  document.getElementById('appFormTitle').textContent = '➕ ເພີ່ມແອັບໃໝ່';
  document.getElementById('appSubmitBtn').textContent = '➕ ເພີ່ມແອັບນີ້';
}

function toggleAppForm(){
  if (!currentAccess){
    alert('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ (ປຸ່ມ "ເຂົ້າສູ່ລະບົບ" ດ້ານເທິງສຸດ)');
    openApp();
    return;
  }
  const role = (currentAccess.role || '').toLowerCase();
  if (role !== 'admin'){
    alert('ບັນຊີນີ້ບໍ່ມີສິດເພີ່ມແອັບ (ສະເພາະແອດມິນເທົ່ານັ້ນ)');
    return;
  }
  resetAppForm();
  const panel = document.getElementById('appFormPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function editAppItem(id){
  const a = appsCache[id];
  if (!a) return;
  editingAppId = id;

  document.getElementById('appNameInput').value = a.name || '';
  document.getElementById('appDescInput').value = a.description || '';
  document.getElementById('appDownloadInput').value = a.downloadUrl || '';
  clearAppIcon();

  if (a.iconUrl){
    document.getElementById('appIconPreview').src = a.iconUrl;
    document.getElementById('appIconPreviewWrap').style.display = 'block';
    document.getElementById('appIconStatus').textContent = 'ໄອຄອນເດີມ — ເລືອກໃໝ່ຖ້າຕ້ອງການປ່ຽນ';
  }

  document.getElementById('appFormTitle').textContent = '✏️ ແກ້ໄຂແອັບ';
  document.getElementById('appSubmitBtn').textContent = '💾 ບັນທຶກການແກ້ໄຂ';
  document.getElementById('appFormPanel').style.display = 'block';
  document.getElementById('appFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function submitApp(){
  const name = document.getElementById('appNameInput').value.trim();
  const description = document.getElementById('appDescInput').value.trim();
  const downloadUrl = document.getElementById('appDownloadInput').value.trim();
  if (!name || !downloadUrl){ alert('ກະລຸນາໃສ່ຊື່ແອັບ ແລະ ລິ້ງດາວໂຫຼດ'); return; }

  let iconUrl = editingAppId && appsCache[editingAppId] ? (appsCache[editingAppId].iconUrl || '') : '';

  if (selectedAppIconFile){
    document.getElementById('appIconStatus').textContent = '⏳ ກຳລັງອັບໂຫລດໄອຄອນ...';
    const uploadRes = await callAPI('uploadImage', {
      email: currentUser.email,
      filename: selectedAppIconFile.filename,
      mimeType: selectedAppIconFile.mimeType,
      base64: selectedAppIconFile.base64
    });
    if (!uploadRes || uploadRes.error){
      document.getElementById('appIconStatus').textContent = '';
      alert('❌ ອັບໂຫລດໄອຄອນບໍ່ສຳເລັດ: ' + (uploadRes && uploadRes.error ? uploadRes.error : 'ບໍ່ຮູ້ສາເຫດ'));
      return;
    }
    iconUrl = uploadRes.url;
    document.getElementById('appIconStatus').textContent = '✅ ອັບໂຫລດໄອຄອນສຳເລັດ';
  }

  const action = editingAppId ? 'updateApp' : 'addApp';
  const payload = { email: currentUser.email, name, description, iconUrl, downloadUrl };
  if (editingAppId) payload.id = editingAppId;

  const res = await callAPI(action, payload);
  if (res && res.error){ alert('❌ ຜິດພາດ: ' + res.error); return; }

  resetAppForm();
  document.getElementById('appFormPanel').style.display = 'none';
  loadApps();
}

async function deleteAppItem(id){
  if (!confirm('ຢືນຢັນລຶບແອັບນີ້?')) return;
  const res = await callAPI('deleteApp', { email: currentUser.email, id });
  if (res && res.error){ alert('❌ ຜິດພາດ: ' + res.error); return; }
  loadApps();
}

loadApps();

/* =====================================================================
   ສື່ການຮຽນ (Books) — ຈັດຕາມຊັ້ນຮຽນ+ວິຊາ, ເພີ່ມ/ແກ້ໄຂ/ລຶບໄດ້ສະເພາະ Admin ເທົ່ານັ້ນ
   ===================================================================== */

let allBooksItems = [];
let booksCache = {};

async function loadBooks(){
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ກຳລັງໂຫຼດປື້ມ...</p>';
  const res = await callAPI('getBooks', {});
  if (!res || res.error){
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ຍັງບໍ່ໄດ້ຕໍ່ລະບົບສື່ການຮຽນ (ຕ້ອງເພີ່ມ getBooks/addBook/updateBook/deleteBook ໃນ Apps Script ກ່ອນ)</p>';
    return;
  }
  allBooksItems = res.books || [];
  booksCache = {};
  allBooksItems.forEach(b => { booksCache[b.id] = b; });
  renderBooksGrid();
}

function renderBooksGrid(){
  const grid = document.getElementById('booksGrid');
  const gradeFilter = document.getElementById('bookFilterGrade').value.trim().toLowerCase();
  const subjectFilter = document.getElementById('bookFilterSubject').value.trim().toLowerCase();

  let items = allBooksItems;
  if (gradeFilter) items = items.filter(b => (b.grade || '').toLowerCase().includes(gradeFilter));
  if (subjectFilter) items = items.filter(b => (b.subject || '').toLowerCase().includes(subjectFilter));

  if (items.length === 0){
    grid.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">ບໍ່ພົບປື້ມທີ່ຄົ້ນຫາ</p>';
    return;
  }
  grid.innerHTML = items.map(renderBookCard).join('');
}

function renderBookCard(b){
  const canManage = currentAccess && (currentAccess.role || '').toLowerCase() === 'admin';
  const gradeLabel = b.grade && b.grade.trim() ? escapeHtml(b.grade) : 'ທົ່ວໄປ';
  return `
    <article class="news-card" style="align-items:flex-start;">
      ${b.coverUrl
        ? `<img src="${escapeHtml(b.coverUrl)}" style="width:100%; aspect-ratio:3/4; object-fit:contain; background:#f4f2ec; border-radius:10px; margin-bottom:0.7rem; border:1px solid var(--line);" alt="">`
        : `<div style="width:100%; aspect-ratio:3/4; border-radius:10px; margin-bottom:0.7rem; background:var(--navy-950); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.4rem; text-align:center; padding:0.5rem;">${escapeHtml(b.title || '')}</div>`}
      <span class="news-date">${gradeLabel} · ${escapeHtml(b.subject)}</span>
      <h3>${escapeHtml(b.title)}</h3>
      ${b.pdfUrl ? `<div style="display:flex; gap:0.5rem; margin-top:0.6rem; flex-wrap:wrap;">
        <a href="${escapeHtml(b.pdfUrl)}" target="_blank" style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.5rem 0.9rem; border-radius:8px; background:var(--navy-950); color:#fff; font-weight:800; font-size:0.78rem; text-decoration:none;">👁️ ເປີດເບິ່ງ</a>
        <a href="${escapeHtml(b.pdfUrl)}" download target="_blank" style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.5rem 0.9rem; border-radius:8px; border:1px solid var(--navy-950); color:var(--navy-950); font-weight:800; font-size:0.78rem; text-decoration:none;">⬇️ ດາວໂຫຼດ</a>
      </div>` : ''}
      ${canManage ? `<div style="margin-top:0.8rem; display:flex; gap:1rem;">
        <button onclick="editBookItem('${escapeHtml(b.id)}')" style="background:none; border:none; color:var(--teal-700); font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">✏️ ແກ້ໄຂ</button>
        <button onclick="deleteBookItem('${escapeHtml(b.id)}')" style="background:none; border:none; color:#a3402c; font-size:0.82rem; font-weight:800; cursor:pointer; padding:0;">🗑️ ລຶບ</button>
      </div>` : ''}
    </article>
  `;
}

let editingBookId = null;
let selectedBookCoverFile = null;

function previewBookCover(event){
  const file = event.target.files[0];
  if (!file) return;
  const MAX_BYTES = 4 * 1024 * 1024;
  if (file.size > MAX_BYTES){
    alert('ຮູບໃຫຍ່ເກີນໄປ (ສູງສຸດ 4MB) ກະລຸນາເລືອກຮູບອື່ນ');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    const dataUrl = e.target.result;
    const base64 = dataUrl.split(',')[1];
    selectedBookCoverFile = { filename: file.name, mimeType: file.type, base64: base64 };
    document.getElementById('bookCoverPreview').src = dataUrl;
    document.getElementById('bookCoverPreviewWrap').style.display = 'block';
    document.getElementById('bookCoverStatus').textContent = '';
  };
  reader.readAsDataURL(file);
}

function clearBookCover(){
  selectedBookCoverFile = null;
  document.getElementById('bookCoverFile').value = '';
  document.getElementById('bookCoverPreviewWrap').style.display = 'none';
  document.getElementById('bookCoverStatus').textContent = '';
}

function resetBookForm(){
  editingBookId = null;
  document.getElementById('bookTitleInput').value = '';
  document.getElementById('bookGradeInput').value = '';
  document.getElementById('bookSubjectInput').value = '';
  document.getElementById('bookPdfInput').value = '';
  clearBookCover();
  document.getElementById('bookFormTitle').textContent = '➕ ເພີ່ມປື້ມໃໝ່';
  document.getElementById('bookSubmitBtn').textContent = '➕ ເພີ່ມປື້ມນີ້';
}

function toggleBookForm(){
  if (!currentAccess){
    alert('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ (ປຸ່ມ "ເຂົ້າສູ່ລະບົບ" ດ້ານເທິງສຸດ)');
    openApp();
    return;
  }
  const role = (currentAccess.role || '').toLowerCase();
  if (role !== 'admin'){
    alert('ບັນຊີນີ້ບໍ່ມີສິດເພີ່ມສື່ການຮຽນ (ສະເພາະແອດມິນເທົ່ານັ້ນ)');
    return;
  }
  resetBookForm();
  const panel = document.getElementById('bookFormPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function editBookItem(id){
  const b = booksCache[id];
  if (!b) return;
  editingBookId = id;

  document.getElementById('bookTitleInput').value = b.title || '';
  document.getElementById('bookGradeInput').value = b.grade || '';
  document.getElementById('bookSubjectInput').value = b.subject || '';
  document.getElementById('bookPdfInput').value = b.pdfUrl || '';
  clearBookCover();

  if (b.coverUrl){
    document.getElementById('bookCoverPreview').src = b.coverUrl;
    document.getElementById('bookCoverPreviewWrap').style.display = 'block';
    document.getElementById('bookCoverStatus').textContent = 'ຮູບປົກເດີມ — ເລືອກໃໝ່ຖ້າຕ້ອງການປ່ຽນ';
  }

  document.getElementById('bookFormTitle').textContent = '✏️ ແກ້ໄຂປື້ມ';
  document.getElementById('bookSubmitBtn').textContent = '💾 ບັນທຶກການແກ້ໄຂ';
  document.getElementById('bookFormPanel').style.display = 'block';
  document.getElementById('bookFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function submitBook(){
  const title = document.getElementById('bookTitleInput').value.trim();
  const grade = document.getElementById('bookGradeInput').value;
  const subject = document.getElementById('bookSubjectInput').value.trim();
  const pdfUrl = document.getElementById('bookPdfInput').value.trim();
  if (!title || !subject){ alert('ກະລຸນາໃສ່ຊື່ປື້ມ ແລະ ວິຊາ'); return; }

  let coverUrl = editingBookId && booksCache[editingBookId] ? (booksCache[editingBookId].coverUrl || '') : '';

  if (selectedBookCoverFile){
    document.getElementById('bookCoverStatus').textContent = '⏳ ກຳລັງອັບໂຫລດຮູບປົກ...';
    const uploadRes = await callAPI('uploadImage', {
      filename: selectedBookCoverFile.filename,
      mimeType: selectedBookCoverFile.mimeType,
      base64: selectedBookCoverFile.base64
    });
    if (!uploadRes || uploadRes.error){
      document.getElementById('bookCoverStatus').textContent = '';
      alert('❌ ອັບໂຫລດຮູບປົກບໍ່ສຳເລັດ: ' + (uploadRes && uploadRes.error ? uploadRes.error : 'ບໍ່ຮູ້ສາເຫດ'));
      return;
    }
    coverUrl = uploadRes.url;
    document.getElementById('bookCoverStatus').textContent = '✅ ອັບໂຫລດຮູບປົກສຳເລັດ';
  }

  const action = editingBookId ? 'updateBook' : 'addBook';
  const payload = { title, grade, subject, coverUrl, pdfUrl };
  if (editingBookId) payload.id = editingBookId;

  const res = await callAPI(action, payload);
  if (res && res.error){ alert('❌ ຜິດພາດ: ' + res.error); return; }

  resetBookForm();
  document.getElementById('bookFormPanel').style.display = 'none';
  loadBooks();
}

async function deleteBookItem(id){
  if (!confirm('ຢືນຢັນລຶບປື້ມນີ້?')) return;
  const res = await callAPI('deleteBook', { id });
  if (res && res.error){ alert('❌ ຜິດພາດ: ' + res.error); return; }
  loadBooks();
}

loadBooks();

restoreLoginFromStorage(); // ພະຍາຍາມເຂົ້າສູ່ລະບົບອັດຕະໂນມັດ ຖ້າເຄີຍ Login ໄວ້ ແລະ token ຍັງບໍ່ໝົດອາຍຸ
