/* =========================================================
   VOMS — QUÉT TRẠNG THÁI LIST TICKET QUA API
   voms-api.vgreen.net/api/v1/repair-cases?...&search=<id|RC->

   - Tự bắt header (X-Tenant-Id + Authorization) từ request của app
     (fallback: lấy JWT từ local/sessionStorage).
   - Gọi API từng ID/mã, đọc meta.totalItems + items[0].status.
   - RETRY tối đa 3 lần khi lỗi mạng/CORS/5xx; gặp 401/403 thì dừng (hết phiên).
   - Phân loại trạng thái -> nhãn tiếng Việt, gom nhóm, đếm số lượng.
   - Xuất TSV (ID giữ dạng text) + tự copy vào clipboard để dán Excel.

   DÙNG: mở trang VOMS (đã đăng nhập) -> F12 -> Console -> dán -> Enter.
   DỪNG giữa chừng: window.__scanStop = true
   ========================================================= */
(async () => {
  // ---- 1) LIST ID hoặc MÃ RC (giữ dạng CHUỖI, mỗi dòng 1 cái) ----
  const RAW = `
1120139175010890000
RC-YRO033X3N6I75
`;
  const IDS = RAW.trim().split(/\s+/).filter(Boolean);

  const RETRIES = 3, RETRY_WAIT = 1500, DELAY = 250;
  const STATUS_VI = {
    accepted: 'KTV đã nhận', reopened: 'Mở lại', closed: 'Đóng',
    pending: 'Chờ xử lý', assigned: 'Đã phân công',
    completed: 'Hoàn thành', cancelled: 'Đã huỷ',
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---- 2) BẮT HEADER (hook XHR + fetch; fallback token storage) ----
  window.__hdr = window.__hdr || {};
  const grab = h => {
    if (!h) return;
    const get = k => (typeof h.get === 'function' ? h.get(k) : h[k]);
    const a = get('Authorization') || get('authorization');
    const t = get('X-Tenant-Id') || get('x-tenant-id');
    if (a) window.__hdr.Authorization = a;
    if (t) window.__hdr['X-Tenant-Id'] = t;
  };
  const _f = window.fetch;
  window.fetch = function (i, init = {}) { grab(init.headers); return _f.apply(this, arguments); };
  const _sr = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (/^authorization$/i.test(k)) window.__hdr.Authorization = v;
    if (/^x-tenant-id$/i.test(k)) window.__hdr['X-Tenant-Id'] = v;
    return _sr.apply(this, arguments);
  };

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
    if (!tid && auth) { try { tid = JSON.parse(atob(auth.replace('Bearer ', '').split('.')[1])).tid || ''; } catch (e) {} }
    const h = { Accept: 'application/json, text/plain, */*' };
    if (auth) h.Authorization = auth;
    if (tid) h['X-Tenant-Id'] = tid;
    return h;
  }

  // chờ bắt được header tối đa ~3s
  for (let i = 0; i < 20 && !window.__hdr.Authorization && !tokenFromStorage(); i++) await sleep(150);
  console.log('Headers:', { tenant: !!authHeaders()['X-Tenant-Id'], auth: !!authHeaders().Authorization });

  // ---- 3) Gọi API 1 ID, có retry ----
  async function fetchOne(idOrCode) {
    const url = `https://voms-api.vgreen.net/api/v1/repair-cases?page=1&limit=10&search=${encodeURIComponent(idOrCode)}`;
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
      } else {
        // ưu tiên record khớp đúng id/code; nếu không thì lấy đầu tiên
        const it = items.find(x => x.id === id || x.code === id) || items[0];
        rec.code = it.code || '';
        rec.statusRaw = it.status || '';
        rec.status = STATUS_VI[it.status] || it.status || '(trống)';
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

  // TSV để dán Excel (ID dạng text)
  const tsv = 'ID\tRC\tTrang thai\tStatus raw\tMa tram\tSerial\tGhi chu\n' +
    results.map(r => [r.id, r.code, r.status, r.statusRaw, r.station, r.serial, r.note].join('\t')).join('\n');

  window.__scanResults = results;
  window.__scanByStatus = byStatus;
  window.__scanTSV = tsv;
  try { if (typeof copy === 'function') { copy(tsv); console.log('📋 Đã copy TSV vào clipboard — dán thẳng vào Excel.'); } } catch (e) {}
  console.log('Lấy ID 1 nhóm:  copy(__scanByStatus["Đóng"].join("\\n"))   |   Xem nhóm:  Object.keys(__scanByStatus)');
})();