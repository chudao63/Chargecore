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
RC-PXOXWMJKG3SO5R
RC-L3L36E0RR7CY7
RC-1W5WMQYQ70AWR6
RC-M5O53JJO1EA3M
RC-3LNLG1LY71T49M
RC-9404RY41EWT5DQ
RC-K6Q6X6PM6NT49
RC-YROR9LL4MNI1Q
RC-YRORP6DDW0F19
RC-K6Q66MP7MRIEL
RC-D969Q61XL3FGW0
RC-O7O31LEEKDIQL
RC-QWJ2WQPJNKA14X
RC-NQO6JYK6EOU911
RC-0X6OXM35YKTQ2E
RC-R1D172MDOLCJG
RC-R1D14LNXYYSGY
RC-GO5ONRXPKQTL2
RC-XR2RN7GQPJAYPK
RC-R1D17YLQ4LUXW
RC-6EJEO91W5OC27W
RC-D96975NP7XT1G
RC-GO5OLL5YD0SP6P
RC-GO5OLXM3OQIPEE
RC-YRORNGKDG7SDYM
RC-1W5WLG4NW2AW09
RC-9404L615LEFP4
RC-YRORGWM2GGFDNO
RC-R1D1267M5XA67
RC-NQOQEEE7WPT9PJ
RC-M5O5K702JOB9
RC-XR2R66JK21UD1
RC-9404G6WM0JUDQ
RC-6EJEDD5YQNTOO
RC-PXOXQ14DOOU7M
RC-D969JN5YOXFGM0
RC-5NJNW2R47PAXK
RC-0X6XGGO542FKY
RC-6EJEJX41JQC27O
RC-JPKPL3RQXPTO0
RC-0X6XWEP6R6CQP4
RC-5NJN224O3PUO7
RC-3LNL7JO3X9S4E7
RC-9404Q11NPXUXW
RC-6EJE6QN6G3S7O
RC-EN9NE30OJXCW5K
RC-2151704OWEC6M
RC-0X6400JW74BQRM
RC-4G750XYPQDH15X
RC-M5OMWED47KCL6
RC-L3LGXW5XQMC1MK
RC-XR2MPLM9GLUY9G
RC-7OJXE3397GCRK
RC-O7OMP5P5DYTMW
RC-2156W04141H1M3
RC-D96QWE2QX2S9L
RC-5NJQ0OW5ODTO
RC-O7O39OE01DH5MM
RC-WOLM0LD9Y2CD21
RC-21561Q001OH1KJ
RC-WOLMOJ5X2MTX1
RC-JPK991GYEDB0PK
RC-M5OMMN5LN6B93
RC-L3LG4Y536ES6P
RC-EN97XLDPD2IWKO
RC-YRODX443PMSDK
RC-GO5WR9033KS6X
RC-L3LGR0M3E6TKR
RC-3LN3EOO417F4K3
RC-L3LGONEM0JT163


RC-L3LGPJKXXNIJ4
RC-94017QRQPNU0M
RC-JPK955WKL2U0J4
RC-YRODO91XM3BMR
RC-EN9797E0NNUM1
RC-XR2M2612J2IQY
RC-EN9795135EHWGQ
RC-M5OMOGJORPIEQ
RC-GO5W5YO1YLU27
RC-EN97E4EP35H0E
RC-0X64W5NGO6IX3
RC-EN973RMKK0SW13
RC-6EJ735MJQLI24P
RC-L3LG077QPOUXG
RC-M5OP7021DXI1E
RC-5NJQ1DDJERUNR
RC-D96QG1L6Y2BNX
RC-YRO0YYEYP4HJD
RC-O7O3RK0J76F62
RC-L3LG9WD03EC6P
RC-K6QNGQ73XOAGQ
RC-R1DMKYR64RI4W
RC-XR2MKLKMK3U6E
RC-QWJMG6311LC76
RC-QWJQ4R93G1UX9
RC-M5OPQ9Q74XFM0W
RC-WOL9YYO20XCE3
RC-JPLMGW3P3OHM6
RC-3L7N2D40MDF4GN
RC-0XW499MQL6TYR
RC-L3L46J39RRA2P
RC-PXO57XN3KMFO1
RC-YRO041RRY2FM7
RC-WOL947GL71ARN
RC-0X6O7JPEXQB54
RC-XR2N4XEYP5FYYO
RC-6EJOEERL4JU24X
RC-NQO6QYPGX1C4Y
RC-1W5O14ELW2IEY
RC-GO51W4PRXYIDW
RC-4G7OKPMLY3A1DR
RC-L3L4N0L1WDB1LO
RC-JPKNR31K4LAK9
RC-3LNJKW4GG4T77
RC-JPKNJPGG5LAM3
RC-O7O34WM2NKT6K
RC-3LNJE6MYPETJ4
RC-K6Q0OGDMGDCO2J
RC-215O31J97WF1E4
RC-R1D707Y57MB65
RC-D9675Y090RU7Q
RC-6EJO0DY025U23

RC-1W5O2DJQ1LUWQ0
RC-2152G56W7OI0L
RC-940OGLQX9MBLK
RC-QWJQD0R0P9HDR
RC-QWJQ7E21E3H1X3
RC-YRO0W7QK3WSDDQ
RC-GO51PY4MN6APWO
RC-EN9X9J0OLETWJ1
RC-5NJO66OOWKH66
RC-EN9D2LOQPOHO7

















RC-JPKRODD12PF02X
RC-D96RWER6X5BQ4
RC-XR2740RM3QF5P
RC-NQP6KMXLX4T9PL
RC-6EJ97D736YSDD
RC-YROX244MKWADXM
RC-M5ORN19QWQCGQ
RC-215G2OKL69S6R
RC-215G950OR9C1LP
RC-R1D43D406LFX4
RC-1W57LQNNDECW6Y
RC-7OJ09QJJ6EHP0N
RC-XR27YQ5J30UPD
RC-7OJ09240XJHYW
RC-0X6QDRL4WGTQ7O
RC-4G71J4X107U1LD


RC-JPKR24G7RPF01J
RC-K6QRDP79OOAY5
RC-M5ORDN5EGXFLQ
RC-L3LROMR95KHEM

RC-M5ORKJY4NDCMYG
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
RC-L3LYNPMNXDC3Q
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
RC-940935DEJMH5QK
RC-6EJME05G4QSEJ

RC-WOLW1D42E0B5O
RC-1W59K0KR93FW94
RC-WOLG6E69EWFX3
RC-1W59K2DNKQSWO0
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
RC-GO5N4WWNK2BPWL
RC-R1D31ON79LCD
RC-PXOPXNQOD5CGM
RC-5NJYN6RQKGCGN
RC-WOLWMMX731SDYX
RC-215L6ORP0GCMQ

RC-M5ON4501YGC9X
RC-D96N3DPR30SYO
RC-0X6P0WNPN0I9K
RC-D96344W7YWFGME
RC-940E97DQ1EANN
RC-PXOKEK1757U75
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
    XLSX.writeFile(wb,`voms-status-${ts}.xlsx`);
    console.log(`📄 Đã xuất voms-status-${ts}.xlsx`);
  }catch(e){ console.warn('Không xuất được Excel: '+(e.message||e)); }
})();