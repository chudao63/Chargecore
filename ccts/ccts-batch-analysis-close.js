/* ============================================================================
 * ccts-batch-analysis-close.js
 * Flow: chọn các ticket trong TARGET_IDS  ->  Batch add problem analysis
 *       (Problem category: Other -> Error recover by it self,
 *        Reason: "KTV kiểm tra, trụ xanh hoạt động bình thường")  -> Submit
 *       ->  Batch close  -> Confirm
 *
 * Chạy trong Console của trang CCTS (console.cnpowercore.com), tab list ticket.
 * Xử lý PER-PAGE nên đúng dù bảng có bật reserve-selection hay không.
 * ID 18 chữ số luôn để dạng STRING (tránh mất chính xác của Number).
 * ==========================================================================*/
(async () => {
  // ============================ CONFIG ====================================
  const TARGET_IDS = [
    "1121905993138176000","1121823637234909184","1121806592717750272",
    "1121786068610711552","1121781528567873536","1121600975858434048",
    "1121535891656278016","1121535880516206592","1121371010644836352",
    "1121155383669161984","1121114492720644096","1121097363837419520",
    "1120646554288914432","1120639740990193664","1120581405036642304",
    "1120192693235220480","1120192689527455744","1120192645877334016",
    "1120192621421920256","1120192611345629184","1120192604967665664",
    "1120192602378207232","1120009276363243520","1119411615366774784",
    "1115056070578667520",
  ];
  const REASON   = "KTV kiểm tra, trụ xanh hoạt động bình thường";

  // --- công tắc an toàn ---
  const SELECT_ONLY        = true;  // true: chỉ tick chọn rồi báo cáo, KHÔNG mở dialog. Test trước.
  const STOP_BEFORE_CLOSE  = true;  // true: làm xong Problem Analysis của trang đầu rồi DỪNG (chưa close).
  // Khi đã verify ổn: đặt cả 2 về false để chạy full toàn bộ.

  const PAGE_WAIT = 900;            // ms chờ bảng render lại sau khi đổi trang
  // ========================================================================

  const TARGET = new Set(TARGET_IDS.map(s => s.trim()));
  const sleep  = ms => new Promise(r => setTimeout(r, ms));
  const $$     = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const norm   = s => (s || "").replace(/\s+/g, " ").trim();
  const vis    = el => !!el && el.offsetParent !== null && getComputedStyle(el).display !== "none";
  const log    = (...a) => console.log("%c[CCTS]", "color:#0a7", ...a);
  const warn   = (...a) => console.warn("[CCTS]", ...a);

  // set value cho input/textarea theo kiểu Vue nhận được
  function setReactiveValue(el, val) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, val);
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ----------------------- BẢNG / CHỌN DÒNG -------------------------------
  // Checkbox tương tác nằm ở phần fixed-left (cột chọn bị ghim). Fallback body chính.
  // Lấy dòng từ bảng fixed-left (nơi checkbox tương tác được). Không phụ thuộc chỉ số instance.
  function getPageRows() {
    const fixed = document.querySelector(".el-table__fixed .el-table__fixed-body-wrapper");
    if (fixed) {
      const rows = $$(".el-table__row", fixed);
      if (rows.length) return rows;
    }
    return $$(".el-table__body-wrapper .el-table__row");
  }
  // chờ bảng render xong (phòng khi chạy ngay sau reload trang)
  async function waitForTable() {
    for (let i = 0; i < 40; i++) {     // tối đa ~20s
      if (getPageRows().some(r => rowTicketId(r))) return true;
      await sleep(500);
    }
    return false;
  }
  async function ensureAllRowsRendered() {
    const wrap = document.querySelector(".el-table__body-wrapper");
    if (!wrap) return;
    let last = -1;
    for (let i = 0; i < 30; i++) {
      const n = getPageRows().length;
      if (n === last) break;          // số dòng không tăng nữa -> đã render hết
      last = n;
      wrap.scrollTop = wrap.scrollHeight;
      await sleep(150);
    }
    wrap.scrollTop = 0;               // cuộn về đầu cho gọn
    await sleep(200);
  }
  // Ticket ID = chuỗi số >= 16 chữ số trong dòng (tránh phụ thuộc tên cột)
  function rowTicketId(row) {
    for (const s of $$(".text-color1", row)) {
      const t = norm(s.textContent);
      if (/^\d{16,}$/.test(t)) return t;
    }
    for (const c of $$(".cell", row)) {
      const t = norm(c.textContent);
      if (/^\d{16,}$/.test(t)) return t;
    }
    return "";
  }
  // checkbox ô chọn — class el-table-column--selection ổn định theo mọi instance
  function rowCheckbox(row) {
    return row.querySelector(".el-table-column--selection .el-checkbox")
        || row.querySelector(".el-checkbox");
  }
  function selectTargetsOnPage() {
    let n = 0;
    for (const row of getPageRows()) {
      if (TARGET.has(rowTicketId(row))) {
        const cb = rowCheckbox(row);
        if (cb && !cb.classList.contains("is-checked")) {
          (cb.querySelector(".el-checkbox__inner") || cb).click();
          n++;
        }
      }
    }
    return n;
  }
  function pageHasTarget() {
    return getPageRows().some(r => TARGET.has(rowTicketId(r)));
  }

  // ----------------------- PHÂN TRANG -------------------------------------
  function nextBtn()  { return document.querySelector(".el-pagination .btn-next"); }
  async function goNextPage() {
    const b = nextBtn();
    if (!b || b.disabled) return false;
    b.click(); await sleep(PAGE_WAIT); return true;
  }
  async function goFirstPage() {
    const p1 = $$(".el-pager .number").find(li => norm(li.textContent) === "1");
    if (p1 && !p1.classList.contains("active")) { p1.click(); await sleep(PAGE_WAIT); }
  }

  // ----------------------- TIỆN ÍCH DIALOG (best-effort) ------------------
  function dialogRoot() {
    const dlgs = $$(".el-dialog__wrapper").filter(vis);
    return dlgs.length ? (dlgs[dlgs.length - 1].querySelector(".el-dialog") || dlgs[dlgs.length - 1]) : document;
  }
  // match item theo text chính xác (menu: Batch close / Batch add problem analysis / ...)
  function dropdownItem(label) {
    return $$(".el-dropdown-menu__item").find(el => vis(el) && norm(el.textContent) === label);
  }
  function openBatchMenu() {
    const trig = $$(".el-dropdown button, .el-dropdown .el-dropdown-selfdefine")
      .find(el => norm(el.textContent).includes("Batch operation"));
    if (!trig) throw new Error('Không thấy nút "Batch operation"');
    trig.click();
  }
  // tìm el-form-item theo label trong dialog
  function formItem(labelRe) {
    const root = dialogRoot();
    return $$(".el-form-item", root).find(it => {
      const lab = it.querySelector(".el-form-item__label");
      return lab && labelRe.test(norm(lab.textContent));
    });
  }
  // node cascader đang hiển thị, khớp label CHÍNH XÁC
  function cascaderNode(label) {
    return $$(".el-cascader-node").find(n =>
      vis(n) && norm((n.querySelector(".el-cascader-node__label") || n).textContent) === label);
  }
  // chọn theo đường dẫn cascader, vd ["Others","Error recover by it self"]
  async function pickCascader(path) {
    const it = formItem(/problem categor/i);
    const input = (it || dialogRoot()).querySelector(".el-cascader .el-input__inner")
               || (it || dialogRoot()).querySelector(".el-cascader");
    if (!input) throw new Error("Không thấy cascader Problem Category.");
    input.click(); await sleep(500);
    for (const label of path) {
      let node = cascaderNode(label);
      if (!node) { await sleep(450); node = cascaderNode(label); }
      if (!node) throw new Error(`Không thấy node cascader "${label}".`);
      (node.querySelector(".el-cascader-node__label") || node).click();
      await sleep(500);
    }
  }
  // ô Reason Explanation
  function reasonTextarea() {
    const it = formItem(/reason/i);
    return (it && it.querySelector("textarea")) || dialogRoot().querySelector("textarea.el-textarea__inner");
  }
  // nút Submit: ưu tiên nút primary trong footer
  function submitButton() {
    const root = dialogRoot();
    const footer = root.querySelector(".el-dialog__footer") || root;
    return footer.querySelector(".el-button--primary")
        || $$("button", footer).filter(vis).find(b => /submit|confirm|ok|save|确定/i.test(norm(b.textContent)));
  }

  // ----------------------- BATCH: ADD PROBLEM ANALYSIS --------------------
  async function batchAddProblemAnalysis() {
    openBatchMenu(); await sleep(500);
    const item = dropdownItem("Batch add problem analysis");
    if (!item) throw new Error('Không thấy menu "Batch add problem analysis".');
    item.click(); await sleep(1000);

    // Problem Category: Others -> Error recover by it self  (cascader 2 cấp)
    await pickCascader(["Others", "Error recover by it self"]);

    // Reason Explanation
    const reason = reasonTextarea();
    if (!reason) throw new Error("Không thấy ô Reason Explanation.");
    setReactiveValue(reason, REASON);
    await sleep(300);

    const submit = submitButton();
    if (!submit) throw new Error("Không thấy nút Submit của dialog Problem Analysis.");
    submit.click(); await sleep(1300);
  }

  // ----------------------- BATCH: CLOSE -----------------------------------
  async function batchClose() {
    openBatchMenu(); await sleep(500);
    const item = dropdownItem("Batch close");
    if (!item) throw new Error('Không thấy menu "Batch close".');
    item.click(); await sleep(800);
    const confirm = $$(".el-message-box__btns button, .el-dialog button")
      .find(b => vis(b) && /confirm|ok|确定|yes/i.test(norm(b.textContent)));
    if (confirm) { confirm.click(); await sleep(1200); }
    else warn("Không thấy nút Confirm khi close.");
  }

  // ----------------------- VÒNG CHẠY CHÍNH --------------------------------
  async function run() {
    log(`Mục tiêu: ${TARGET.size} ticket. SELECT_ONLY=${SELECT_ONLY}, STOP_BEFORE_CLOSE=${STOP_BEFORE_CLOSE}`);
    if (!(await waitForTable())) { warn("Bảng chưa load (chạy ngay sau reload?). Đợi bảng hiện đủ ticket rồi chạy lại."); return; }
    await goFirstPage();
    await ensureAllRowsRendered();
    const dbgRows = getPageRows();
    const dbgIds  = dbgRows.map(rowTicketId).filter(Boolean);
    log(`Debug: đọc được ${dbgRows.length} dòng, ${dbgIds.length} ID. Mẫu:`, dbgIds.slice(0, 5));
    if (!dbgIds.length) { warn("Không đọc được ID nào — gửi mình outerHTML 1 dòng trong bảng để mình chỉnh selector."); return; }
    let safety = 0;
    while (safety++ < 80) {
      await goFirstPage();
      await ensureAllRowsRendered();
      // tìm trang đầu tiên có chứa ticket mục tiêu
      let found = false;
      while (true) {
        if (pageHasTarget()) { found = true; break; }
        if (!(await goNextPage())) break;
        await ensureAllRowsRendered();
      }
      if (!found) { log("✔ Hết ticket mục tiêu — xong."); break; }

      await ensureAllRowsRendered();
      const n = selectTargetsOnPage();
      log(`Đã tick ${n} ticket ở trang hiện tại.`);

      if (SELECT_ONLY) { log("SELECT_ONLY: dừng để bạn kiểm tra phần chọn."); break; }

      await batchAddProblemAnalysis();
      await sleep(800);
      selectTargetsOnPage(); // tick lại phòng khi selection bị clear sau submit

      if (STOP_BEFORE_CLOSE) {
        log("STOP_BEFORE_CLOSE: đã thêm Problem Analysis, CHƯA close. Kiểm tra rồi đặt 2 cờ = false để chạy tiếp.");
        break;
      }
      await batchClose();
      await sleep(1200);
      // sau khi close, list dịch lên -> quét lại từ trang 1 ở vòng kế
    }
  }

  try { await run(); }
  catch (e) { warn("Lỗi:", e.message || e); }
})();
