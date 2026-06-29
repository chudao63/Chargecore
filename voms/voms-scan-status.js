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
1123584011974082560
1123509402411073536
1123377630876663808
1123377545943318528
1123371600060219392
1123361041411604480
1123360760544231424
1123360757212643328
1123341451503730688
1123341300928217088
1123310885664325632
1123301611777163264
1123285007072886784
1123255070475550720
1123234083814113280
1123213333208104960
1123212653042991104
1123204672805011456
1123166931680362496
1123166918300532736
1123135992247222272
1123088483890102272
1123074727255343104
1123066044284010496
1123066026326884352
1123066016046645248
1123066013462953984
1123066009415450624
1123066002466799616
1123024908910460928
1123024905877979136
1123024904288337920
1123024894876319744
1123024890543603712
1123024485738741760
1123024465379590144
1123024087602823168
1123024084831698944
1122991762778488832
1122991761520197632
1122981526838312960
1122981524271398912
1122981515200430080
1122978174259822592
1122975978232610816
1122975975710523392
1122975966017486848
1122956318295326720
1122950586155270144
1122936081512529920
1122933256738177024
1122918180161454080
1122892554461380608
1122889449228075008
1122870162018926592
1122841867080564736
1122841863923171328
1122841859409182720
1122820786136285184
1122820784843522048
1122809004093079552
1122808985688473600
1122808973021675520
1122808953949257728
1122808951139074048
1122768420019240960
1122753547454382080
1122728106739892224
1122719283690078208
1122703883770265600
1122703817004417024
1122677476390338560
1122676587150835712
1122676175715696640
1122674362182533120
1122671431261618176
1122666764120227840
1122666538038853632
1122665994931929088
1122662130269945856
1122650189888487424
1122650188394397696
1122643569560387584
1122643234154479616
1122642697522642944
1122642602832035840
1122619965679337472
1122609871050768384
1122609845230632960
1122603701849423872
1122600172489408512
1122600143818063872
1122600140647170048
1122571477871624192
1122567064856559616
1122559256038866944
1122531608967118848
1122531605662007296
1122529565036642304
1122529563768127488
1122529085761912832
1122529078185164800
1122529064198995968
1122511323092353024
1122488744329478144
1122479835107688448
1122473985546780672
1122471648889798656
1122468224804454400
1122465096826748928
1122465084856205312
1122460983120494592
1122460263552253952
1122458836972994560
1122458776572657664
1122458651100053504
1122458567795146752
1122458339956359168
1122450518732832768
1122435756821184512
1122419798282993664
1122401505778204672
1122401495124672512
1122355214184480768
1122331227792211968
1122326131111231488
1122297079528816640
1122294883055697920
1122294879972884480
1122294876944596992
1122291616684572672
1122277991893041152
1122277975187128320
1122277971504529408
1122268256424558592
1122268250984546304
1122258002194333696
1122257998342127616
1122257995626053632
1122241536447348736
1122237499484274688
1122237492507312128
1122237488524558336
1122191083038703616
1122186287714271232
1122182161093754880
1122163265768652800
1122163261975166976
1122144699258372096
1122115744906477568
1122105004285624320
1122100401748180992
1121937768646574080
1121823633906466816
1121782650976206848
1121781084445605888
1121781083506081792
1121781083321532416
1121781082415562752
1121781076140883968
1121781075302023168
1121781074979061760
1121781074723209216
1121781065697067008
1121781065449603072
1121781046847864832
1121781040837427200
1121781040246030336
1121781039646244864
1121781039256174592
1121781038681554944
1121781025842790400
1121746215380320256
1121651360025149440
1121642810821443584
1121599388110684160
1121574279991918592
1121573636269277184
1121564888949456896
1121535840632569856
1121535836790587392
1121535819673632768
1121535814155763712
1121535808567115776
1121535800830459904
1121535799503224832
1121535793815748608
1121535792487989248
1121526958147108864
1121513428008435712
1121472696048549888
1121464894961876992
1121456597613543424
1121446974714150912
1121418111384682496
1121395302803308544
1121385861353439232
1121380648156528640
1121370997806071808
1121346866955288576
1121325769870409728
1121268102783172608
1121157178478952448
1121149827118792704
1121139242083155968
1121138795238785024
1121114455193550848
1121028421878022144
1121028421697667072
1121020170872553472
1121012920191811584
1120969436772040704
1120927007822577664
1120926997122252800
1120889195856789504
1120889190181896192
1120889180007170048
1120889161128607744
1120889128815689728
1120889123748315136
1120889114831224832
1120889112193662976
1120864818906529792
1120860851082362880
1120845457663721472
1120813000242888704
1120777432851152896
1120763491429253120
1120742905676824576
1120740762831421440
1120740747044061184
1120740745702539264
1120730747396161536
1120701657166774272
1120700750530215936
1120687758619049984
1120687740608708608
1120626815885901824
1120532972808568832
1120492965389533184
1120491565150502912
1120491562282254336
1120486793055961088
1120392012309069824
1120362764316049408
1120299417675628544
1120267160986189824
1120251985860100096
1120192703282151424
1120192631588913152
1120192630301261824
1120130244219371520
1120114155359961088
1120081220825120768
1120034653894737920
1120018457222316032
1120017258509631488
1119970013600940032
1119963560651653120
1119945878862692352
1119915871144116224
1119750215042465792
1119737176831950848
1119736966495993856
1119693374291836928
1119658712355438592
1119657736175747072
1119643618538553344
1119611818139320320
1119600975907258368
1119567192403083264
1119559264895893504
1119411724095717376
1119380394683269120
1119363660341182464
1119319298508980224
1119303586780676096
1119303468505235456
1119292156135997440
1119251719728005120
1119251375753134080
1119243689661693952
1119236874261364736
1119214576951492608
1119209132346441728
1119066683150041088
1119066548835581952
1119060322500608000
1118927485415587840
1117889421507690496
1117871134732058624
1117831693531742208
1117743095205462016
1117599969358774272
1117527585985789952
1117503142538379264
1117498645699231744
1117087089180409856
1117038006562062336
1116049375618269184
1115826055320829952
1115766733978599424
1115709398980100096
1115552572392734720
1115256304747544576
1114970713216516096

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
    completed: 'Hoàn thành',
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
        if (it.id) rec.id = String(it.id);   // lấy ID THẬT từ API, tránh ghi lại ID dán vào đã bị làm tròn
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
  console.table(results.map(r => ({ STT: r.stt, ID: r.id, 'Trạng thái': r.status, 'Mã trạm': r.station, 'Ghi chú': r.note })));

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
  // TSV để dán Excel — bọc ="..." cho ID/Serial để Excel KHÔNG làm tròn khi paste thẳng
  const tsv = 'ID\tTrang thai\tStatus raw\tMa tram\tSerial\tGhi chu\n' +
    results.map(r => [`="${r.id}"`, r.status, r.statusRaw, r.station, `="${r.serial}"`, r.note].join('\t')).join('\n');

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
  const csvCols = ['ID', 'Trang thai', 'Status raw', 'Ma tram', 'Serial', 'Ghi chu'];
  const csv = csvCols.join(',') + '\n' + results.map(r =>
    [`="${r.id}"`, r.status, r.statusRaw, r.station, `="${r.serial}"`, r.note]
      .map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  download(`ticket_status_${ts}.csv`, csv, 'text/csv;charset=utf-8');

  // 7b) .xls (HTML table) — ép cột ID/Serial là Text, có sheet tổng hợp
  const rowsHtml = results.map(r =>
    `<tr><td style="mso-number-format:'\\@'">${esc(r.id)}</td><td>${esc(r.status)}</td><td>${esc(r.statusRaw)}</td><td>${esc(r.station)}</td><td style="mso-number-format:'\\@'">${esc(r.serial)}</td><td>${esc(r.note)}</td></tr>`
  ).join('');
  const sumHtml = Object.keys(byStatus).sort((a, b) => byStatus[b].length - byStatus[a].length)
    .map(k => `<tr><td>${esc(k)}</td><td>${byStatus[k].length}</td></tr>`).join('');
  const xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head><meta charset="utf-8"></head><body>
  <table border="1"><tr><th>ID</th><th>Trạng thái</th><th>Status raw</th><th>Mã trạm</th><th>Serial</th><th>Ghi chú</th></tr>${rowsHtml}</table>
  <br><table border="1"><tr><th>Trạng thái</th><th>Số lượng</th></tr>${sumHtml}</table>
  </body></html>`;
  download(`ticket_status_${ts}.xls`, xls, 'application/vnd.ms-excel');

  console.log('💾 Đã tải xuống file CSV và XLS.');
})();