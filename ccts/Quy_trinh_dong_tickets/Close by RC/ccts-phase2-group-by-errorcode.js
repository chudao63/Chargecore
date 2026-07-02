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
RC-6EJ7D73RGGS07
RC-L3L45XW1QGH1RM
----
RC-XR2MX5EM69AYP6
RC-6EJ71M5RKRI2P7
RC-M5OP5KRW4QCE2
RC-GO51RW2M25TJE
RC-3LNJD9160PS4P5
RC-6EJOJ0OER0UPY
RC-O7OGRRGG7LFJ3
RC-1W57L225K0IXQ
RC-EN9DM24DKEHRQ
RC-QWJYJN73NDI0R
RC-NQOYM790N4H2W
RC-K6QMMDX9RMFD
RC-21523GWRGDH1E9
RC-0X6L6NXDD7TJP
RC-QWJPXYE1QJU6L
RC-O7OEKR4RJ3CY5


`;
  const wantRC = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];

  const CFG = { cctsTicketName:'EV', cctsTicketOwnerName:'dinh',
    createStartTime:'2026-05-31 17:00:00', createStopTime:'2026-06-30 17:00:00',
    ticketStatus:['Pending for local team close'], pageSize:100 };

  // ===== ĐIỀU KIỆN TỰ ĐÓNG (sửa cho đúng nghiệp vụ) =====
  // 1) Mã lỗi thuộc nhóm "tự clear" — THÊM/BỚT mã ở đây:
  const SELF_CLEAR_CODES = ['A0112','CONNECTION_LOST'];  // A0112 = Open door; thêm vd 'C2405','C0410'...
  // 2) Solution phải xác nhận trụ bình thường (tự khỏi). Khớp 1 trong các từ khoá:
  const SOLUTION_OK_RE = /bình thường|hoạt động bình thường|tự (hồi|khôi phục|clear|recover)/i;
  // (Ngoài ra: phải ontime slaTimeout=0 + KHÔNG gắn spare part — script tự kiểm.)

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
      const filesOf=m=>{ const u=[]; if(m.imageUrl) u.push(m.imageUrl); (m.attachments||[]).forEach(a=>{ if(a&&a.url) u.push(a.url); }); return u; };
      list.forEach(r=>{
        (r.goodMaterialList||[]).forEach(m=>{ good.push(`${m.name}${m.model?' ('+m.model+')':''} x${m.count||1}`); filesOf(m).forEach(u=>files.push(u)); });
        (r.brokenMaterialList||[]).forEach(m=>{ broken.push(`${m.name}${m.model?' ('+m.model+')':''} x${m.count||1}`); filesOf(m).forEach(u=>files.push(u)); });
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
        list.forEach(t=>{ if(t.thirdTicketId) map[t.thirdTicketId]={rc:t.thirdTicketId,cctsTicketId:String(t.cctsTicketId),cctsTicketPk:String(t.cctsTicketPk),errorCode:t.errorCode||'',errorName:t.errorName||'',stationCode:t.stationCode||'',slaTimeout:Number(t.slaTimeout||0)}; });
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
    XLSX.writeFile(wb,'output_phase2_group_by_errorcode.xlsx');
    console.log('📄 Đã xuất output_phase2_group_by_errorcode.xlsx (mỗi errorCode 1 sheet, cột RC để dán Phase 3).');
  };

  // Tự chạy nếu đã có __cctsTable; không thì chờ gọi tay sau khi bắt token
  if(window.__cctsTable && window.__cctsTable.length){ window.groupByErr(); }
  else { console.log('🔌 PHASE 2 sẵn sàng. Search list 1 lần (bắt token) rồi gõ: groupByErr()'); }
})();