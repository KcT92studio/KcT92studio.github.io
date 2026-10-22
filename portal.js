/* ===== portal.js — ໂຕຮ່ວມຂອງ index.html (ນັກຮຽນ) ແລະ admin.html (ຜູ້ດູແລ) =====
   ແກ້ສອງຄ່ານີ້ຖ້າປ່ຽນ: URL ຂອງ Web app (/exec) ແລະ OAuth Client ID (ໃຊ້ຄ່າເດີມຂອງໂປຣເຈັກເກົ່າໄດ້) */
const API_URL = "https://script.google.com/macros/s/AKfycbxeN80JjhEdEjpgcEdr6sFIp40hn3q1kxKYHWAw_68zYt5T65DiVqp00qE6Oc-M8-HTmQ/exec";
const NEWS_URL = "news.html";   // ລິ້ງປຸ່ມ "ຂ່າວສານ" (ໜ້າຂ່າວເກົ່າ ປ່ຽນຊື່ເປັນ news.html)
const CLIENT_ID = "842445966044-uqi522iqaqmfbc2jg4ks9k9gj9dhj3rp.apps.googleusercontent.com";

/* ສີສັນ + ໂໝດມືດ (ແຜງ 🎨 ແບບດຽວກັບລະບົບປ້ອນຄະແນນ) */
document.write('<script src="theme.js"><\/script>');

const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = v => (v === null || v === undefined || isNaN(v)) ? "" : String(Math.round(v * 100) / 100);
let TOK = (() => { try { return localStorage.getItem("kct:tok") || ""; } catch (e) { return ""; } })();

function jwt(t) {
  try {
    const b = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(atob(b + "=".repeat((4 - b.length % 4) % 4)).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
  } catch (e) { return {}; }
}
function tokOk() { const j = jwt(TOK); return !!(j.email && j.exp && j.exp * 1000 > Date.now() + 60000); }
function logout() { try { localStorage.removeItem("kct:tok"); } catch (e) {} TOK = ""; location.reload(); }
function userBar() { const j = jwt(TOK); return `<div class="ubar"><span class="un">👤 ${esc(j.name || j.email || "")}</span><button type="button" class="lo" onclick="logout()">🚪 ອອກຈາກລະບົບ</button></div>`; }

/* ເອີ້ນ Apps Script (POST ເທົ່ານັ້ນ; token ບໍ່ຢູ່ໃນ URL)
   ເຮັດຊ້ຳອັດຕະໂນມັດ (ສູງສຸດ 3 ເທື່ອ) ເມື່ອເຊີບເວີຍັງ "ຕື່ນບໍ່ເຕັມທີ່" ຫຼື ຕອບຊ້າ — ສະເພາະການອ່ານຂໍ້ມູນ (ບໍ່ເຮັດຊ້ຳການ "ສົ່ງຄຳຂໍ" ເພື່ອບໍ່ໃຫ້ຊ້ຳ) */
const RETRY_OK = { open: 1, classes: 1, admin: 1 };
async function apiOnce(body) {
  let r;
  const ac = window.AbortController ? new AbortController() : null, to = ac && setTimeout(() => ac.abort(), 20000);
  try { r = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({}, body, { tok: TOK })), signal: ac ? ac.signal : undefined }); }
  catch (e) { throw new Error("ເຊື່ອມຕໍ່ເຊີບເວີບໍ່ໄດ້ ກະລຸນາລອງໃໝ່"); }
  finally { if (to) clearTimeout(to); }
  let d; try { d = await r.json(); } catch (e) { throw new Error("ເຊີບເວີຕອບກັບບໍ່ຖືກຮູບແບບ"); }
  if (!d.ok) { const er = new Error(d.error || "ເກີດຂໍ້ຜິດພາດ"); er.srv = true; er.auth = !!d.auth; if (er.auth) { try { localStorage.removeItem("kct:tok"); } catch (e) {} TOK = ""; } throw er; }
  return d;
}
async function api(body) {
  const max = RETRY_OK[body.a] ? 3 : 1;
  for (let i = 1; ; i++) {
    try { return await apiOnce(body); }
    catch (e) {
      if (e.srv || i >= max) throw e;            // ຄຳຕອບຈາກເຊີບເວີ (ເຊັ່ນ ໝົດສິດ) ບໍ່ເຮັດຊ້ຳ
      if (window.onApiRetry) window.onApiRetry(i);
      await new Promise(r => setTimeout(r, 700 * i));
    }
  }
}

