/* ============================================================
 * ccts-resolve-ids.js
 * Quét danh sách external ID (thirdTicketId, dạng RC-...) -> Ticket ID
 * Trả về: cctsTicketPk (PK CHUẨN), cctsTicketId (hiển thị, lossy), status
 *
 * CÁCH DÙNG:
 *   1. Mở tab CCTS (console.cnpowercore.com), F12 -> Console.
 *   2. Dán danh sách RC- vào biến EXTERNAL_IDS bên dưới.
 *   3. Paste cả file này vào Console, Enter.
 *   4. Nếu script báo chưa bắt được token -> bấm Search/refresh list
 *      trên UI 1 lần để trigger 1 request, token sẽ tự bắt.
 * ============================================================ */
(async () => {
  'use strict';

  // ===== 1. DÁN DANH SÁCH EXTERNAL ID VÀO ĐÂY (cách nhau bằng xuống dòng/space/phẩy) =====
  const EXTERNAL_IDS = `
RC-WOL50XW1EDUDMJ
RC-JPKRODD12PF02X
`.trim().split(/[\s,]+/).filter(Boolean);

  // ===== CONFIG =====
  const FIND = 'https://cloud.cnpowercore.com:8091/ccts/cctsTicket/findCCTSTicket';
  const DELAY_MS = 300;      // nghỉ giữa các request cho lịch sự
  const TIMEZONE = 420;
  const PAGE_SIZE = 10;

  // ===== 2. TOKEN AUTO-CAPTURE (hook fetch + XHR) =====
  // Token nằm trong body mọi POST tới ccts. Hook để nhặt field "token".
  if (!window.__ccts_token_hooked) {
    window.__ccts_token_hooked = true;
    window.__CCTS_TOKEN = window.__CCTS_TOKEN || null;

    const grab = (body) => {
      try {
        if (typeof body !== 'string') return;
        const m = body.match(/"token"\s*:\s*"([^"]+)"/);
        if (m && m[1]) window.__CCTS_TOKEN = m[1];
      } catch (_) {}
    };

    const _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = (typeof input === 'string') ? input : (input && input.url);
        if (url && url.includes('/ccts/') && init && init.body) grab(init.body);
      } catch (_) {}
      return _fetch.apply(this, arguments);
    };

    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
      try { if (body) grab(body); } catch (_) {}
      return _send.apply(this, arguments);
    };
    console.log('%c[CCTS] Token hook đã cài.', 'color:#888');
  }

  // chờ token tối đa ~20s
  async function waitToken(timeoutMs = 20000) {
    if (window.__CCTS_TOKEN) return window.__CCTS_TOKEN;
    console.warn('[CCTS] Chưa có token. Hãy bấm Search/refresh list trên UI 1 lần...');
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      if (window.__CCTS_TOKEN) return window.__CCTS_TOKEN;
      await new Promise(r => setTimeout(r, 400));
    }
    return null;
  }

  // ===== Parse an toàn precision: đọc raw text, KHÔNG JSON.parse =====
  function parseTickets(rawText, wantThird) {
    const parts = rawText.split('"cctsTicketPk":');
    const out = [];
    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i];
      const pk    = (chunk.match(/^\s*"?(\d+)"?/) || [])[1] || null;
      const idM   = chunk.match(/"cctsTicketId"\s*:\s*"?(\d+)"?/);
      const thM   = chunk.match(/"thirdTicketId"\s*:\s*"([^"]+)"/);
      const stM   = chunk.match(/"cctsTicketStatus"\s*:\s*"([^"]*)"/);
      out.push({
        pk,
        id: idM ? idM[1] : null,
        third: thM ? thM[1] : null,
        status: stM ? stM[1] : null,
      });
    }
    // ưu tiên ticket khớp đúng thirdTicketId; nếu không có thì lấy cái đầu
    return out.find(t => t.third === wantThird) || out[0] || null;
  }

  async function resolveOne(rcId, token) {
    const res = await fetch(FIND, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json;charset=UTF-8',
                 'accept': 'application/json, text/plain, */*' },
      body: JSON.stringify({
        page: { pageNum: 1, pageSize: PAGE_SIZE },
        timezoneOffset: TIMEZONE,
        thirdTicketId: rcId,
        token,
      }),
    });
    const raw = await res.text();           // raw để giữ precision 19 chữ số
    return parseTickets(raw, rcId);
  }

  // ===== RUN =====
  const token = await waitToken();
  if (!token) { console.error('[CCTS] Hết thời gian chờ token. Trigger 1 request trên UI rồi chạy lại.'); return; }

  console.log(`[CCTS] Bắt đầu quét ${EXTERNAL_IDS.length} external ID...`);
  const results = [];
  for (let i = 0; i < EXTERNAL_IDS.length; i++) {
    const rc = EXTERNAL_IDS[i];
    try {
      const t = await resolveOne(rc, token);
      if (t && t.pk) {
        results.push({ external: rc, cctsTicketPk: t.pk, cctsTicketId: t.id, status: t.status, ok: '✔' });
        console.log(`✔ ${rc} -> PK ${t.pk} | ID ${t.id} | ${t.status}`);
      } else {
        results.push({ external: rc, cctsTicketPk: '', cctsTicketId: '', status: 'NOT_FOUND', ok: '✘' });
        console.warn(`✘ ${rc} -> không tìm thấy`);
      }
    } catch (e) {
      results.push({ external: rc, cctsTicketPk: '', cctsTicketId: '', status: 'ERROR: ' + e.message, ok: '✘' });
      console.error(`✘ ${rc} -> lỗi:`, e);
    }
    if (i < EXTERNAL_IDS.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // bảng tổng hợp
  console.table(results);

  // TSV để dán thẳng vào Excel (nhớ format cột PK/ID là Text trước khi dán!)
  const tsv = ['external\tcctsTicketPk\tcctsTicketId\tstatus']
    .concat(results.map(r => `${r.external}\t${r.cctsTicketPk}\t${r.cctsTicketId}\t${r.status}`))
    .join('\n');
  console.log('%c--- TSV (copy vào Excel, format PK/ID = Text) ---', 'color:#0a0;font-weight:bold');
  console.log(tsv);

  window.__cctsResolveResults = results;
  console.log('[CCTS] Xong. Kết quả còn ở window.__cctsResolveResults');
})();