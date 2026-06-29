/* =========================================================
   QUÉT TRẠNG THÁI TICKET QUA API (voms-api.vgreen.net)
   - Tự bắt header (X-Tenant-Id + Authorization) từ request của app
   - Gọi thẳng API cho từng ID, có RETRY khi lỗi mạng/CORS/5xx
   - Phân loại theo trạng thái: KTV đã nhận / Mở lại / Đóng / ... / Không có dữ liệu
   - Xuất TSV để dán vào Excel
   Cách dùng: mở trang VOMS (đã đăng nhập) -> F12 -> Console -> dán -> Enter
   Dừng giữa chừng: window.__scanStop = true
   ========================================================= */
(async () => {
  // ---- DANH SÁCH ID (giữ nguyên dạng CHUỖI) ----
  const RAW_IDS = `
1121781083136983040
1121781075302023168
1121781047879663616
1121781046847864832
1121576228342595584
1121575827319160832
1121574810015891456
1121574355584024576
1121387417336020992
1121370997806071808
1121268102783172608
1121122717406199808
1121028421697667072
1121028421521506304
1121028421341151232
1121020184080416768
1121020184080416768
1121020165780013056
1120889173187231744
1120889123748315136
1120850034214961152
1120740739691446272
1120658860476858368
1120521288807874560
1120521278217256960
1120521260470501376
1120492960062767104
1120492948906573824
1120381916380266496
1120311318400598016
1120192703282151424
1120192680448360448
1120192679175913472
1120192661129396224
1120192634126467072
1120139175010893824
1120129631358681088
1120088684802998272
1120084812088868864
1120084132443848704
1119976447929090048
1119559264895893504
1119419215722184704
1119363660341182464
1119336867831873536
1119323513679904768
1119066548835581952
1118950446163951616
1118866355804831744
1117503142538379264
1117503142538379264
1116784088322539520
1116049375618269184
1115709398980100096
1115320323630039040
1114786996775419904
1114786996775419904
1114786988317736960
`;
  const IDS = RAW_IDS.trim().split(/\s+/).filter(Boolean);

  // ---- Cấu hình ----
  const API = 'https://voms-api.vgreen.net/api/v1/repair-cases';
  const DELAY = 120;        // nghỉ giữa các request (ms) — tăng nếu bị chặn tần suất
  const RETRY = 3;          // số lần thử lại khi lỗi mạng/CORS/5xx
  const RETRY_WAIT = 1500;  // chờ trước khi thử lại (ms)

  // Map mã trạng thái -> nhãn tiếng Việt (sửa/thêm nếu gặp mã lạ)
  const STATUS_VI = {
    pending: 'Chờ xử lý',
    assigned: 'Đã phân công',
    accepted: 'KTV đã nhận',
    in_progress: 'Đang xử lý',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    reopened: 'Mở lại',
    closed: 'Đóng',
    cancelled: 'Hủy',
    canceled: 'Hủy',
  };
  const viOf = code => STATUS_VI[code] || code || '(không rõ)';

  window.__scanStop = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---- 1) Bắt header (X-Tenant-Id + Authorization) từ request của app ----
  function installHook() {
    if (window.__hookInstalled) return;
    window.__hookInstalled = true;
    window.__hdr = window.__hdr || {};
    const want = /voms-api\.vgreen\.net\/api\/v1\/repair-cases/;
    const Xo = XMLHttpRequest.prototype.open, Xs = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return Xo.apply(this, arguments); };
    XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
      if (want.test(this.__u || '')) window.__hdr[k] = v;
      return Xs.apply(this, arguments);
    };
    const Fo = window.fetch;
    window.fetch = function (input, init) {
      try {
        const u = typeof input === 'string' ? input : (input && input.url) || '';
        if (want.test(u) && init && init.headers) {
          const h = init.headers;
          if (h.forEach) h.forEach((v, k) => window.__hdr[k] = v);
          else if (Array.isArray(h)) h.forEach(([k, v]) => window.__hdr[k] = v);
          else Object.assign(window.__hdr, h);
        }
      } catch (e) {}
      return Fo.apply(this, arguments);
    };
  }

  function getHeaders() {
    const h = window.__hdr || {};
    const tenant = h['x-tenant-id'] || h['X-Tenant-Id'] || h['X-TENANT-ID'];
    const auth = h['authorization'] || h['Authorization'];
    return { tenant, auth };
  }

  installHook();
  let { tenant, auth } = getHeaders();
  if (!tenant) {
    // kích hoạt 1 lần tìm trên UI để app tự gọi API -> bắt được header
    const input = document.querySelector('input[placeholder*="Tìm"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, IDS[0]);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    for (let i = 0; i < 50 && !getHeaders().tenant; i++) await sleep(150);
    ({ tenant, auth } = getHeaders());
  }
  if (!tenant) {
    console.error('❌ Không bắt được X-Tenant-Id. Hãy gõ tìm 1 ID bất kỳ trên trang rồi chạy lại script.');
    return;
  }
  console.log('✅ Đã có header. Tenant:', tenant);

  const baseHeaders = { 'Accept': 'application/json', 'X-Tenant-Id': tenant };
  if (auth) baseHeaders['Authorization'] = auth;

  // ---- 2) Gọi API cho 1 ID (có retry) ----
  async function fetchCase(id) {
    const url = `${API}?page=1&limit=10&search=${encodeURIComponent(id)}`;
    let lastErr;
    for (let attempt = 0; attempt <= RETRY; attempt++) {
      try {
        const res = await fetch(url, { credentials: 'include', headers: baseHeaders });
        if (res.status === 401 || res.status === 403) { const e = new Error('AUTH_' + res.status); e.fatal = true; throw e; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        lastErr = e;
        if (e.fatal) throw e;
        if (attempt < RETRY) await sleep(RETRY_WAIT);
      }
    }
    throw lastErr;
  }

  // ---- 3) Chạy ----
  const results = [];
  console.log(`▶️ Bắt đầu quét ${IDS.length} ticket qua API...`);
  for (let i = 0; i < IDS.length; i++) {
    if (window.__scanStop) { console.warn('⏹️ Đã dừng theo yêu cầu.'); break; }
    const id = IDS[i];
    const rec = { stt: i + 1, id, code: '', statusRaw: '', status: '', station: '', serial: '', note: '' };
    try {
      const json = await fetchCase(id);
      const items = (json && json.data && json.data.items) || [];
      const total = (json && json.data && json.data.meta) ? json.data.meta.totalItems : items.length;
      if (!total || items.length === 0) {
        rec.status = 'Không có dữ liệu';
        rec.note = /0000$/.test(id) ? 'ID nghi bị làm tròn (sai số)' : 'không tìm thấy';
      } else {
        const it = items[0];
        rec.code = it.code || '';
        rec.statusRaw = it.status || '';
        rec.status = viOf(it.status);
        rec.station = it.station ? (it.station.stationCode || '') : '';
        rec.serial = it.station ? (it.station.stationSerialNumber || '') : '';
        if (total > 1) rec.note = total + ' kết quả khớp';
      }
    } catch (e) {
      if (e.fatal) { console.error(`❌ Token/phiên hết hạn (${e.message}). Hãy F5 đăng nhập lại rồi chạy lại script.`); break; }
      rec.status = 'LỖI gọi API';
      rec.note = String(e.message || e);
    }
    results.push(rec);
    console.log(`[${i + 1}/${IDS.length}] ${id} -> ${rec.status}${rec.code ? ' (' + rec.code + ')' : ''}${rec.note ? '  ⚠️ ' + rec.note : ''}`);
    if (DELAY) await sleep(DELAY);
  }

  // ---- 4) Kết quả + gom nhóm ----
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

  // TSV để dán vào Excel
  const tsv = 'ID\tRC\tTrang thai\tStatus raw\tMa tram\tSerial\tGhi chu\n' +
    results.map(r => [r.id, r.code, r.status, r.statusRaw, r.station, r.serial, r.note].join('\t')).join('\n');

  window.__scanResults = results;
  window.__scanByStatus = byStatus;
  window.__scanTSV = tsv;

  try {
    if (typeof copy === 'function') { copy(tsv); console.log('📋 Đã copy TSV vào clipboard — dán thẳng vào Excel.'); }
  } catch (e) {}
  console.log('Lấy ID 1 nhóm:  copy(__scanByStatus["Đóng"].join("\\n"))    |    Xem các nhóm:  Object.keys(__scanByStatus)');
})();
