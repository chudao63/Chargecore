/* =========================================================
   CCTS — PHASE 3: Tick các dòng theo RC rồi đóng tay
   Chạy ở trang CCTS, màn LIST ticket (đặt page size 100/200 để cả nhóm 1 trang).
   F12 -> Console -> dán cả file -> Enter -> 1 hộp thoại hiện ra, dán list RC 1 nhóm vào đó -> bấm Chạy.
   Khớp theo CHUỖI RC trong dòng (không dính làm tròn số). Chạy lại an toàn.
   Yêu cầu: list phải HIỂN THỊ cột chứa RC (thirdTicketId). Nếu báo "không thấy"
   hàng loạt -> list chưa bật cột RC (xem ghi chú cuối chat).
   ========================================================= */
(async function tickByRC(){
  // ---- Hộp thoại dán list RC 1 nhóm (giữ code không đổi qua các lần chạy, git không báo diff) ----
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
  const RAW = await pasteModal('PHASE 3 — Dán list RC 1 nhóm', 'Dán danh sách RC của 1 nhóm (lấy từ Phase 2), rồi bấm Chạy.');
  if(RAW===null){ console.warn('⏹ Đã huỷ — không có dữ liệu.'); return; }
  const IDS = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];
  if(!IDS.length){ console.warn('⚠️ Danh sách rỗng — không có RC nào.'); return; }
  const targets = new Set(IDS);

  function findAppDoc(win){
    try{ if(win.document.querySelector('.el-table tbody tr')) return win.document; }catch(e){}
    let fr; try{fr=win.frames;}catch(e){fr=null;}
    if(fr){for(let i=0;i<fr.length;i++){try{const d=findAppDoc(fr[i]);if(d)return d;}catch(e){}}}
    return null;
  }
  const doc=findAppDoc(window)||document;
  let rows=[...doc.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tbody tr')];
  if(!rows.length) rows=[...doc.querySelectorAll('tr')];

  console.log(`%c🎯 PHASE 3 — tick ${IDS.length} RC (${rows.length} dòng trên màn hình)`,'font-weight:bold;color:#2563eb');

  const status=new Map(); let ticked=0,already=0,disabled=0;
  rows.forEach(row=>{
    const txt=row.textContent||'';
    let hit=null;
    for(const rc of targets){ if(txt.indexOf(rc)>=0){ hit=rc; break; } } // khớp chuỗi RC
    if(!hit||status.has(hit)) return;

    const cb=row.querySelector('td.el-table-column--selection .el-checkbox')||row.querySelector('.el-checkbox')||row.querySelector('input[type=checkbox]');
    if(!cb){status.set(hit,'no-cb');return;}
    if(cb.classList&&cb.classList.contains('is-disabled')){status.set(hit,'disabled');disabled++;return;}
    const isChecked=(cb.classList&&cb.classList.contains('is-checked'))||cb.checked===true;
    if(isChecked){status.set(hit,'already');already++;return;}
    (cb.querySelector?(cb.querySelector('.el-checkbox__inner')||cb):cb).click();
    status.set(hit,'ticked');ticked++;
  });

  const ICON={ticked:'✅ tick mới',already:'☑️ đã sẵn tick',disabled:'🚫 disabled','no-cb':'⚠️ không thấy checkbox'};
  const COLOR={ticked:'#16a34a',already:'#6b7280',disabled:'#d97706','no-cb':'#dc2626'};
  IDS.forEach((id,i)=>{ const st=status.get(id)||'notfound';
    if(st==='notfound') console.log(`%c[${String(i+1).padStart(2,'0')}] ❌ ${id} → không thấy trên màn hình`,'color:#dc2626');
    else console.log(`%c[${String(i+1).padStart(2,'0')}] ${ICON[st]}  ${id}`,`color:${COLOR[st]}`);
  });
  const notFound=IDS.filter(id=>!status.has(id));
  console.log('%c\n===== TỔNG HỢP PHASE 3 =====','font-weight:bold');
  console.log(`✅ Tick mới: ${ticked} | ☑️ Đã sẵn: ${already} | 🚫 Disabled: ${disabled} | ❌ Không thấy: ${notFound.length} | Khớp: ${status.size}/${IDS.length}`);
  if(notFound.length) console.log('❌ Không thấy (RC ở trang khác / list chưa hiện cột RC):\n'+notFound.join('\n'));
})();