/* ລາຍຊື່ຫ້ອງ: ເກັບໄວ້ໃນເຄື່ອງ + ໂຫຼດລ່ວງໜ້າ ເພື່ອໃຫ້ຟອມຂຶ້ນທັນທີ */
let CLS = (() => { try { return JSON.parse(localStorage.getItem("kct:classes") || "null"); } catch (e) { return null; } })();
let _clsP = null;
function loadClasses() {
  if (_clsP) return _clsP;                                             // ຖ້າກຳລັງໂຫຼດຢູ່ ໃຊ້ອັນເດີມ ບໍ່ເອີ້ນຊ້ຳ
  _clsP = api({ a: "classes" }).then(r => { CLS = r.classes; try { localStorage.setItem("kct:classes", JSON.stringify(CLS)); } catch (e) {} return CLS; })
    .finally(() => { _clsP = null; });
  return _clsP;
}
/* ປຸກ Apps Script ໃຫ້ຕື່ນ ຕອນຜູ້ໃຊ້ຍັງກຳລັງກົດ Login (ລົດເວລາ cold start) */
function warmUp() { try { fetch(API_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: '{"a":"ping"}' }).catch(() => {}); } catch (e) {} }

/* ປຸ່ມ Login ດ້ວຍ Google: ມີ token ທີ່ຍັງບໍ່ໝົດອາຍຸ → ເຂົ້າທັນທີ */
function needLogin(el, cb, label) {
  if (tokOk()) { el.hidden = true; cb(); return; }
  warmUp();
  el.hidden = false;
  el.innerHTML = `<div class="hero">
    <div class="hl">
    <img class="logo" id="lgHead" src="logo.png" alt="ໂລໂກ" title="ກົດຄ້າງເພື່ອເລືອກສີ">
    <h1>ໂຮງຮຽນ ມ.ຕ ຫ້ວຍດຳໃໝ່</h1>
    <div class="mut">ລະບົບເບິ່ງຄະແນນນັກຮຽນ</div>
    <blockquote class="quote">“ຄວາມຮູ້ເປັນຊັບທີ່ບໍ່ມີໃຜລັກໄປໄດ້”<br><span class="mut">ຄຳສຸພາສິດ — ຂະຫຍັນຮຽນ ມື້ນີ້ ເພື່ອອະນາຄົດທີ່ດີ</span></blockquote>
    </div>
    <div class="hr">
    <div class="what"><b>ເຂົ້າສູ່ລະບົບແລ້ວທ່ານຈະເຫັນ:</b>
      <ul><li>📊 ຄະແນນລາຍເດືອນ ແລະ ພາກຮຽນ ທຸກວິຊາ</li><li>⚠️ ວິຊາທີ່ຍັງບໍ່ໄດ້ເສັງ</li><li>🏅 ຄະແນນລວມ, ສະເລ່ຍ, ອັນດັບ ແລະ ຜົນການເສັງ</li></ul></div>
    <a class="newsbtn" href="${NEWS_URL}">📰 ອ່ານຂ່າວສານໂຮງຮຽນ →</a>
    <p class="invite">👇 ກົດປຸ່ມລຸ່ມນີ້ ແລ້ວເລືອກ Gmail ຂອງທ່ານ</p>
    <div class="gwrap" id="gwrap"><div class="gfake">🔐 ${label || "ເຂົ້າສູ່ລະບົບ"}</div><div class="gover" id="gbtn"></div></div>
    <div class="err" id="gerr"></div>
    </div>
  </div>`;
  let tries = 0;
  (function init() {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: CLIENT_ID, auto_select: false,
        callback: r => { TOK = r.credential; try { localStorage.setItem("kct:tok", TOK); } catch (e) {} el.hidden = true; cb(); }
      });
      google.accounts.id.renderButton($("#gbtn"), { theme: "outline", size: "large", text: "signin_with", width: Math.min(400, Math.max(200, Math.round($("#gwrap").clientWidth || 300))) });
    } else if (++tries < 80) setTimeout(init, 150);
    else $("#gerr").textContent = "ໂຫຼດປຸ່ມ Google ບໍ່ໄດ້ — ກວດອິນເຕີເນັດ ແລ້ວ Refresh";
  })();
  if (window.kctTheme) kctTheme.bindLongPress($("#lgHead"));
}
(function () { const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; document.head.appendChild(s); })();

