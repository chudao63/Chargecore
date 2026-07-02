/* =========================================================
   VOMS — PHASE 1: Quét trạng thái theo RC
   Chạy ở trang VOMS (voms.vgreen.net), đã đăng nhập.
   F12 -> Console -> dán cả file -> Enter -> 1 hộp thoại hiện ra, dán list RC vào đó -> bấm Chạy.
   Bước trước đó: search thử 1 ticket trên VOMS 1 lần để script bắt được token.
   Kết quả: lọc RC "Đóng" + auto-copy list RC đã đóng (dán sang PHASE 2).
   Dừng giữa chừng: window.__scanStop = true
   ========================================================= */
(async () => {
  // ---- Hộp thoại dán list RC (giữ code không đổi qua các lần chạy, git không báo diff) ----
  function pasteModal(title, hint){
    return new Promise(resolve=>{
      const ov=document.createElement('div');
      ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:sans-serif;';
      ov.innerHTML=`<div style="background:#fff;padding:20px;border-radius:8px;width:420px;max-width:90vw;box-shadow:0 4px 20px rgba(0,0,0,.3);">
        <div style="font-weight:bold;margin-bottom:8px;">${title}</div>
        <div style="font-size:12px;color:#666;margin-bottom:8px;">${hint}</div>
        <textarea id="__pasteArea" style="width:100%;height:220px;box-sizing:border-box;font-family:monospace;font-size:12px;padding:8px;" placeholder="Dán danh sách RC vào đây, mỗi dòng 1 mã..."></textarea>
        <div style="margin-top:12px;text-align:right;">
          <button id="__pasteCancel" style="margin-right:8px;padding:6px 14px;cursor:pointer;">Huỷ</button>
          <button id="__pasteOk" style="padding:6px 14px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;">Chạy</button>
        </div></div>`;
      document.body.appendChild(ov);
      const area=ov.querySelector('#__pasteArea'); area.focus();
      ov.querySelector('#__pasteOk').onclick=()=>{ const v=area.value; document.body.removeChild(ov); resolve(v); };
      ov.querySelector('#__pasteCancel').onclick=()=>{ document.body.removeChild(ov); resolve(null); };
    });
  }
  const RAW = await pasteModal('PHASE 1 — Dán list RC', 'Dán danh sách RC (mỗi dòng 1 mã) lấy từ Phase 0, rồi bấm Chạy.');
  if(RAW===null){ console.warn('⏹ Đã huỷ — không có dữ liệu.'); return; }
  const IDS = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];
  if(!IDS.length){ console.warn('⚠️ Danh sách rỗng — không có RC nào.'); return; }

  const API = 'https://voms-api.vgreen.net/api/v1/repair-cases';
  const RETRIES = 3, RETRY_WAIT = 1500, DELAY = 200;
  const STATUS_VI = { pending:'Chờ xử lý', assigned:'Đã phân công', accepted:'KTV đã nhận',
    in_progress:'Đang xử lý', processing:'Đang xử lý', completed:'Hoàn công',
    reopened:'Mở lại', closed:'Đóng', cancelled:'Đã huỷ', canceled:'Đã huỷ' };
  const viOf = c => STATUS_VI[c] || c || '(trống)';
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  async function ensureXLSX(){ if(window.XLSX) return window.XLSX; await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);}); return window.XLSX; }

  // ---- bắt Authorization + X-Tenant-Id (lọc theo URL) + fallback storage ----
  window.__hdr = window.__hdr || {};
  const WANT = /voms-api\.vgreen\.net\/api\/v1\/repair-cases/;
  if(!window.__hookInstalled){
    window.__hookInstalled=true;
    const Xo=XMLHttpRequest.prototype.open, Xs=XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open=function(m,u){this.__u=u;return Xo.apply(this,arguments);};
    XMLHttpRequest.prototype.setRequestHeader=function(k,v){ if(WANT.test(this.__u||'')){ if(/^authorization$/i.test(k))window.__hdr.Authorization=v; if(/^x-tenant-id$/i.test(k))window.__hdr['X-Tenant-Id']=v; } return Xs.apply(this,arguments); };
    const _f=window.fetch; window.fetch=function(input,init){ try{ const u=typeof input==='string'?input:(input&&input.url)||''; if(WANT.test(u)&&init&&init.headers){ const h=init.headers, get=k=>typeof h.get==='function'?h.get(k):h[k]; const a=get('Authorization')||get('authorization'),t=get('X-Tenant-Id')||get('x-tenant-id'); if(a)window.__hdr.Authorization=a; if(t)window.__hdr['X-Tenant-Id']=t; } }catch(e){} return _f.apply(this,arguments); };
  }
  function tokenFromStorage(){ for(const s of [localStorage,sessionStorage]){ for(let i=0;i<s.length;i++){ const m=(s.getItem(s.key(i))||'').match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/); if(m)return m[0]; } } return null; }
  function authHeaders(){ let auth=window.__hdr.Authorization,tid=window.__hdr['X-Tenant-Id'];
    if(!auth){const t=tokenFromStorage();if(t)auth='Bearer '+t;}
    if(!tid&&auth){try{tid=JSON.parse(atob(auth.replace('Bearer ','').split('.')[1])).tid||'';}catch(e){}}
    const h={Accept:'application/json, text/plain, */*'}; if(auth)h.Authorization=auth; if(tid)h['X-Tenant-Id']=tid; return h; }

  for(let i=0;i<20&&!window.__hdr.Authorization&&!tokenFromStorage();i++) await sleep(150);
  if(!authHeaders().Authorization){ console.error('❌ Chưa bắt được token. Search 1 ticket bất kỳ trên VOMS rồi chạy lại.'); return; }

  async function fetchOne(rc){
    const url=`${API}?page=1&limit=10&search=${encodeURIComponent(rc)}`;
    for(let a=1;a<=RETRIES;a++){ try{ const r=await fetch(url,{credentials:'include',headers:authHeaders()});
      if(r.status===401||r.status===403){const e=new Error('HTTP '+r.status);e.fatal=true;throw e;}
      if(!r.ok) throw new Error('HTTP '+r.status); return await r.json();
    }catch(e){ if(e.fatal||a===RETRIES)throw e; await sleep(RETRY_WAIT); } }
  }

  // ---- quét ----
  const results=[]; window.__scanStop=false;
  console.log(`%c▶️ PHASE 1 — quét ${IDS.length} RC qua VOMS...`,'font-weight:bold;color:#2563eb');
  for(let i=0;i<IDS.length;i++){
    if(window.__scanStop){console.warn('⏹ Dừng theo yêu cầu.');break;}
    const rc=IDS[i]; const rec={stt:i+1,rc,status:'',statusRaw:'',station:'',note:''};
    try{
      const d=await fetchOne(rc);
      const items=d?.data?.items||[]; const total=d?.data?.meta?.totalItems??items.length;
      if(total===0||!items.length){ rec.status='Không có dữ liệu'; rec.note='không tìm thấy'; }
      else{ const it=items.find(x=>x.code===rc)||items[0];
        rec.statusRaw=it.status||''; rec.status=viOf(it.status);
        rec.station=it.station?(it.station.stationCode||''):'';
        if(total>1) rec.note=total+' kết quả khớp'; }
    }catch(e){ if(e.fatal){console.error('❌ Token hết hạn. F5 đăng nhập lại rồi chạy lại.');break;} rec.status='LỖI gọi API'; rec.note=String(e.message||e); }
    results.push(rec);
    console.log(`[${i+1}/${IDS.length}] ${rc} -> ${rec.status}${rec.note?'  ⚠️ '+rec.note:''}`);
    if(DELAY) await sleep(DELAY);
  }

  // ---- gom theo trạng thái ----
  const byStatus={}; results.forEach(r=>{(byStatus[r.status]=byStatus[r.status]||[]).push(r.rc);});
  console.log('%c\n===== TỔNG HỢP THEO TRẠNG THÁI =====','font-weight:bold');
  console.table(Object.keys(byStatus).sort((a,b)=>byStatus[b].length-byStatus[a].length).map(k=>({'Trạng thái':k,'Số RC':byStatus[k].length})));

  window.__scanResults=results; window.__scanByStatus=byStatus;
  const closed = byStatus['Đóng']||[]; window.__closedRC=closed;
  try{ copy(closed.join('\n')); }catch(e){}
  console.log(`%c✅ ${closed.length} RC đã ĐÓNG — đã copy vào clipboard, dán sang PHASE 2.`,'color:#16a34a');
  console.log('Lấy lại bất cứ nhóm nào:  copy(__scanByStatus["Đóng"].join("\\n"))   |   Nhóm khác: Object.keys(__scanByStatus)');

  // ---- Xuất Excel (.xlsx): sheet chi tiết + sheet tổng hợp ----
  try{
    const XLSX=await ensureXLSX();
    const wb=XLSX.utils.book_new();
    const det=[['STT','RC','Trạng thái','Status raw','Mã trạm','Ghi chú']];
    results.forEach(r=>det.push([r.stt,r.rc,r.status,r.statusRaw,r.station,r.note]));
    const ws=XLSX.utils.aoa_to_sheet(det);
    det.forEach((_,r)=>{ if(r>0){ const c=ws['B'+(r+1)]; if(c)c.t='s'; } }); // cột RC = Text
    ws['!cols']=[{wch:5},{wch:18},{wch:14},{wch:12},{wch:12},{wch:22}];
    XLSX.utils.book_append_sheet(wb,ws,'Chi_tiet');
    const sum=[['Trạng thái','Số RC']];
    Object.keys(byStatus).sort((a,b)=>byStatus[b].length-byStatus[a].length).forEach(k=>sum.push([k,byStatus[k].length]));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sum),'Tong_hop');
    const ts=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    XLSX.writeFile(wb,`output_phase1_voms_by_rc_${ts}.xlsx`);
    console.log(`📄 Đã xuất output_phase1_voms_by_rc_${ts}.xlsx`);
  }catch(e){ console.warn('Không xuất được Excel: '+(e.message||e)); }
})();