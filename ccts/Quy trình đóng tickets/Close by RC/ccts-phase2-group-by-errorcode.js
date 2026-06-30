/* =========================================================
   CCTS — PHASE 2: Nhóm RC đã đóng theo errorCode
   Chạy ở trang CCTS (console.cnpowercore.com), đã đăng nhập.
   F12 -> Console -> dán list RC ĐÃ ĐÓNG vào RAW -> dán cả file -> Enter.
     - Nếu vừa chạy PHASE 0 cùng tab: tự dùng lại window.__cctsTable (nhanh).
     - Nếu không: search list 1 lần (bắt token) rồi gõ:  groupByErr()
   Output: in list RC từng nhóm errorCode + Excel nhiều sheet (mỗi mã 1 sheet).
   ========================================================= */
(function(){
  // ---- DÁN LIST RC ĐÃ ĐÓNG (từ PHASE 1) ----
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
RC-0X6KQLY31PBQM0
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
RC-D96N3DPR30SYO
RC-0X6P0WNPN0I9K
RC-D96344W7YWFGME
RC-PXOKEK1757U75
RC-WOL2DWQG2PTD60

`;
  const wantRC = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];

  const CFG = { cctsTicketName:'EV', cctsTicketOwnerName:'dinh',
    createStartTime:'2026-05-31 17:00:00', createStopTime:'2026-06-30 17:00:00',
    ticketStatus:['Pending for local team close'], pageSize:100 };
  const URL='https://cloud.cnpowercore.com:8091/ccts/cctsTicket/findCCTSTicket';

  window.__cctsToken=window.__cctsToken||'';
  function grab(b){try{if(typeof b==='string'){const m=b.match(/"token"\s*:\s*"([^"]+)"/);if(m)window.__cctsToken=m[1];}}catch(e){}}
  if(!window.__cctsHooked){window.__cctsHooked=true;
    const _f=window.fetch;window.fetch=function(...a){try{grab(a[1]&&a[1].body);}catch(e){}return _f.apply(this,a);};
    const _s=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.send=function(b){grab(b);return _s.apply(this,arguments);};}

  async function ensureXLSX(){if(window.XLSX)return window.XLSX;await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});return window.XLSX;}

  const H={'content-type':'application/json;charset=UTF-8','accept':'application/json, text/plain, */*'};

  async function fetchPage(pageNum){
    const body={page:{pageNum,pageSize:CFG.pageSize},timezoneOffset:420,cctsTicketName:CFG.cctsTicketName,cctsTicketOwnerName:CFG.cctsTicketOwnerName,createStartTime:CFG.createStartTime,createStopTime:CFG.createStopTime,ticketStatus:CFG.ticketStatus,slaTimeout:'0',token:window.__cctsToken};
    const res=await fetch(URL,{method:'POST',credentials:'include',headers:H,body:JSON.stringify(body)});
    if(!res.ok)throw new Error('HTTP '+res.status); return res.json();
  }

  // Solution: lấy field cctsTicketSolutionContent (đọc text + regex, nhiều bản ghi nối bằng |||)
  async function fetchSolution(pk){
    try{
      const res=await fetch('https://cloud.cnpowercore.com:8091/ccts/cctsTicketSolution/findCCTSTicketSolution',
        {method:'POST',credentials:'include',headers:H,body:JSON.stringify({cctsTicketPk:String(pk),page:{pageNum:1,pageSize:50},token:window.__cctsToken})});
      if(!res.ok) return '';
      const text=await res.text(); const re=/"cctsTicketSolutionContent"\s*:\s*"((?:\\.|[^"\\])*)"/g;
      const out=[]; let m; while((m=re.exec(text))){ try{out.push(JSON.parse('"'+m[1]+'"'));}catch(e){out.push(m[1]);} }
      return out.filter(Boolean).join(' ||| ');
    }catch(e){ return ''; }
  }

  // Spare parts: getRecordList (field body là ticketPk). Gom good + broken, đếm file (imageUrl)
  async function fetchSpare(pk){
    const res0={parts:'', goodN:0, brokenN:0, fileN:0, files:''};
    try{
      const res=await fetch('https://cloud.cnpowercore.com:8091/ccts/chargeBoxMaterialUsageRecord/getRecordList',
        {method:'POST',credentials:'include',headers:H,body:JSON.stringify({ticketPk:String(pk),page:{pageNum:1,pageSize:50},token:window.__cctsToken})});
      if(!res.ok) return res0;
      const d=await res.json(); const list=(d&&d.data&&d.data.list)||[];
      const good=[], broken=[], files=[];
      list.forEach(r=>{
        (r.goodMaterialList||[]).forEach(m=>{ good.push(`${m.name}${m.model?' ('+m.model+')':''} x${m.count||1}`); if(m.imageUrl) files.push(m.imageUrl); });
        (r.brokenMaterialList||[]).forEach(m=>{ broken.push(`${m.name}${m.model?' ('+m.model+')':''} x${m.count||1}`); if(m.imageUrl) files.push(m.imageUrl); });
      });
      const uniqFiles=[...new Set(files)];
      const parts=[ good.length?('Lắp: '+good.join('; ')):'', broken.length?('Tháo: '+broken.join('; ')):'' ].filter(Boolean).join(' | ');
      return { parts, goodN:good.length, brokenN:broken.length, fileN:uniqFiles.length, files:uniqFiles.join('\n') };
    }catch(e){ return res0; }
  }
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  window.groupByErr = async function(){
    if(!wantRC.length){ console.warn('⚠️ RAW trống — dán list RC đã đóng vào.'); return; }

    // map RC -> info
    let map={};
    if(window.__cctsTable && window.__cctsTable.length){
      window.__cctsTable.forEach(x=>{ if(x.rc) map[x.rc]=x; });
      console.log('Dùng lại __cctsTable từ PHASE 0 ('+Object.keys(map).length+' RC).');
    } else {
      if(!window.__cctsToken){ console.warn('⚠️ Chưa bắt được token. Search list 1 lần rồi gõ lại: groupByErr()'); return; }
      console.log('%c🚀 PHASE 2 — quét lại findCCTSTicket lấy errorCode','font-weight:bold;color:#2563eb');
      let pageNum=1,total=Infinity,n=0;
      while(n<total){ let d; try{d=await fetchPage(pageNum);}catch(e){console.error('Lỗi trang '+pageNum+': '+e.message);break;}
        const data=d.data||{};total=Number(data.total||0);const list=data.list||[];
        list.forEach(t=>{ if(t.thirdTicketId) map[t.thirdTicketId]={rc:t.thirdTicketId,cctsTicketId:String(t.cctsTicketId),cctsTicketPk:String(t.cctsTicketPk),errorCode:t.errorCode||'',errorName:t.errorName||'',stationCode:t.stationCode||''}; });
        n+=list.length; console.log(`  trang ${pageNum}: +${list.length} (${n}/${total})`);
        if(!list.length)break; pageNum++; if(pageNum>50)break;
      }
    }

    // gom nhóm theo errorCode (trống -> KHONG_CO_MA)
    const groups={}, notFound=[];
    wantRC.forEach(rc=>{ const info=map[rc];
      if(!info){ notFound.push(rc); return; }
      const k=(info.errorCode&&info.errorCode.trim())?info.errorCode.trim():'KHONG_CO_MA';
      (groups[k]=groups[k]||[]).push(info);
    });
    const keys=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);
    window.__byErr={}; keys.forEach(k=>window.__byErr[k]=groups[k].map(x=>x.rc));

    // ---- enrich: Solution + Spare parts cho từng RC (2 call/RC) ----
    const all=[]; keys.forEach(k=>all.push(...groups[k]));
    console.log(`%c⏳ Lấy Solution + Spare parts cho ${all.length} ticket...`,'color:#2563eb');
    for(let i=0;i<all.length;i++){
      const x=all[i];
      x.solution = await fetchSolution(x.cctsTicketPk);
      const sp = await fetchSpare(x.cctsTicketPk);
      x.parts=sp.parts; x.fileN=sp.fileN; x.files=sp.files;
      if((i+1)%10===0||i===all.length-1) console.log(`   ${i+1}/${all.length}`);
      await sleep(120);
    }

    console.log('%c\n===== NHÓM THEO errorCode =====','font-weight:bold');
    keys.forEach(k=>console.log(`\n--- [${k}] : ${groups[k].length} RC ---\n`+groups[k].map(x=>x.rc).join('\n')));
    if(notFound.length) console.log(`%c\n❌ ${notFound.length} RC không thấy trong list (sai filter / khác kỳ?):\n`+notFound.join('\n'),'color:#dc2626');
    console.log('%c\n📋 Copy RC 1 nhóm để dán PHASE 3:  copy(__byErr["C2405"].join("\\n"))','color:#16a34a');
    console.log('   Xem các nhóm:  Object.keys(__byErr)');

    // Excel nhiều sheet
    const XLSX=await ensureXLSX(); const wb=XLSX.utils.book_new();
    const sum=[['errorCode','Số RC']]; keys.forEach(k=>sum.push([k,groups[k].length]));
    if(notFound.length){sum.push([]);sum.push(['KHONG_THAY_TRONG_LIST',notFound.length]);}
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sum),'TONG_HOP');
    const safe=s=>(String(s).replace(/[\\/?*\[\]:]/g,'_').slice(0,31)||'X');
    const header=['STT','RC (dán Phase 3)','cctsTicketId','errorName','stationCode','Solution','Vật tư (spare)','Số file','Link file'];
    keys.forEach(k=>{ const rows=[header];
      groups[k].forEach((x,i)=>rows.push([i+1,x.rc,x.cctsTicketId,x.errorName,x.stationCode,x.solution||'',x.parts||'',x.fileN||0,x.files||'']));
      const ws=XLSX.utils.aoa_to_sheet(rows);
      rows.forEach((_,r)=>{if(r>0){const c=ws['C'+(r+1)];if(c)c.t='s';}});
      ws['!cols']=[{wch:5},{wch:18},{wch:22},{wch:28},{wch:12},{wch:50},{wch:40},{wch:7},{wch:45}];
      XLSX.utils.book_append_sheet(wb,ws,safe(k));
    });
    if(notFound.length){const nf=[['RC']];notFound.forEach(rc=>nf.push([rc]));XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(nf),'KHONG_THAY');}
    XLSX.writeFile(wb,'ccts-nhom-loi.xlsx');
    console.log('📄 Đã xuất ccts-nhom-loi.xlsx (mỗi errorCode 1 sheet, cột RC để dán Phase 3).');
  };

  // Tự chạy nếu đã có __cctsTable; không thì chờ gọi tay sau khi bắt token
  if(window.__cctsTable && window.__cctsTable.length){ window.groupByErr(); }
  else { console.log('🔌 PHASE 2 sẵn sàng. Search list 1 lần (bắt token) rồi gõ: groupByErr()'); }
})();