/* ປຸ່ມເລືອກ (ເດືອນ/ຫ້ອງ) */
function chips(el, list, sel, cb) {
  el.innerHTML = list.map(x => `<button type="button" data-m="${esc(x)}" class="${x === sel ? "on" : ""}">${esc(label(x))}</button>`).join("");
  el.classList.add("scroll");
  const on = el.querySelector("button.on"); if (on) el.scrollLeft = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
  el.onclick = e => { const b = e.target.closest("button[data-m]"); if (b) cb(b.dataset.m); };
}
function label(m) { return /^SEMESTER (I{1,2})$/.test(m) ? "ພາກຮຽນ " + m.slice(9) : /^M\d+$/.test(m) ? "ເດືອນ " + m.slice(1) : m; }

/* ຄະແນນລວມ/ສະເລ່ຍ (ຄິດແບບ Excel: SUM, AVERAGE) */
function stats(row) {
  let sum = 0, n = 0, np = 0, u7 = 0, u9 = 0;
  (row || []).forEach(v => { if (v == null) return; n++; sum += v; if (v < 5) np++; if (v >= 7) u7++; if (v >= 9) u9++; });
  sum = Math.round(sum * 100) / 100;
  return { sum: n ? sum : null, avg: n ? sum / n : null, n, np, u7, u9 };
}

/* ຕາຕະລາງຄະແນນແບບ "ຕາຕະລາງລວມ" ຂອງລະບົບປ້ອນຄະແນນ (scoreM2) */
function table(D, rows, o) {
  o = o || {};
  const N = D.names.length, S = D.subjects.length;
  const st = rows.map(stats), sums = st.filter(x => x.n).map(x => x.sum);
  const rank = st.map(x => x.n ? 1 + sums.filter(s => s > x.sum).length : "");
  const miss = D.subjects.map((_, c) => rows.filter(r => r[c] == null).length);
  const hv = (t, c) => `<th class="vt ${c || ""}"><div class="vtx">${t}</div></th>`;
  const head = D.subjects.map(x => hv(esc(x))).join("") + hv("ຄະແນນລວມ") + hv("ຄະແນນສະເລ່ຍ") + hv("ຈຳນວນວິຊາເສັງຕົກ") + hv("ຈຳນວນວິຊາ ≥ 7") + hv("ຈຳນວນວິຊາ ≥ 9") + hv("ອັນດັບທີ່") + hv("ຜົນການເສັງ");
  const codes = D.subjects.map((_, i) => `<th class="vcode">S${i + 1}</th>`).join("") + ["SUM", "AVER", "no pass", "7up", "9up", "OR", "MK"].map(x => `<th class="vcode">${x}</th>`).join("");
  const body = rows.map((r, i) => {
    const s = st[i], tds = D.names.length ? D.subjects.map((_, c) => {
      const v = r[c];
      return `<td class="${v == null && o.miss ? "pk" : ""}">${v == null ? "" : `<span class="${v < 5 ? "lowv" : ""}">${fmt(v)}</span>`}</td>`;
    }).join("") : "";
    return `<tr class="${i === o.me ? "me" : ""}"><td class="c1">${i + 1}</td><td class="c2">${esc(D.names[i])}</td>${tds}` +
      `<td class="b">${s.n ? s.sum.toFixed(2) : ""}</td><td class="b">${s.n ? s.avg.toFixed(2) : ""}</td><td class="${s.np ? "lowv" : ""}">${s.n ? s.np : ""}</td><td>${s.n ? s.u7 : ""}</td><td>${s.n ? s.u9 : ""}</td>` +
      `<td class="b">${rank[i]}</td><td class="b ${s.n ? (s.np ? "lowv" : "okc") : ""}">${s.n ? (s.np ? "ບໍ່ຜ່ານ" : "ຜ່ານ") : ""}</td></tr>`;
  }).join("");
  const foot = `<tr><td class="c1"></td><td class="c2">ຂາດ</td>` + miss.map(m => `<td class="${m ? "lowv" : "okc"}">${m ? "ຂາດ " + m : "✓"}</td>`).join("") + `<td colspan="7"></td></tr>`;
  const w = 38 + 150 + S * 40 + 66 * 2 + 46 * 4 + 70;
  const colg = "<colgroup>" + [38, 150].concat(D.subjects.map(() => 40), [66, 66, 46, 46, 46, 46, 70]).map(x => `<col style="width:${x}px">`).join("") + "</colgroup>";
  return `<table class="vt2" style="width:${w}px">${colg}<thead><tr><th class="c1" rowspan="2">#</th><th class="c2" rowspan="2" style="text-align:left">ຊື່ ແລະ ນາມສະກຸນ</th>${head}</tr><tr>${codes}</tr></thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>` +
    `<div class="mut" style="padding:8px 10px">ນັກຮຽນ ${N} ຄົນ · ຄົນທີ່ຍັງຂາດຢ່າງໜ້ອຍ 1 ວິຊາ: ${rows.filter(r => r.some(v => v == null)).length}</div>`;
}

