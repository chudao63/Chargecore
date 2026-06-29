(function(){
  const RAW = `
1123769398138896385
1123752141192298497
`;
  const ids = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];

  window.__cctsToken = window.__cctsToken || '';
  function grab(b){ try{ if(typeof b==='string'){ const m=b.match(/"token"\s*:\s*"([^"]+)"/); if(m) window.__cctsToken=m[1]; } }catch(e){} }
  if (!window.__cctsHooked){
    window.__cctsHooked = true;
    const _f = window.fetch;
    window.fetch = function(...a){ try{ grab(a[1]&&a[1].body); }catch(e){} return _f.apply(this,a); };
    const _s = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(b){ grab(b); return _s.apply(this,arguments); };
  }

  async function ensureXLSX(){
    if (window.XLSX) return window.XLSX;
    await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    return window.XLSX;
  }

  async function fetchSolution(pk){
    const res = await fetch('https://cloud.cnpowercore.com:8091/ccts/cctsTicketSolution/findCCTSTicketSolution', {
      method:'POST', credentials:'include',
      headers:{'content-type':'application/json;charset=UTF-8','accept':'application/json, text/plain, */*'},
      body: JSON.stringify({ cctsTicketPk:String(pk), page:{pageNum:1,pageSize:50}, token: window.__cctsToken })
    });
    const text = await res.text();
    if (!res.ok) return { ok:false, err:`HTTP ${res.status}`, sol:'', count:0 };
    const re = /"cctsTicketSolutionContent"\s*:\s*"((?:\\.|[^"\\])*)"/g;
    const out=[]; let m;
    while((m=re.exec(text))){ try{ out.push(JSON.parse('"'+m[1]+'"')); }catch(e){ out.push(m[1]); } }
    const sol = out.filter(Boolean).join(' ||| ');
    return { ok:true, err:'', sol, count:out.filter(Boolean).length };
  }

  window.solScan = async function(){
    if (!window.__cctsToken){ console.warn('⚠️ Chưa bắt được token. Search lại list / mở 1 ticket rồi gọi: solScan()'); return; }
    console.log(`%c🚀 PHASE 2 — Quét Solution ${ids.length} ticket`, 'font-weight:bold;color:#2563eb');
    const rows = [['STT','TicketID','Solution','SoBanGhi','GhiChu']];
    const okList=[], emptyList=[], errList=[];

    for (let i=0;i<ids.length;i++){
      const id = ids[i]; let r;
      try { r = await fetchSolution(id); } catch(e){ r = { ok:false, err:String(e), sol:'', count:0 }; }
      const stt = String(i+1).padStart(2,'0');

      if (!r.ok){
        errList.push(id);
        console.log(`%c[${stt}/${ids.length}] ❌ ${id}  → ${r.err}`, 'color:#dc2626');
        rows.push([ i+1, id, '', 0, r.err ]);
      } else if (!r.sol){
        emptyList.push(id);
        console.log(`%c[${stt}/${ids.length}] ⚪ ${id}  → (không có solution)`, 'color:#d97706');
        rows.push([ i+1, id, '', 0, '(không có solution)' ]);
      } else {
        okList.push(id);
        const preview = r.sol.replace(/\s+/g,' ').slice(0,60);
        console.log(`%c[${stt}/${ids.length}] ✅ ${id}  → [${r.count} bản ghi] ${preview}${r.sol.length>60?'…':''}`, 'color:#16a34a');
        rows.push([ i+1, id, r.sol, r.count, '' ]);
      }
      await new Promise(r=>setTimeout(r,120));
    }

    const XLSX = await ensureXLSX();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:5},{wch:22},{wch:90},{wch:9},{wch:22}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solutions');
    XLSX.writeFile(wb, 'ccts-solutions.xlsx');

    console.log(`%c\n===== TỔNG HỢP PHASE 2 =====`, 'font-weight:bold');
    console.log(`✅ Có solution: ${okList.length} | ⚪ Trống: ${emptyList.length} | ❌ Lỗi: ${errList.length} | Tổng: ${ids.length}`);
    if (emptyList.length) console.log(`⚪ Trống solution:\n`+emptyList.join('\n'));
    if (errList.length)   console.log(`❌ Lỗi khi quét:\n`+errList.join('\n'));
    console.log(`📄 Đã xuất ccts-solutions.xlsx`);
  };

  console.log('🔌 Sẵn sàng. Nếu chưa bắt được token thì search lại list / mở 1 ticket. Rồi gõ: solScan()');
})();