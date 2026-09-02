const legacyRenderReportTemplateBase = legacyRenderReport;
legacyRenderReport = function(report, host) {
  legacyRenderReportTemplateBase(report, host);
  const card = host.querySelector('#reportCardContent');
  if (!card) return;
  card.classList.add('report-template');
  const student = report.student || {};
  const header = card.querySelector('.detail-header');
  if (header) {
    const heading = document.createElement('div');
    heading.style.cssText='text-align:center;font-size:13px;font-weight:800;margin:0 0 4px;';
    heading.textContent='ໃບຕິດຕາມຜົນການຮຽນ ປີການສຶກສາ';
    header.prepend(heading);
  }
  const info = card.querySelector('.report-info');
  if (info) {
    info.innerHTML='<div><b>ຊື່–ນາມສະກຸນ:</b> '+legacyEscape(student.name || '')+'</div><div><b>ຫ້ອງ:</b> '+legacyEscape(student.room || '')+'</div><div><b>ປີການສຶກສາ:</b> 2025-2026</div><div><b>ສະຖານະ:</b> ປຶ້ມຕິດຕາມ</div>';
  }
  const footer = document.createElement('div'); footer.className='report-footer'; footer.innerHTML='<span>ລາຍເຊັນຄູປະຈຳຫ້ອງ: ____________________</span><span>ວັນທີ: ____________________</span><span>ຜູ້ປົກຄອງ: ____________________</span>';
  card.appendChild(footer);
};
downloadPDF = function(filename){ const element=document.getElementById('reportCardContent'); if(!element||!window.html2pdf)return; html2pdf().set({margin:0.27, filename:(filename||'ປຶ້ມຕິດຕາມ')+'.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,letterRendering:true}, pagebreak:{mode:['avoid-all','css','legacy'],avoid:['tr']}, jsPDF:{unit:'in',format:'a4',orientation:'landscape'}}).from(element).save(); };
