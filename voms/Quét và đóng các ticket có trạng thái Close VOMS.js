(() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => (s||'').toLowerCase().replace(/[\s\u00a0]+/g,'').trim();
  const setReactInput = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const realClick = el => {
    const o = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new PointerEvent('pointerdown', o));
    el.dispatchEvent(new MouseEvent('mousedown', o));
    el.dispatchEvent(new PointerEvent('pointerup', o));
    el.dispatchEvent(new MouseEvent('mouseup', o));
    el.dispatchEvent(new MouseEvent('click', o));
  };
  const waitFor = async (fn, { timeout = 30000, interval = 250 } = {}) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { const v = fn(); if (v) return v; await sleep(interval); }
    return null;
  };
  const findSearchInput = () => [...document.querySelectorAll('input[placeholder="Tìm kiếm..."]')].find(i => i.offsetParent !== null);
  const findDetailLink = id => [...document.querySelectorAll('a[href^="/repair-orders/"]')].find(a => a.textContent.replace(/[#\s]/g,'') === id.replace(/[#\s]/g,''));
  const findLogCpoCard = () => {
    const h3 = [...document.querySelectorAll('h3')].find(h => h.textContent.trim().toLowerCase().includes('log cpo'));
    return h3 ? h3.closest('.rounded-lg') : null;
  };
  const findEditBtn = () => [...document.querySelectorAll('button')].find(b => b.offsetParent !== null && !b.disabled && b.textContent.trim().toLowerCase() === 'chỉnh sửa');
  const findControlByLabel = t => {
    t = norm(t).replace(/[:*]/g,'');
    const l = [...document.querySelectorAll('label')].find(x => norm(x.textContent).replace(/[:*]/g,'') === t);
    return l ? l.parentElement.querySelector('[role="combobox"]') : null;
  };
  const getOpenCmdkPanel = () => [...document.querySelectorAll('[role="dialog"][data-state="open"]')].filter(p => p.offsetParent !== null && p.querySelector('[cmdk-root]')).pop();
  const findActionButton = text => {
    const t = text.toLowerCase();
    const btns = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && !b.disabled);
    return btns.find(b => [...b.querySelectorAll('span')].some(s => s.textContent.trim().toLowerCase() === t))
        || btns.find(b => b.textContent.trim().toLowerCase() === t) || null;
  };
  // tìm nút action KỂ CẢ khi disabled (để phân biệt "không có" vs "có nhưng xám")
  const findActionButtonAny = text => {
    const t = text.toLowerCase();
    return [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null)
      .find(b => [...b.querySelectorAll('span')].some(s => s.textContent.trim().toLowerCase() === t) || b.textContent.trim().toLowerCase() === t) || null;
  };
  const readAlarmName = () => {
    const lbl = [...document.querySelectorAll('span')].find(s => s.textContent.trim().replace(/:$/,'') === 'Tên cảnh báo CPO');
    if (!lbl) return null;
    return lbl.parentElement.querySelector('span:last-child')?.textContent.trim() || null;
  };

  const selectRadixOption = async (label, opt) => {
    const c = findControlByLabel(label); if (!c) return false;
    if (c.getAttribute('aria-expanded') !== 'true') { realClick(c); await sleep(300); }
    const want = norm(opt);
    const o = await waitFor(() => [...document.querySelectorAll('[role="option"]')].filter(x=>x.offsetParent!==null).find(x => norm(x.textContent) === want), { timeout: 4000, interval: 200 });
    if (!o) { document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); return false; }
    realClick(o); await sleep(250); return true;
  };
  const selectCmdkOption = async (label, opt) => {
    const want = norm(opt);
    const btn = findControlByLabel(label); if (!btn) return false;
    if (btn.getAttribute('aria-expanded') !== 'true') { realClick(btn); await sleep(500); }
    const search = getOpenCmdkPanel()?.querySelector('[cmdk-input]');
    const countItems = () => (getOpenCmdkPanel()?.querySelectorAll('[cmdk-item],[role="option"]')||[]).length;
    const before = countItems();
    if (search) { search.focus(); setReactInput(search, opt); }
    await waitFor(() => { const n = countItems(); return (search && n > 0 && n < before) || (n>0 && n <= 3) ? true : null; }, { timeout: 4000, interval: 150 });
    await sleep(300);
    let item = [...(getOpenCmdkPanel()?.querySelectorAll('[cmdk-item],[role="option"]')||[])].find(it => norm(it.textContent) === want);
    if (!item && search) { setReactInput(search,''); await sleep(600);
      item = [...(getOpenCmdkPanel()?.querySelectorAll('[cmdk-item],[role="option"]')||[])].find(it => norm(it.textContent) === want); }
    if (!item) return false;
    item.scrollIntoView({block:'nearest'}); item.dispatchEvent(new MouseEvent('mousemove',{bubbles:true})); await sleep(120);
    realClick(item); await sleep(350);
    let shown = btn.querySelector('span')?.textContent.trim();
    if (shown && shown.toLowerCase().includes('chọn') && search) {
      search.focus(); search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,bubbles:true})); await sleep(300);
    }
    shown = btn.querySelector('span')?.textContent.trim();
    return !(shown||'').toLowerCase().includes('chọn');
  };
  const isItemChecked = item => {
    const c = item.querySelector('svg.lucide-check'); if (!c) return false;
    if ((c.getAttribute('class')||'').includes('opacity-0')) return false;
    return parseFloat(getComputedStyle(c).opacity||'0') > 0.5;
  };
  const multiSelectCmdk = async (label, wants) => {
    const btn = findControlByLabel(label); if (!btn) return false;
    if (btn.getAttribute('aria-expanded') !== 'true') { realClick(btn); await sleep(400); }
    for (const w0 of wants) {
      const w = norm(w0);
      const item = await waitFor(() => [...(getOpenCmdkPanel()?.querySelectorAll('[cmdk-item],[role="option"]')||[])].find(it => norm(it.textContent) === w), { timeout: 4000, interval: 200 });
      if (!item || isItemChecked(item)) continue;
      item.scrollIntoView({block:'nearest'}); item.dispatchEvent(new MouseEvent('mousemove',{bubbles:true})); await sleep(80);
      realClick(item); await sleep(250);
    }
    document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await sleep(200);
    return true;
  };
  const fillTextarea = async (ph, val) => {
    const ta = [...document.querySelectorAll('textarea')].find(t => t.offsetParent !== null && (t.placeholder||'').toLowerCase().includes(ph.toLowerCase()));
    if (!ta) return false; ta.focus(); setReactInput(ta, val); ta.dispatchEvent(new Event('blur',{bubbles:true})); return true;
  };
  const clickActionEl = async btn => { btn.scrollIntoView({block:'center'}); await sleep(200); realClick(btn); await sleep(500); };
  const clickConfirmInDialog = async (text='Xác nhận') => {
    const scope = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],[data-slot="dialog-content"]')].filter(d=>d.offsetParent!==null).pop() || document;
    const t = text.toLowerCase();
    const btn = await waitFor(() => [...scope.querySelectorAll('button')].filter(b=>b.offsetParent!==null&&!b.disabled).find(b=>b.textContent.trim().toLowerCase()===t), { timeout: 5000, interval: 200 });
    if (!btn) return false; realClick(btn); await sleep(700); return true;
  };
  const goBackToList = async () => {
    history.back();
    await waitFor(() => findSearchInput(), { timeout: 8000 });
    await sleep(800);
  };

  const SUA_DEFAULT = 'KTV kiểm tra, trụ đã xanh, hoạt động bình thường';
  const HW_KHAC = ['Phần cứng','Khác'], KHAC = ['Khác'], HW = ['Phần cứng'];
  const mk = (chiTietLoi, nhomXuLy, hanhDong, moTaLoi, moTaSua=SUA_DEFAULT) => ({
    hinhThuc:'Tại trạm', phanLoai:'Sửa chữa', nhomLoi:'Trụ sạc OTĐ', chiTietLoi, nhomXuLy, hanhDong, moTaLoi, moTaSua,
  });
  const RAW = {
    'AcContactorActionError':               mk('Lỗi AC contactor', HW_KHAC, 'Khắc phục sự cố khác', 'Lỗi AC contactor', 'Trụ xanh hết lỗi'),
    'Connector Temperature Failure':        mk('Lỗi trụ khác',     HW_KHAC, 'Khắc phục sự cố khác', 'Lỗi Connector Temperature Failure'),
    'DC Contactor DcOutputContactorError':  mk('Lỗi DC contactor', HW_KHAC, 'Khắc phục sự cố khác', 'DC Contactor DcOutputContactorError'),
    'DcOutputContactorError':               mk('Lỗi DC contactor', HW_KHAC, 'Khắc phục sự cố khác', 'DcOutputContactorError'),
    'DCMeterDataMismatch':                  mk('Lỗi DC meter',     HW_KHAC, 'Khắc phục sự cố khác', 'DCMeterDataMismatch'),
    'DoorAccessDetected':                   mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Lỗi mở cửa'),
    'FanFailure':                           mk('Lỗi quạt làm mát', HW,      'Thay LK cơ khí',       'Lỗi quạt'),
    'Flood Sensor Triggered':               mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Sensor lụt được kích hoạt'),
    'HighTemperature':                      mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'HighTemperature'),
    'Insulation Detector insulation error': mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Insulation Detector insulation error'),
    'Không kết nối':                        mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Không kết nối'),
    'Link communication line error':        mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Link communication line error'),
    'No Power Module Found':                mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'No Power Module Found'),
    'OverVoltage':                          mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'OverVoltage'),
    'PeEarthFault':                         mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'PeEarthFault'),
    'Power Module HighTemperature':         mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Power Module HighTemperature'),
    'Power Module Check Group Error':       mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Power Module Check Group Error'),
    'Power Module PFC':                     mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Power Module PFC'),
    'PowerModuleCommunicationLoss':         mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'PowerModuleCommunicationLoss'),
    'SupplyControllerCommunication':        mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'SupplyControllerCommunication'),
    'TamperDetection':                      mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'TamperDetection'),
    'UnderVoltage':                         mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'UnderVoltage'),
    'RelayAdhesion':                        mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'RelayAdhesion'),
    'Input Under Voltage':                  mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Input Under Voltage'),
    'CS_ERROR_HV_DC_UNDERVOLTAGE':          mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'CS_ERROR_HV_DC_UNDERVOLTAGE'),
    'Supply Controller Communication Loss': mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Supply Controller Communication Loss'),
    'DataMismatch': 						mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'DataMismatch'),
    'MCCB Error': 							mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'MCCB Error'),
    'Lightening Protector Triggered': 		mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Lightening Protector Triggered'),
    'ScreenCommunicationLoss': 				mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'ScreenCommunicationLoss'),
    'CPVoltage': 							mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'CPVoltage'),
    'Sharing Line Abnormal': 				mk('Lỗi trụ khác',     KHAC,    'Khắc phục sự cố khác', 'Sharing Line Abnormal'),
  };
  const ALIAS = { 'Door Access Detected': 'DoorAccessDetected' };
  const PRESETS = {};
  for (const [k,v] of Object.entries(RAW))   PRESETS[norm(k)] = { ...v, _key:k };
  for (const [a,t] of Object.entries(ALIAS)) PRESETS[norm(a)] = { ...RAW[t], _key:t };
  const getPreset = name => name ? (PRESETS[norm(name)] || null) : null;

  // processTicket trả về OBJECT { status, alarm } để gom đủ thông tin cho file xuất
  const processTicket = async id => {
    console.log(`\n========== ${id} ==========`);
    let _alarm = '';
    const D = status => ({ status, alarm: _alarm });
    const inp = findSearchInput();
    if (!inp) { console.error('❌ Không thấy ô search'); return D('ERR_SEARCH'); }
    inp.focus(); setReactInput(inp, ''); await sleep(800);
    setReactInput(inp, id);
    inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true}));
    const link = await waitFor(() => findDetailLink(id), { timeout: 10000 });
    if (!link) { console.warn('⏭️ Không thấy ticket → SKIP'); return D('NOT_FOUND'); }
    await sleep(300); realClick(link);
    const ready = await waitFor(() => findLogCpoCard() || findEditBtn(), { timeout: 10000 });
    if (!ready) { console.warn('⚠️ Chi tiết không load kịp → SKIP'); await goBackToList(); return D('DETAIL_TIMEOUT'); }
    const statuses = await waitFor(() => {
      const card = findLogCpoCard(); if (!card) return null;
      const s = [...card.querySelectorAll('div')].map(d => d.textContent.trim().toUpperCase()).filter(t => ['OPEN','CLOSED','CLOSE'].includes(t));
      return s.length ? s : null;
    }, { timeout: 8000 });
    await sleep(300);
    const closed = statuses ? (statuses.includes('CLOSED') || statuses.includes('CLOSE')) : null;
    console.log('📋 Log CPO:', statuses, '| CLOSED:', closed);
    if (!closed) { console.log('⏭️ Không có CLOSED → SKIP'); await goBackToList(); return D('NO_CLOSED'); }
    const alarmName = readAlarmName();
    _alarm = alarmName || '';
    const P = getPreset(alarmName);
    if (!P) { console.warn(`⏭️ Mã "${alarmName}" KHÔNG CÓ PRESET → SKIP`); await goBackToList(); return D('NO_PRESET:'+(alarmName||'?')); }
    console.log(`🏷️ Mã: "${alarmName}" → preset: ${P._key}`);
    if (!findActionButton('Sửa chữa')) { console.log('⏭️ Không có nút "Sửa chữa" (đã xử lý) → SKIP'); await goBackToList(); return D('SKIP_STATE'); }
    const editBtn = findEditBtn();
    if (!editBtn) { console.log('⏭️ Không có "Chỉnh sửa" → SKIP'); await goBackToList(); return D('NO_EDIT'); }
    realClick(editBtn);
    await waitFor(() => findControlByLabel('Hình thức xử lý'), { timeout: 8000 });
    await sleep(500);
    const abort = where => { console.error(`❌ Dừng tại: ${where} (form còn mở, xử lý tay)`); return D('ABORT:'+where); };
    if (!await selectRadixOption('Hình thức xử lý', P.hinhThuc))   return abort('Hình thức xử lý');
    if (!await selectRadixOption('Phân loại sửa chữa', P.phanLoai)) return abort('Phân loại sửa chữa');
    if (!await selectCmdkOption('Nhóm lỗi', P.nhomLoi))            return abort('Nhóm lỗi');
    if (!await selectCmdkOption('Chi tiết lỗi', P.chiTietLoi))     return abort('Chi tiết lỗi');
    await multiSelectCmdk('Nhóm xử lý', P.nhomXuLy);
    if (!await selectCmdkOption('Hành động xử lý', P.hanhDong))    return abort('Hành động xử lý');
    const moTaLoiDong = alarmName ? ('trụ báo lỗi ' + alarmName) : P.moTaLoi;
    await fillTextarea('Nhập mô tả chi tiết lỗi', moTaLoiDong);
    await fillTextarea('Nhập mô tả chi tiết sửa chữa', P.moTaSua);
    await sleep(300);
    const upd = [...document.querySelectorAll('[data-slot="dialog-content"] button')].find(b => b.textContent.trim() === 'Cập nhật');
    if (!upd) return abort('nút Cập nhật');
    realClick(upd); await sleep(1500);
    if ([...document.querySelectorAll('[data-slot="dialog-content"]')].some(d=>d.offsetParent!==null)) { console.error('⚠️ Dialog còn mở sau Cập nhật → DỪNG'); return D('UPDATE_FAIL'); }
    await sleep(1500); // đợi trang ổn định sau Cập nhật

    // Sửa chữa — retry click tới khi hộp thoại bật ra
    const suaBtn = await waitFor(() => findActionButton('Sửa chữa'), { timeout: 6000 });
    if (!suaBtn) return abort('nút Sửa chữa');
    let dlgUp = false;
    for (let i=0; i<4 && !dlgUp; i++) {
      const b = findActionButton('Sửa chữa'); if (b) await clickActionEl(b);
      dlgUp = !!(await waitFor(() => [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')].some(d=>d.offsetParent!==null && !d.querySelector('[data-slot="dialog-content"] textarea')), { timeout: 1500, interval: 200 }));
    }
    if (!await clickConfirmInDialog('Xác nhận'))  return abort('Xác nhận (Sửa chữa)');
    await sleep(2000);

    // Hoàn công — nếu nút bị xám/không có → ghi log, KHÔNG dừng mẻ
    const hcEnabled = await waitFor(() => findActionButton('Hoàn công'), { timeout: 6000 });
    if (!hcEnabled) {
      const hcAny = findActionButtonAny('Hoàn công');
      const reason = hcAny ? 'nút Hoàn công bị XÁM (disabled)' : 'không thấy nút Hoàn công';
      console.warn(`⚠️ ${id}: ${reason} → đã Sửa chữa, BỎ QUA Hoàn công`);
      await goBackToList();
      return D('STUCK_HOANCONG');
    }
    let hcDlg = false;
    for (let i=0; i<4 && !hcDlg; i++) {
      const b = findActionButton('Hoàn công'); if (b) await clickActionEl(b);
      hcDlg = !!(await waitFor(() => [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')].some(d=>d.offsetParent!==null), { timeout: 1500, interval: 200 }));
    }
    if (!await clickConfirmInDialog('Xác nhận'))  return abort('Xác nhận (Hoàn công)');
    await sleep(1500);

    console.log(`✅✅ ${id} HOÀN TẤT`);
    await goBackToList();
    return D('DONE');
  };

  // ===== Diễn giải trạng thái → ghi chú tiếng Việt =====
  const STATUS_NOTE = {
    DONE:           'Đã đóng thành công (Sửa chữa + Hoàn công)',
    NO_CLOSED:      'Log CPO chưa có CLOSED → bỏ qua',
    NOT_FOUND:      'Không tìm thấy ticket khi search',
    SKIP_STATE:     'Không có nút "Sửa chữa" (có thể đã xử lý) → bỏ qua',
    NO_EDIT:        'Không có nút "Chỉnh sửa" → bỏ qua',
    DETAIL_TIMEOUT: 'Trang chi tiết load không kịp → bỏ qua',
    ERR_SEARCH:     'Không thấy ô tìm kiếm trên trang',
    STUCK_HOANCONG: 'Đã Sửa chữa nhưng Hoàn công xám/không có → CẦN XỬ LÝ TAY',
    UPDATE_FAIL:    'Dialog còn mở sau khi Cập nhật → CẦN XỬ LÝ TAY',
  };
  const noteFor = (status, alarm) => {
    if (status.startsWith('NO_PRESET')) return `Mã cảnh báo "${status.split(':').slice(1).join(':') || alarm || '?'}" chưa có trong preset → bỏ qua`;
    if (status.startsWith('ABORT'))     return `Dừng tại bước "${status.split(':').slice(1).join(':')}" (form còn mở) → CẦN XỬ LÝ TAY`;
    return STATUS_NOTE[status] || status;
  };
  const needsManual = status => status.startsWith('ABORT') || ['STUCK_HOANCONG','UPDATE_FAIL'].includes(status);

  // ===== Xuất CSV =====
  const csvCell = v => '"' + String(v ?? '').replace(/"/g,'""') + '"';
  const buildCsv = records => {
    const header = ['STT','Ticket','Lỗi trụ gặp','Trạng thái','Ghi chú','Cần xử lý tay'];
    const rows = records.map((r,i) => [
      i+1,
      '="'+r.id+'"',               // ép Excel hiểu là Text → không làm tròn ID dài
      r.alarm || '',
      r.status,
      noteFor(r.status, r.alarm),
      needsManual(r.status) ? 'CÓ' : '',
    ].map(csvCell).join(','));
    return '\uFEFF' + [header.map(csvCell).join(','), ...rows].join('\r\n'); // BOM cho tiếng Việt
  };
  const downloadCsv = records => {
    const csv = buildCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const t = new Date(), p = n => String(n).padStart(2,'0');
    a.download = `voms-close-result-${t.getFullYear()}${p(t.getMonth()+1)}${p(t.getDate())}-${p(t.getHours())}${p(t.getMinutes())}.csv`;
    a.href = url; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return a.download;
  };

  const runAll = async ids => {
    const result = {}, records = [];
    for (const id of ids) {
      const r = await processTicket(id);            // { status, alarm }
      result[id] = r.status;
      records.push({ id, status: r.status, alarm: r.alarm || '' });
      if (window.__vomsPanelProgress) window.__vomsPanelProgress(records.length, ids.length, id, r.status);
      // CHỈ dừng mẻ khi ABORT / UPDATE_FAIL. STUCK_HOANCONG thì chạy tiếp.
      if (r.status.startsWith('ABORT') || r.status === 'UPDATE_FAIL') { console.error('🛑 DỪNG TOÀN BỘ để xử lý tay:', id); break; }
      await sleep(1500);
    }
    console.log('\n===== KẾT QUẢ =====');
    console.table(result);
    const grp = {};
    for (const [id,s] of Object.entries(result)) { const k = s.split(':')[0]; (grp[k]=grp[k]||[]).push(id); }
    console.log('Tóm tắt:', Object.fromEntries(Object.entries(grp).map(([k,v])=>[k,v.length])));
    window.__lastResult = result;
    window.__lastRecords = records;
    let fname = '';
    try { fname = downloadCsv(records); console.log('💾 Đã xuất file:', fname); }
    catch (e) { console.error('Lỗi xuất CSV:', e); }
    if (window.__vomsPanelDone) window.__vomsPanelDone(records, grp, fname);
    return result;
  };

  // ===== Panel: dán & chạy =====
  const parseIds = txt => [...new Set((txt||'').split(/[\s,;]+/).map(s => s.replace(/#/g,'').trim()).filter(Boolean))];

  const createPanel = () => {
    document.getElementById('voms-panel')?.remove();
    const box = document.createElement('div');
    box.id = 'voms-panel';
    box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;width:330px;background:#1e293b;color:#e2e8f0;font:13px/1.45 system-ui,sans-serif;border:1px solid #334155;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.45);overflow:hidden';
    box.innerHTML = `
      <div id="vp-head" style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#0f172a;cursor:move;user-select:none">
        <b style="font-size:13px">⚡ VOMS – Đóng ticket Close</b>
        <span style="display:flex;gap:6px">
          <button id="vp-min" style="all:unset;cursor:pointer;padding:0 6px;border-radius:4px;color:#94a3b8">—</button>
          <button id="vp-x"   style="all:unset;cursor:pointer;padding:0 6px;border-radius:4px;color:#f87171">✕</button>
        </span>
      </div>
      <div id="vp-body" style="padding:12px;display:flex;flex-direction:column;gap:9px">
        <textarea id="vp-ids" rows="6" placeholder="Dán danh sách ticket vào đây&#10;(mỗi dòng 1 ticket, hoặc cách nhau bởi dấu phẩy / space)&#10;VD: RC-2506-xxxx" style="width:100%;box-sizing:border-box;resize:vertical;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:8px;font:12px/1.4 ui-monospace,monospace"></textarea>
        <div style="display:flex;gap:8px;align-items:center">
          <button id="vp-run" style="all:unset;cursor:pointer;flex:1;text-align:center;background:#22c55e;color:#04210f;font-weight:700;padding:9px 0;border-radius:6px">▶ Chạy</button>
          <button id="vp-dl"  style="all:unset;cursor:pointer;background:#334155;color:#e2e8f0;padding:9px 12px;border-radius:6px" title="Tải lại CSV lần chạy gần nhất">⬇ CSV</button>
        </div>
        <div id="vp-stat" style="color:#94a3b8;min-height:18px"></div>
        <div id="vp-sum"  style="display:none;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:8px;max-height:160px;overflow:auto;font:12px/1.4 ui-monospace,monospace"></div>
      </div>`;
    document.body.appendChild(box);

    const $ = id => box.querySelector(id);
    const stat = (m, c='#94a3b8') => { const e = $('#vp-stat'); e.textContent = m; e.style.color = c; };
    const run = $('#vp-run');

    $('#vp-x').onclick   = () => box.remove();
    $('#vp-min').onclick = () => { const b = $('#vp-body'); b.style.display = b.style.display === 'none' ? 'flex' : 'none'; };

    // kéo thả panel
    (() => {
      const head = $('#vp-head'); let sx, sy, ox, oy, drag = false;
      head.addEventListener('mousedown', e => {
        if (e.target.tagName === 'BUTTON') return;
        drag = true; sx = e.clientX; sy = e.clientY;
        const r = box.getBoundingClientRect(); ox = r.left; oy = r.top;
        box.style.right = 'auto'; box.style.left = ox + 'px'; box.style.top = oy + 'px';
        e.preventDefault();
      });
      window.addEventListener('mousemove', e => { if (!drag) return; box.style.left = (ox + e.clientX - sx) + 'px'; box.style.top = (oy + e.clientY - sy) + 'px'; });
      window.addEventListener('mouseup', () => drag = false);
    })();

    run.onclick = async () => {
      const ids = parseIds($('#vp-ids').value);
      if (!ids.length) { stat('⚠️ Chưa có ticket nào.', '#fbbf24'); return; }
      run.disabled = true; run.style.opacity = '.6'; run.style.cursor = 'default';
      $('#vp-sum').style.display = 'none';
      stat(`🔄 Đang chạy 0/${ids.length}…`, '#38bdf8');
      try { await runAll(ids); }
      catch (e) { console.error(e); stat('❌ Lỗi: ' + e.message, '#f87171'); }
      run.disabled = false; run.style.opacity = '1'; run.style.cursor = 'pointer';
    };

    $('#vp-dl').onclick = () => {
      if (!window.__lastRecords?.length) { stat('Chưa có kết quả để tải.', '#fbbf24'); return; }
      const f = downloadCsv(window.__lastRecords); stat('💾 Đã tải: ' + f, '#22c55e');
    };

    window.__vomsPanelProgress = (done, total, id, status) => stat(`🔄 ${done}/${total} – ${id}: ${status}`, '#38bdf8');
    window.__vomsPanelDone = (records, grp, fname) => {
      const ok = (grp.DONE || []).length;
      const manual = records.filter(r => needsManual(r.status)).length;
      stat(`✅ Xong ${records.length} ticket · DONE: ${ok} · cần tay: ${manual}${fname ? ' · 💾 ' + fname : ''}`, '#22c55e');
      const sum = $('#vp-sum'); sum.style.display = 'block';
      sum.innerHTML = records.map(r => {
        const m = needsManual(r.status);
        const c = r.status === 'DONE' ? '#22c55e' : m ? '#f87171' : '#fbbf24';
        return `<div style="color:${c}">• ${r.id} — ${r.status}${r.alarm ? ' ['+r.alarm+']' : ''}</div>`;
      }).join('');
    };

    return box;
  };

  window.processTicket = id => processTicket(id).then(r => r.status); // giữ tương thích: trả về chuỗi như cũ
  window.runAll = runAll;
  window.vomsPanel = createPanel;
  createPanel();
  console.log('✅ Đã nạp v7: mô tả lỗi tự điền "trụ báo lỗi <tên cảnh báo>" + cột "Lỗi trụ gặp" trong CSV. Gọi lại panel: vomsPanel()');
})();