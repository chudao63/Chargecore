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
1122326126092484608
1122306937650806784
1122297079528816640
1122294926810677248
1122294922247274496
1122294866853101568
1122277991893041152
1122277971504529408
1122268256424558592
1122268255128518656
1122268250984546304
1122268233534406656
1122268230189187072
1122257998342127616
1122241536447348736
1122191083038703616
1122186287714271232
1122186284033507328
1122163220801519616
1122155295945129984
1122144699258372096
1122081459994492928
1121942526035886080
1121942523466612736
1121942516921663488
1121823633906466816
1121781084445605888
1121781083506081792
1121781075922780160
1121781075629178880
1121781074723209216
1121781065449603072
1121781043211403264
1121781041244274688
1121781040837427200
1121781040246030336
1121781025842790400
1121746215380320256
1121688224094355456
1121564384100220928
1121535836790587392
1121535835378941952
1121535800830459904
1121526958147108864
1121472838642302976
1121472696048549888
1121456597613543424
1121396773825413120
1121149827118792704
1121136634543734784
1120750412024905728
1120748198955581440
1120733208391450624
1120700172333481984
1120687021265256448
1120491562282254336
1120018457222316032
1119611818139320320
1119303586780676096
1118927485415587840
1115248865222459392
1114644386874261504
1112736802179383296

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
  
  // ---- 5) Xuất file ----
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

  // 5a) CSV — ID bọc ="..." để Excel KHÔNG làm tròn 18 số
  const csvCols = ['ID', 'RC', 'Trang thai', 'Status raw', 'Ma tram', 'Serial', 'Ghi chu'];
	const csv = csvCols.join(',') + '\n' + results.map(r =>
    [`="${r.id}"`, r.code, r.status, r.statusRaw, r.station, `="${r.serial}"`, r.note]
      .map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  download(`ticket_status_${ts}.csv`, csv, 'text/csv;charset=utf-8');

  // 5b) .xls (HTML table) — ép cột ID là Text, có sheet tổng hợp
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

