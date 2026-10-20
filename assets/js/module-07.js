/* Official student report layout: presentation/export only. Auth, roles, and API are unchanged. */
(function () {
  const OFFICIAL_HEADERS = ['ກຸ່ມວິຊາ','ວິຊາຮຽນ','ເດືອນ','09','10','11','12','Avg I','Exam I','Tot I','02','03','04','05','Avg II','Exam II','Tot II','Year','Fix','Note'];
  const OFFICIAL_SCORE_COLUMNS = ['09','10','11','12','Avg I','Exam I','Tot I','02','03','04','05','Avg II','Exam II','Tot II','Year','Fix','Note'];
  const OFFICIAL_ROWS = (typeof REPORT_SUBJECTS !== 'undefined' ? REPORT_SUBJECTS : []).slice();
  function officialKey(v) { return String(v == null ? '' : v).replace(/\s*\(S\d+\)\s*$/i,'').replace(/\s+/g,' ').trim(); }
  function officialSubject(item) { return officialKey(item && (item.subject || item.sourceSubject)); }
  function officialFindScore(report, subject) {
    const target=officialKey(subject.subject);
    const list=(report && report.subjects)||[];
    const item=list.find(x => officialSubject(x)===target || officialSubject(x)===officialKey(subject.sourceSubject));
    const scores=item && Array.isArray(item.scores) ? item.scores : [];
    return OFFICIAL_SCORE_COLUMNS.map((_,i) => scores[i] == null ? '' : scores[i]);
  }
  function officialStudentName(report) {
    const st=(report && report.student)||{};
    return st.name || (typeof legacyDisplayName==='function' ? legacyDisplayName(st) : [st.firstName,st.lastName].filter(Boolean).join(' ')) || 'student';
  }
  function officialRows(report) {
    return OFFICIAL_ROWS.map(subject => [subject.group || '', subject.subject || '', '', ...officialFindScore(report, subject)]);
  }
  function officialRender(report, host) {
    const rows=officialRows(report), st=(report&&report.student)||{};
    const esc=typeof legacyEscape==='function' ? legacyEscape : (v=>String(v??''));
    const groupSpans=[];
    rows.forEach((r,i)=>{ if(i===0 || r[0]!==rows[i-1][0]) { let n=1; while(i+n<rows.length && rows[i+n][0]===r[0]) n++; groupSpans.push([i,n]); } });
    const groupStart=new Map(groupSpans.map(x=>[x[0],x[1]]));
    const body=rows.map((r,i)=>'<tr>'+ (groupStart.has(i)?'<th rowspan="'+groupStart.get(i)+'">'+esc(r[0])+'</th>':'') + '<th class="official-subject">'+esc(r[1])+'</th><td></td>'+r.slice(3).map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');
    host.innerHTML='<div class="detail-overlay" onclick="if(event.target===this)closeDetail()"><div class="detail-card official-report-card" id="reportCardContent"><div class="detail-header"><div class="detail-name">📘 ປຶ້ມຕິດຕາມນັກຮຽນ</div><button class="close-btn" onclick="closeDetail()">✕</button></div><div class="official-report-actions"><button class="dl-btn" onclick="downloadExcel()">⬇ Excel ຮູບແບບທາງການ</button><button class="dl-btn" onclick="downloadPDF(&quot;official-report&quot;)">⬇ PDF</button></div><div class="official-student-info"><div><b>ຊື່ ແລະ ນາມສະກຸນ:</b> '+esc(officialStudentName(report))+'</div><div><b>ຫ້ອງ:</b> '+esc(st.room||'')+'</div><div><b>ພໍ່:</b> '+esc(st.father||'-')+'</div><div><b>ແມ່:</b> '+esc(st.mother||'-')+'</div></div><div class="report-table-wrap"><table class="official-report-table" id="scoreTable"><thead><tr>'+OFFICIAL_HEADERS.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div></div></div>';
    window.legacySelectedReport=report;
  }
  window.downloadExcel=function() {
    const report=window.legacySelectedReport || (typeof legacySelectedReport!=='undefined' ? legacySelectedReport : null);
    if(!report || !window.XLSX) return;
    const st=report.student||{}, aoa=[];
    const name=officialStudentName(report), room=st.room||'', gender=st.gender||'';
    aoa.push(['ຊື່ ແລະ ນາມສະກຸນ: '+name+'   ເພດ: '+gender+'   ຊັ້ນຮຽນ: '+room]);
    aoa.push(['ໂຮງຮຽນ: ມ.ຕ ຫ້ວຍດໍາໃໝ່   ສົກຮຽນ: 2025-2026']);
    aoa.push(OFFICIAL_HEADERS); aoa.push(Array(20).fill(''));
    officialRows(report).forEach(r=>aoa.push(r));
    aoa.push(['','','ລາຍເຊັນ ຜູ້ປົກຄອງ']);
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:19}},{s:{r:1,c:0},e:{r:1,c:19}}];
    const groups=[]; officialRows(report).forEach((r,i)=>{const rr=4+i;if(!r[0])return; if(i===0||r[0]!==officialRows(report)[i-1][0]){let n=1;while(i+n<officialRows(report).length&&officialRows(report)[i+n][0]===r[0])n++;if(n>1)groups.push({s:{r:rr,c:0},e:{r:rr+n-1,c:0}});}}); ws['!merges'].push(...groups);
    ws['!cols']=[12,28,5,8,8,8,8,9,9,9,8,8,8,8,9,9,9,9,8,15].map(w=>({wch:w}));
    ws['!rows']=[{hpt:28},{hpt:24},{hpt:34},{hpt:10},...officialRows(report).map(()=>({hpt:19})),{hpt:24}];
    const border={style:'thin',color:{rgb:'808080'}}, all={top:border,bottom:border,left:border,right:border};
    for(let r=2;r<aoa.length;r++) for(let c=0;c<20;c++){const cell=ws[XLSX.utils.encode_cell({r,c})]; if(!cell)continue; cell.s={border:all,alignment:{vertical:'center',horizontal:c===1?'left':'center',wrap_text:true},font:{name:'Phetsarath OT',sz:r<4?11:10,bold:r===2||c===0||c===1}}; if(r===2){cell.s.fill={fgColor:{rgb:'D9EAD3'},patternType:'solid'};}}
    ws['!pageSetup']={orientation:'portrait',paperSize:9,fitToWidth:1,fitToHeight:0}; ws['!sheetPr']={pageSetUpPr:{fitToPage:true}};
    const safe=name.replace(/[\\/:*?"<>|]/g,'_').slice(0,31)||'student'; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,safe); XLSX.writeFile(wb,'ປຶ້ມຕິດຕາມ_'+safe+'.xlsx');
  };
  window.officialRenderReport=officialRender;
  if (typeof legacyRenderReport==='function') legacyRenderReport=officialRender;
})();
