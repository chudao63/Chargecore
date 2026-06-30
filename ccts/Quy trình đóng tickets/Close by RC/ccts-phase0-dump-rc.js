/* =========================================================
   CCTS — PHASE 0: Quét list findCCTSTicket -> bảng theo RC
   Chạy ở trang CCTS (console.cnpowercore.com), đã đăng nhập.
   F12 -> Console -> dán -> Enter.
     1) Bấm search list 1 lần (để bắt token).
     2) Gõ:  dumpRC()
   Output: copy list RC (thirdTicketId) sẵn clipboard + window.__cctsTable + Excel.
   ========================================================= */
(function(){
  // ----- CONFIG filter (giống lúc lọc tay) — đổi nếu cần -----
  const CFG = {
    cctsTicketName     : 'EV',
    cctsTicketOwnerName: 'dinh',
    createStartTime    : '2026-05-31 17:00:00',
    createStopTime     : '2026-06-30 17:00:00',
    ticketStatus       : ['Pending for local team close'],
    pageSize           : 100,
  };
  const URL = 'https://cloud.cnpowercore.com:8091/ccts/cctsTicket/findCCTSTicket';

  // ----- bắt token từ request bất kỳ -----
  window.__cctsToken = window.__cctsToken || '';
  function grab(b){ try{ if(typeof b==='string'){ const m=b.match(/"token"\s*:\s*"([^"]+)"/); if(m) window.__cctsToken=m[1]; } }catch(e){} }
  if(!window.__cctsHooked){
    window.__cctsHooked=true;
    const _f=window.fetch; window.fetch=function(...a){ try{grab(a[1]&&a[1].body);}catch(e){} return _f.apply(this,a); };
    const _s=XMLHttpRequest.prototype.send; XMLHttpRequest.prototype.send=function(b){ grab(b); return _s.apply(this,arguments); };
  }

  async function ensureXLSX(){
    if(window.XLSX) return window.XLSX;
    await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
    return window.XLSX;
  }

  async function fetchPage(pageNum){
    const body={ page:{pageNum,pageSize:CFG.pageSize}, timezoneOffset:420,
      cctsTicketName:CFG.cctsTicketName, cctsTicketOwnerName:CFG.cctsTicketOwnerName,
      createStartTime:CFG.createStartTime, createStopTime:CFG.createStopTime,
      ticketStatus:CFG.ticketStatus, slaTimeout:'0', token:window.__cctsToken };
    const res=await fetch(URL,{method:'POST',credentials:'include',
      headers:{'content-type':'application/json;charset=UTF-8','accept':'application/json, text/plain, */*'},
      body:JSON.stringify(body)});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json(); // cctsTicketPk / cctsTicketId / thirdTicketId là string -> JSON.parse an toàn, không tròn
  }

  window.dumpRC = async function(){
    if(!window.__cctsToken){ console.warn('⚠️ Chưa bắt được token. Bấm search list 1 lần rồi gõ lại: dumpRC()'); return; }
    console.log('%c🚀 PHASE 0 — quét findCCTSTicket','font-weight:bold;color:#2563eb');
    const tbl=[]; let pageNum=1, total=Infinity;
    while(tbl.length<total){
      let d; try{ d=await fetchPage(pageNum); }catch(e){ console.error('Lỗi trang '+pageNum+': '+e.message); break; }
      const data=d.data||{}; total=Number(data.total||0);
      const list=data.list||[];
      for(const t of list){
        tbl.push({
          rc: t.thirdTicketId||'',
          cctsTicketId: String(t.cctsTicketId),
          cctsTicketPk: String(t.cctsTicketPk),
          errorCode: t.errorCode||'',
          errorName: t.errorName||'',
          stationCode: t.stationCode||'',
          chargeBoxId: t.chargeBoxId||'',
          creator: t.ticketCreator||'',
        });
      }
      console.log(`  trang ${pageNum}: +${list.length} (tổng ${tbl.length}/${total})`);
      if(!list.length) break;
      pageNum++; if(pageNum>50) break;
    }
    window.__cctsTable = tbl;

    const withRC = tbl.filter(x=>x.rc);
    const noRC   = tbl.filter(x=>!x.rc);
    const rcList = withRC.map(x=>x.rc).join('\n');
    try{ copy(rcList); }catch(e){}

    console.log(`%c✅ Xong: ${tbl.length} ticket | có RC: ${withRC.length} | không RC (BSS/tạo tay): ${noRC.length}`,'color:#16a34a');
    console.log('📋 Đã copy '+withRC.length+' RC vào clipboard — dán sang PHASE 1 (VOMS).');
    if(noRC.length) console.log('⚠️ '+noRC.length+' ticket KHÔNG có RC (không verify VOMS được, xử lý tay):\n'+noRC.map(x=>x.cctsTicketId+'  '+x.chargeBoxId).join('\n'));

    // Excel tham khảo (1 sheet đầy đủ)
    const XLSX=await ensureXLSX();
    const rows=[['RC','cctsTicketId','cctsTicketPk','errorCode','errorName','stationCode','chargeBoxId','creator']];
    tbl.forEach(x=>rows.push([x.rc,x.cctsTicketId,x.cctsTicketPk,x.errorCode,x.errorName,x.stationCode,x.chargeBoxId,x.creator]));
    const ws=XLSX.utils.aoa_to_sheet(rows);
    rows.forEach((_,r)=>{ if(r>0)['B','C'].forEach(c=>{const cell=ws[c+(r+1)];if(cell)cell.t='s';}); }); // ID/PK = Text
    ws['!cols']=[{wch:18},{wch:22},{wch:22},{wch:16},{wch:30},{wch:12},{wch:16},{wch:12}];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'CCTS_list');
    XLSX.writeFile(wb,'ccts-list-rc.xlsx');
    console.log('📄 Đã xuất ccts-list-rc.xlsx');
    console.log('➡️ Bước tiếp: list RC đã ở clipboard — sang VOMS chạy PHASE 1.');
  };

  console.log('🔌 PHASE 0 sẵn sàng. Bấm search list 1 lần (bắt token) rồi gõ: dumpRC()');
})();
