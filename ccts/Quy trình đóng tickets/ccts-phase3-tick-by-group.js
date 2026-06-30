(function tickByPk(){
  // ===== DÁN ID NHÓM TỪ EXCEL VÀO GIỮA 2 DẤU ` (dạng UI, kết thúc ...0) =====
  const RAW = `
1123769398138896384
1123752141192298496
`;
  // =========================================================================

  const IDS = [...new Set(RAW.split(/\s+/).map(s=>s.trim()).filter(Boolean))];
  const targets = new Set(IDS);

  function findAppDoc(win){
    try { if (win.document.querySelector('.el-table tbody tr')) return win.document; } catch(e){}
    let frames; try{ frames=win.frames; }catch(e){ frames=null; }
    if (frames){ for (let i=0;i<frames.length;i++){ try{ const d=findAppDoc(frames[i]); if(d) return d; }catch(e){} } }
    return null;
  }
  const doc = findAppDoc(window) || document;
  let rows = [...doc.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tbody tr')];
  if (!rows.length) rows = [...doc.querySelectorAll('tr')];

  console.log(`%c🎯 PHASE 3 — Tick ${IDS.length} ticket (${rows.length} dòng trên màn hình)`, 'font-weight:bold;color:#2563eb');

  const status = new Map(); // id -> trạng thái
  let ticked=0, already=0, disabled=0;

  rows.forEach(row=>{
	let hitId=null;
    const nums = row.textContent.match(/\d{17,25}/g) || [];
    for (const raw of nums){
      const dn = Number(raw);
      const hit = IDS.find(t => t===raw || Math.abs(Number(t)-dn) <= 512);
      if (hit){ hitId = hit; break; }
    }
	
    if (!hitId || status.has(hitId)) return;

    const cb = row.querySelector('td.el-table-column--selection .el-checkbox')
            || row.querySelector('.el-checkbox')
            || row.querySelector('input[type=checkbox]');
    if (!cb){ status.set(hitId,'no-cb'); return; }

    if (cb.classList && cb.classList.contains('is-disabled')){ status.set(hitId,'disabled'); disabled++; return; }
    const isChecked = (cb.classList && cb.classList.contains('is-checked')) || cb.checked===true;
    if (isChecked){ status.set(hitId,'already'); already++; return; }

    (cb.querySelector ? (cb.querySelector('.el-checkbox__inner')||cb) : cb).click();
    status.set(hitId,'ticked'); ticked++;
  });

  const ICON = { ticked:'✅ tick mới', already:'☑️ đã sẵn tick', disabled:'🚫 disabled', 'no-cb':'⚠️ không thấy checkbox' };
  const COLOR= { ticked:'#16a34a', already:'#6b7280', disabled:'#d97706', 'no-cb':'#dc2626' };
  IDS.forEach((id,i)=>{
    const st = status.get(id) || 'notfound';
    if (st==='notfound'){ console.log(`%c[${String(i+1).padStart(2,'0')}] ❌ ${id}  → không thấy trên màn hình`, 'color:#dc2626'); }
    else { console.log(`%c[${String(i+1).padStart(2,'0')}] ${ICON[st]}  ${id}`, `color:${COLOR[st]}`); }
  });

  const notFound = IDS.filter(id=>!status.has(id));
  console.log(`%c\n===== TỔNG HỢP PHASE 3 =====`, 'font-weight:bold');
  console.log(`✅ Tick mới: ${ticked} | ☑️ Đã sẵn tick: ${already} | 🚫 Disabled: ${disabled} | ❌ Không thấy: ${notFound.length} | Khớp: ${status.size}/${IDS.length}`);
  if (notFound.length) console.log(`❌ Không thấy trên màn hình:\n`+notFound.join('\n'));
})();