/* ເຕັມຈໍ (ຕາຕະລາງ) — ໃຊ້ໄດ້ທຸກອຸປະກອນ ລວມ iPhone ທີ່ບໍ່ຮອງຮັບ Fullscreen API */
function fullscreen(box, btn) {
  const set = on => { box.classList.toggle("fsmode", on); document.body.classList.toggle("fsbody", on); btn.textContent = on ? "✕ ປິດເຕັມຈໍ" : "⛶ ເຕັມຈໍ"; };
  btn.onclick = () => set(!box.classList.contains("fsmode"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
}

/* ---------- CSS ---------- */
const css = `
:root{--bg:#f4f5f7;--card:#fff;--ink:#1d2330;--mute:#667085;--line:#e3e6ec;--acc:#1f6feb;--acc-ink:#fff;--hi:#e8f0fe;--ok:#157f3b;--bad:#c62828}
*{box-sizing:border-box}
body{margin:0;background:var(--kv-bg,var(--bg));color:var(--kv-ink,var(--ink));font:16px/1.5 "Noto Sans Lao","Phetsarath OT","Leelawadee UI",system-ui,sans-serif}
body.fsbody{overflow:hidden}
.wrap{max-width:1100px;margin:0 auto;padding:14px}
h1{font-size:22px;margin:4px 0 6px}h2{font-size:15px;margin:14px 0 6px;color:var(--kv-mute,var(--mute))}
.mut{color:var(--kv-mute,var(--mute));font-size:13px}.err{color:var(--kv-bad,var(--bad));font-size:14px;margin-top:8px}
a{color:var(--kv-acc,var(--acc))}
.card{background:var(--kv-card,var(--card));border:1px solid var(--kv-line,var(--line));border-radius:12px;padding:14px;margin:10px 0}
.hero{max-width:460px;margin:24px auto;text-align:center;background:var(--kv-card,var(--card));border:1px solid var(--kv-line,var(--line));border-radius:18px;padding:24px 20px}
.hero .logo{width:84px;height:84px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px var(--kv-acc,var(--acc));-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:pointer}
.hero h1{margin:10px 0 2px}
.what{text-align:left;background:var(--kv-hi,var(--hi));border-radius:12px;padding:12px 14px;margin:16px 0;font-size:14px}.what ul{margin:6px 0 0;padding-left:20px}
.newsbtn{display:inline-block;padding:10px 18px;border-radius:999px;border:1px solid var(--kv-acc,var(--acc));text-decoration:none;font-weight:700}
.invite{font-weight:700;margin:18px 0 10px}
.quote{margin:20px 0 0;padding:12px 14px;border-left:4px solid var(--kv-acc,var(--acc));text-align:left;background:var(--kv-hi,var(--hi));border-radius:0 10px 10px 0;font-size:15px}
.ubar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:2px 0 8px}
.ubar .un{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px}
button.lo{flex:0 0 auto;padding:6px 14px;font-size:14px;font-weight:700;border-radius:999px;color:var(--kv-bad,var(--bad));border-color:var(--kv-bad,var(--bad))}
.chips.scroll{position:relative;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;padding:2px 2px 8px}
.chips.scroll button{flex:0 0 auto;white-space:nowrap}
.hero{display:flex;flex-direction:column}.hl,.hr{display:contents}
.hero .logo{align-self:center}.hero .newsbtn{align-self:center}.hero .quote{order:9}
.hero .hr>*{order:0}
@media(min-width:900px){
  .hero{max-width:960px;flex-direction:row;align-items:center;gap:40px;padding:44px 48px;margin:8vh auto;text-align:left}
  .hl,.hr{display:flex;flex-direction:column;flex:1 1 0;min-width:0}
  .hl{align-items:center;text-align:center}
  .hero .logo{width:132px;height:132px}.hero h1{font-size:28px}
  .hero .quote{order:0;margin-top:22px}
  .hr .what{font-size:16px}.hr .newsbtn{align-self:stretch;text-align:center}
}
.gwrap{position:relative;width:100%;max-width:340px;height:54px;margin:6px auto 4px}
.gfake{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:14px;font-weight:700;font-size:18px;background:var(--kv-acc,var(--acc));color:var(--kv-acc-ink,var(--acc-ink));box-shadow:0 4px 12px rgba(0,0,0,.18)}
.gover{position:absolute;left:0;top:0;width:100%;height:40px;transform:scaleY(1.35);transform-origin:0 0;opacity:.01;overflow:hidden;z-index:2}
#kctDeskBar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#fff3cd;color:#5c4400;border-top:3px solid #e0a000;display:flex;gap:10px;align-items:flex-start;box-shadow:0 -4px 16px rgba(0,0,0,.2)}
#kctDeskBar b{display:block}#kctDeskBar button{flex:0 0 auto;border:0;background:transparent;font-size:1.4em;line-height:1;padding:0 .2em;color:#5c4400}
.lg-ico{font-size:44px;cursor:pointer;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
button,select,input{font:inherit;color:var(--kv-ink,var(--ink))}
button{border:1px solid var(--kv-line,var(--line));background:var(--kv-card,var(--card));border-radius:12px;padding:8px 14px;cursor:pointer}
button.on,button.pri{background:var(--kv-acc,var(--acc));color:var(--kv-acc-ink,var(--acc-ink));border-color:var(--kv-acc,var(--acc))}
button.warn{border-color:#e0a000}button.warn.on{background:#e0a000;color:#fff}
button:disabled{opacity:.5;cursor:not-allowed}
select,input{width:100%;padding:9px 10px;border:1px solid var(--kv-line,var(--line));border-radius:10px;background:var(--kv-card,var(--card))}
label{display:block;font-size:13px;margin:10px 0 4px;color:var(--kv-mute,var(--mute))}
.row{display:flex;gap:8px;flex-wrap:wrap}.chips{display:flex;gap:6px;flex-wrap:wrap}
.pill{display:inline-block;background:rgba(224,0,120,.13);color:#c2185b;border-radius:99px;padding:3px 12px;margin:3px 6px 3px 0;font-weight:600}
.sc{display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid var(--kv-line,var(--line))}.sc .m{color:var(--kv-bad,var(--bad))}
.tw{overflow-x:auto;overflow-y:visible;-webkit-overflow-scrolling:touch;border:1px solid var(--kv-line,var(--line));border-radius:10px;background:var(--kv-card,var(--card))}
.tw.fsmode{position:fixed;inset:0;z-index:2147480000;overflow:auto;border-radius:0}
.fsb{display:block;width:100%;margin:10px 0;padding:14px;font-size:17px;font-weight:700;background:var(--kv-acc,var(--acc));color:var(--kv-acc-ink,var(--acc-ink));border-color:var(--kv-acc,var(--acc));box-shadow:0 3px 10px rgba(0,0,0,.18)}
body.fsbody .fsb{position:fixed;right:10px;top:8px;width:auto;margin:0;padding:8px 14px;font-size:15px;z-index:2147480001}
.vt2{border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:13px}
.vt2 th,.vt2 td{border-right:1px solid var(--kv-line,var(--line));border-bottom:1px solid var(--kv-line,var(--line));padding:2px 4px;text-align:center;background:var(--kv-card,var(--card));line-height:1.25}
.vt2 th{position:sticky;top:0;z-index:2;font-size:12px}
.vt2 th.vt{height:150px;vertical-align:bottom;padding:4px 2px}
.vtx{writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;margin:0 auto;font-weight:600}
.vt2 th.vcode{background:#f8cbad;color:#c00000;font-size:11px;top:150px;padding:2px}
.vt2 .c1,.vt2 .c2{position:sticky;z-index:1;text-align:left}.vt2 .c1{left:0;color:var(--kv-mute,var(--mute))}
.vt2 .c2{left:38px;border-right:2px solid var(--kv-line,var(--line));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vt2 th.c1,.vt2 th.c2{z-index:4}
.vt2 tfoot td{position:sticky;bottom:0;z-index:2;font-weight:600;border-top:2px solid var(--kv-line,var(--line))}
.vt2 td.b{font-weight:700}.vt2 .lowv{color:var(--kv-bad,var(--bad));font-weight:700}.vt2 .okc{color:var(--kv-ok,var(--ok))}
.vt2 td.pk{background:rgba(224,0,120,.22)}
.vt2 tr.me td{background:var(--kv-hi,var(--hi));font-weight:700}
@media(max-width:700px){.vt2 .c2{left:28px}}
#kctThemeFab{position:fixed;right:14px;bottom:16px;z-index:2147482000;width:46px;height:46px;border-radius:50%;border:1px solid var(--kv-line,var(--line));background:var(--kv-card,#fff);font-size:21px;padding:0;box-shadow:0 4px 14px rgba(0,0,0,.22)}
body.fsbody #kctThemeFab{display:none}
#kctThemePanel{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
#kctThemePanel[hidden]{display:none}
.kct-th-box{width:min(440px,100%);background:var(--kv-card,#fff);color:var(--kv-ink,#1d2330);border:1px solid var(--kv-line,#e3e6ec);border-radius:18px 18px 0 0;padding:16px 16px 20px;max-height:88vh;overflow:auto}
@media(min-width:600px){#kctThemePanel{align-items:flex-start;justify-content:flex-end;padding:60px 18px 0}.kct-th-box{border-radius:16px}}
.kct-th-head{display:flex;justify-content:space-between;align-items:center}.kct-th-x{border:0!important;background:transparent!important}
#kctThemePanel .thl{font-size:13px;color:var(--kv-mute,#667085);margin:14px 0 8px}
#kctThemePanel .thsw{display:flex;flex-wrap:wrap;gap:12px}
#kctThemePanel .thsw button{width:44px;height:44px;border-radius:50%;padding:0;border:3px solid var(--kv-card,#fff);box-shadow:0 0 0 2px var(--kv-line,#e3e6ec)}
#kctThemePanel .thsw button.on{box-shadow:0 0 0 3px var(--kv-ink,#1d2330)}
#kctThemePanel .thseg{display:flex;gap:8px;flex-wrap:wrap}#kctThemePanel .thseg button{flex:1;min-width:84px}
#kctThemePanel .threset{margin-top:16px;width:100%;background:transparent;color:var(--kv-mute,#667085)}
html[data-kct-bg="dots"] body{background-image:radial-gradient(var(--kv-line) 1.3px,transparent 1.3px);background-size:20px 20px}
html[data-kct-bg="lines"] body{background-image:repeating-linear-gradient(45deg,var(--kv-line) 0 1px,transparent 1px 16px)}
`;
(function () {
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700&display=swap">');
  addEventListener("DOMContentLoaded", () => {
    const fab = document.createElement("button"); fab.id = "kctThemeFab"; fab.type = "button"; fab.textContent = "🎨"; fab.setAttribute("aria-label", "ເລືອກສີສັນ");
    fab.onclick = () => window.kctTheme && kctTheme.toggle(); document.body.appendChild(fab);
  });
})();

/* ແຈ້ງເຕືອນລຸ່ມສຸດ: ເປີດໃນມືຖືແຕ່ຢູ່ໂໝດ "ເວັບໄຊເທິງເດັສທັອບ" */
addEventListener("DOMContentLoaded", () => {
  try {
    const sw = Math.min(screen.width, screen.height), coarse = matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 1;
    if (!(coarse && sw <= 600 && innerWidth > sw * 1.3)) return;
    if (sessionStorage.getItem("kct:deskbar")) return;
    const k = innerWidth / sw, bar = document.createElement("div");
    bar.id = "kctDeskBar"; bar.style.fontSize = (15 * k) + "px"; bar.style.padding = (10 * k) + "px " + (12 * k) + "px " + (12 * k) + "px";
    bar.innerHTML = '<div style="flex:1"><b>📱 ກຳລັງເປີດໃນໂໝດຄອມພິວເຕີ</b>ເພື່ອເບິ່ງງ່າຍຂຶ້ນ ໃຫ້ກົດ ⋮ (3 ຈຸດ) ດ້ານເທິງ → ເລື່ອນຫາ “ເວັບໄຊເທິງເດັສທັອບ” (Desktop site) → <b style="display:inline">ກົດຕິກອອກ</b> ເພື່ອເປີດໂໝດມືຖື</div><button type="button" aria-label="ປິດ">✕</button>';
    bar.querySelector("button").onclick = () => { bar.remove(); try { sessionStorage.setItem("kct:deskbar", "1"); } catch (e) {} };
    document.body.appendChild(bar);
  } catch (e) {}
});
