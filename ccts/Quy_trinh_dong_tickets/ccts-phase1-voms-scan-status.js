/* =========================================================
   VOMS — QUÉT TRẠNG THÁI LIST TICKET QUA API   (bản gộp v1 + v2)
   voms-api.vgreen.net/api/v1/repair-cases?...&search=<id|RC->

   Gộp từ:
   - v2 (gốc): nhận cả RC-, fallback JWT từ storage, khớp record chính xác.
   - v1 (port sang): xuất file CSV/XLS, map status đầy đủ,
     cảnh báo ID nghi làm tròn (đuôi 0000), hook bắt header LỌC THEO URL.

   DÙNG: mở trang VOMS (đã đăng nhập) -> F12 -> Console -> dán -> Enter.
   DỪNG giữa chừng: window.__scanStop = true
   ========================================================= */
(async () => {
  // ---- 1) LIST ID hoặc MÃ RC (giữ dạng CHUỖI, mỗi dòng 1 cái) ----
  const RAW = `
1119750215042465793
1119737176831950849
1119736966495993857
1119693374291836929
1119658712355438593
1119657736175747073
1119643618538553345
1119611818139320321
1119600975907258369
1119567192403083265
1119559264895893505
1119411724095717377
1119380394687463424
1119363660341182465
1119319298508980225

`;
  const IDS = RAW.trim().split(/\s+/).filter(Boolean);

  // ---- Cấu hình ----
  const API = 'https://voms-api.vgreen.net/api/v1/repair-cases';
  const RETRIES = 3, RETRY_WAIT = 1500, DELAY = 250;

  // Map mã trạng thái -> nhãn tiếng Việt (đầy đủ, gộp từ v1). Gặp mã lạ thì thêm.
  const STATUS_VI = {
    pending: 'Chờ xử lý',
    assigned: 'Đã phân công',
    accepted: 'KTV đã nhận',
    in_progress: 'Đang xử lý',
    processing: 'Đang xử lý',
    completed: 'Hoàn công',
    reopened: 'Mở lại',
    closed: 'Đóng',
    cancelled: 'Đã huỷ',
    canceled: 'Đã huỷ',
  };
  const viOf = code => STATUS_VI[code] || code || '(trống)';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---- 2) BẮT HEADER — hook XHR + fetch, LỌC THEO URL (từ v1) ----
  //         + fallback JWT từ local/sessionStorage (từ v2).
  window.__hdr = window.__hdr || {};
  const WANT = /voms-api\.vgreen\.net\/api\/v1\/repair-cases/;

  if (!window.__hookInstalled) {
    window.__hookInstalled = true;

    const grabHeaders = h => {
      if (!h) return;
      const get = k => (typeof h.get === 'function' ? h.get(k) : h[k]);
      const a = get('Authorization') || get('authorization');
      const t = get('X-Tenant-Id') || get('x-tenant-id');
      if (a) window.__hdr.Authorization = a;
      if (t) window.__hdr['X-Tenant-Id'] = t;
    };

    // XHR: nhớ URL ở open(), chỉ tóm header nếu URL khớp repair-cases
    const Xo = XMLHttpRequest.prototype.open;
    const Xs = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return Xo.apply(this, arguments); };
    XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
      if (WANT.test(this.__u || '')) {
        if (/^authorization$/i.test(k)) window.__hdr.Authorization = v;
        if (/^x-tenant-id$/i.test(k)) window.__hdr['X-Tenant-Id'] = v;
      }
      return Xs.apply(this, arguments);
    };

    // fetch: chỉ tóm header nếu URL khớp repair-cases
    const _f = window.fetch;
    window.fetch = function (input, init) {
      try {
        const u = typeof input === 'string' ? input : (input && input.url) || '';
        if (WANT.test(u) && init && init.headers) grabHeaders(init.headers);
      } catch (e) {}
      return _f.apply(this, arguments);
    };
    console.log('%c[VOMS] Header hook đã cài (lọc theo URL).', 'color:#888');
  }

  function tokenFromStorage() {
    for (const s of [localStorage, sessionStorage]) {
      for (let i = 0; i < s.length; i++) {
        const m = (s.getItem(s.key(i)) || '').match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
        if (m) return m[0];
      }
    }
    return null;
  }

  function authHeaders() {
    let auth = window.__hdr.Authorization;
    let tid = window.__hdr['X-Tenant-Id'];
    if (!auth) { const t = tokenFromStorage(); if (t) auth = 'Bearer ' + t; }
    if (!tid && auth) {
      try { tid = JSON.parse(atob(auth.replace('Bearer ', '').split('.')[1])).tid || ''; } catch (e) {}
    }
    const h = { Accept: 'application/json, text/plain, */*' };
    if (auth) h.Authorization = auth;
    if (tid) h['X-Tenant-Id'] = tid;
    return h;
  }

  // chờ bắt được header tối đa ~3s (hook hoặc storage)
  for (let i = 0; i < 20 && !window.__hdr.Authorization && !tokenFromStorage(); i++) await sleep(150);
  const hdr0 = authHeaders();
  console.log('Headers:', { tenant: !!hdr0['X-Tenant-Id'], auth: !!hdr0.Authorization });
  if (!hdr0.Authorization) {
    console.error('❌ Chưa bắt được token. Hãy bấm tìm 1 ID bất kỳ trên trang VOMS rồi chạy lại script.');
    return;
  }

  // ---- 3) Gọi API 1 ID/mã, có retry ----
  async function fetchOne(idOrCode) {
    const url = `${API}?page=1&limit=10&search=${encodeURIComponent(idOrCode)}`;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const r = await fetch(url, { credentials: 'include', headers: authHeaders() });
        if (r.status === 401 || r.status === 403) { const e = new Error('HTTP ' + r.status); e.fatal = true; throw e; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
      } catch (e) {
        if (e.fatal || attempt === RETRIES) throw e;
        await sleep(RETRY_WAIT);
      }
    }
  }

  // ---- 4) Quét list ----
  const results = [];
  window.__scanStop = false;
  console.log(`▶️ Bắt đầu quét ${IDS.length} ticket qua API...`);
  for (let i = 0; i < IDS.length; i++) {
    if (window.__scanStop) { console.warn('⏹ Dừng theo yêu cầu.'); break; }
    const id = IDS[i];
    const rec = { stt: i + 1, id, code: '', status: '', statusRaw: '', station: '', serial: '', note: '' };
    try {
      const d = await fetchOne(id);
      const items = d?.data?.items || [];
      const total = d?.data?.meta?.totalItems ?? items.length;
      if (total === 0 || !items.length) {
        rec.status = 'Không có dữ liệu';
        rec.note = /0000$/.test(id) ? 'ID nghi bị làm tròn (sai số)' : 'không tìm thấy';
      } else {
        // ưu tiên record khớp đúng id/code; nếu không thì lấy đầu tiên (từ v2)
        const it = items.find(x => x.id === id || x.code === id) || items[0];
        rec.code = it.code || '';
        rec.statusRaw = it.status || '';
        rec.status = viOf(it.status);
        rec.station = it.station ? (it.station.stationCode || '') : '';
        rec.serial = it.station ? (it.station.stationSerialNumber || '') : '';
        if (total > 1) rec.note = total + ' kết quả khớp';
      }
    } catch (e) {
      if (e.fatal) { console.error(`❌ Token/phiên hết hạn (${e.message}). F5 đăng nhập lại rồi chạy lại.`); break; }
      rec.status = 'LỖI gọi API';
      rec.note = String(e.message || e);
    }
    results.push(rec);
    console.log(`[${i + 1}/${IDS.length}] ${id} -> ${rec.status}${rec.code ? ' (' + rec.code + ')' : ''}${rec.note ? '  ⚠️ ' + rec.note : ''}`);
    if (DELAY) await sleep(DELAY);
  }

  // ---- 5) Kết quả + gom nhóm ----
  console.log('================ XONG ================');
  console.table(results.map(r => ({ STT: r.stt, ID: r.id, RC: r.code, 'Trạng thái': r.status, 'Mã trạm': r.station, 'Ghi chú': r.note })));

  const byStatus = {};
  results.forEach(r => { (byStatus[r.status] = byStatus[r.status] || []).push(r.id); });

  console.log('\n========= TỔNG HỢP THEO TRẠNG THÁI =========');
  console.table(Object.keys(byStatus)
    .sort((a, b) => byStatus[b].length - byStatus[a].length)
    .map(k => ({ 'Trạng thái': k, 'Số lượng': byStatus[k].length })));

  Object.keys(byStatus)
    .sort((a, b) => byStatus[b].length - byStatus[a].length)
    .forEach(k => console.log(`\n--- [${k}] : ${byStatus[k].length} ticket ---\n` + byStatus[k].join('\n')));

  // ---- 6) TSV + copy clipboard ----
  const tsv = 'ID\tRC\tTrang thai\tStatus raw\tMa tram\tSerial\tGhi chu\n' +
    results.map(r => [r.id, r.code, r.status, r.statusRaw, r.station, r.serial, r.note].join('\t')).join('\n');

  window.__scanResults = results;
  window.__scanByStatus = byStatus;
  window.__scanTSV = tsv;
  try { if (typeof copy === 'function') { copy(tsv); console.log('📋 Đã copy TSV vào clipboard — dán thẳng vào Excel.'); } } catch (e) {}
  console.log('Lấy ID 1 nhóm:  copy(__scanByStatus["Đóng"].join("\\n"))   |   Xem nhóm:  Object.keys(__scanByStatus)');

  // ---- 7) Xuất file CSV + XLS (port từ v1) ----
  function download(filename, content, mime) {
    const blob = new Blob(['\ufeff' + content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

  // 7a) CSV — ID bọc ="..." để Excel KHÔNG làm tròn 18 số
  const csvCols = ['ID', 'RC', 'Trang thai', 'Status raw', 'Ma tram', 'Serial', 'Ghi chu'];
  const csv = csvCols.join(',') + '\n' + results.map(r =>
    [`="${r.id}"`, r.code, r.status, r.statusRaw, r.station, `="${r.serial}"`, r.note]
      .map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  download(`ticket_status_${ts}.csv`, csv, 'text/csv;charset=utf-8');

  // 7b) .xls (HTML table) — ép cột ID/Serial là Text, có sheet tổng hợp
  const rowsHtml = results.map(r =>
    `<tr><td style="mso-number-format:'\\@'">${esc(r.id)}</td><td>${esc(r.code)}</td><td>${esc(r.status)}</td><td>${esc(r.statusRaw)}</td><td>${esc(r.station)}</td><td style="mso-number-format:'\\@'">${esc(r.serial)}</td><td>${esc(r.note)}</td></tr>`
  ).join('');
  const sumHtml = Object.keys(byStatus).sort((a, b) => byStatus[b].length - byStatus[a].length)
    .map(k => `<tr><td>${esc(k)}</td><td>${byStatus[k].length}</td></tr>`).join('');
  const xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head><meta charset="utf-8"></head><body>
  <table border="1"><tr><th>ID</th><th>RC</th><th>Trạng thái</th><th>Status raw</th><th>Mã trạm</th><th>Serial</th><th>Ghi chú</th></tr>${rowsHtml}</table>
  <br><table border="1"><tr><th>Trạng thái</th><th>Số lượng</th></tr>${sumHtml}</table>
  </body></html>`;
  download(`ticket_status_${ts}.xls`, xls, 'application/vnd.ms-excel');

  console.log('💾 Đã tải xuống file CSV và XLS.');
})();
