/* =========================================================
   VOMS — PHASE 1: Quét trạng thái theo RC
   Chạy ở trang VOMS (voms.vgreen.net), đã đăng nhập.
   F12 -> Console -> dán list RC vào RAW -> dán cả file -> Enter.
   Bước trước đó: search thử 1 ticket trên VOMS 1 lần để script bắt được token.
   Kết quả: lọc RC "Đóng" + auto-copy list RC đã đóng (dán sang PHASE 2).
   Dừng giữa chừng: window.__scanStop = true
   ========================================================= */
(async () => {
  // ---- DÁN LIST RC (mỗi dòng 1 cái) — từ PHASE 0 ----
  const RAW = `
RC-NQOXNQQEN3S9QQ
RC-QWJLDE2GOOB12G
RC-M5O7LO3PGPUM3L
RC-WOL07P4GEMIDDM
RC-0X6XJE92G7FQWN
RC-XR2R07R09OTY0R
RC-XR2RLWQG6ESYPP
RC-6EJE4G1E1JUXD
RC-NQOQQ0GOORU9X7
RC-5NJNQ2Y62KF7K
RC-QWJQP39G32HP5
RC-L3L3NJYDXKT2X
RC-D96Q201P1PFOR
RC-M5O5PP0Y35AMD0
RC-9404P9YEQQH5MX
RC-GO5OLXM3OQIPEE
RC-XR2RWE0012SY31
RC-R1D1DL0GQOTL2
RC-7OJXE3397GCRK
RC-O7O39OE01DH5MM
RC-JPK991GYEDB0PK
RC-M5OMMN5LN6B93
RC-EN97XLDPD2IWKO
RC-YRODX443PMSDK
RC-GO5WR9033KS6X
RC-JPK9G47OP6H0O0
RC-L3LGONEM0JT163


RC-YRODO91XM3BMR
RC-GO5W5YO1YLU27
RC-0X64W5NGO6IX3
RC-M5OP7021DXI1E
RC-O7O3RK0J76F62
RC-L3LG9WD03EC6P
RC-R1DMKYR64RI4W
RC-XR2MKLKMK3U6E
RC-QWJMG6311LC76
RC-QWJQ4R93G1UX9
RC-M5OPQ9Q74XFM0W
RC-WOL9YYO20XCE3
RC-JPLMGW3P3OHM6
RC-3L7N2D40MDF4GN
RC-0XW499MQL6TYR
RC-YRO041RRY2FM7
RC-K6Q0X3M4O2H77
RC-0X6O7JPEXQB54
RC-XR2N4XEYP5FYYO
RC-6EJOEERL4JU24X
RC-NQO6QYPGX1C4Y
RC-1W5O14ELW2IEY
RC-GO51W4PRXYIDW
RC-K6Q0OGDMGDCO2J
RC-215O31J97WF1E4

RC-2152G56W7OI0L
RC-QWJQ7E21E3H1X3
RC-YRO0W7QK3WSDDQ
RC-GO51PY4MN6APWO
RC-EN9X9J0OLETWJ1
RC-EN9D2LOQPOHO7

















RC-JPKRODD12PF02X
RC-D96RWER6X5BQ4
RC-XR2740RM3QF5P
RC-NQP6KMXLX4T9PL
RC-6EJ97D736YSDD
RC-YROX244MKWADXM
RC-215G2OKL69S6R
RC-215G950OR9C1LP
RC-XR27YQ5J30UPD
RC-7OJ09240XJHYW
RC-4G71J4X107U1LD


RC-JPKR24G7RPF01J
RC-K6QRDP79OOAY5
RC-M5ORDN5EGXFLQ

RC-JPKRWDD65OI0DQ
RC-XR272R3OP3HP0
RC-PXOY7P3KROAOP6
RC-R1DRE63OY2C51
RC-PXORL039DOF7X
RC-GO5RYMMMQPBPEP
RC-GO5L3QG4EQHP20


RC-0X6KR4QM6LF6X
RC-940KR55X01T7E
RC-4G7KRNN03GA66
RC-GO5L4LKLDOCQ5
RC-6EJKEE3R0MS2MD
RC-EN9WNOY172UWK
RC-0X6KQLY31PBQM0
RC-2152GMYE56CP0
RC-M5OGJYKWJ9SQP
RC-JPKYJ5MO4NA0O5
RC-K6QM49ELWMTY6
RC-0X6K6KN9YDTJJ
RC-D96XJEOLR9IGKQ
RC-WOLGYL2W3XCDP1
RC-3LNKN9X91EFXJ
RC-XR2DJRG94JSP9
RC-3LN91M22KDI4X2
RC-4G7J6X770QUPQ
RC-5NJM49JO1JUQR
RC-WOLWKOENM1HD0W
RC-K6QOY630JEUJ3
RC-6EJME05G4QSEJ

RC-WOLW1D42E0B5O
RC-1W59K0KR93FW94
RC-WOLG6E69EWFX3
RC-5NJM1RG5QNI142
RC-3LN9NOON25FOP
RC-EN9MG1DMYJFYE
RC-GO5JP9NMJ5F4E
RC-215952ERJ1T2M
RC-QWJR53D702H17D
RC-2159MEK9JLC15Y
RC-WOLGXP27EESDL2
RC-1W59YEPYW9SR3
RC-1W59J02267AJQ
RC-K6QO6WJNO0SE4
RC-7OJ95Y57DQA39
RC-GO5NG77550IPK0
RC-L3LNW91NNGFEG
RC-O7O4PD9015S596
RC-R1D31ON79LCD
RC-PXOPXNQOD5CGM
RC-WOLWMMX731SDYX
RC-215L6ORP0GCMQ

RC-M5ON4501YGC9X
RC-0X6P0WNPN0I9K
RC-D96344W7YWFGME
RC-940E97DQ1EANN
RC-WOL2DWQG2PTD60
`;
  const IDS = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];

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