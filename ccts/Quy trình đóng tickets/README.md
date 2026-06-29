# CCTS — Quy trình đóng ticket (Pending for local team close)

Bộ script chạy ở **Console** trình duyệt để hỗ trợ đóng ticket CCTS phụ thuộc trạng thái đóng bên VOMS.

## Cấu trúc thư mục

```
ccts/
├─ README.md                          ← tài liệu này
├─ ccts-phase1-voms-scan-status.js    ← Phase 1: quét trạng thái VOMS
├─ ccts-phase2-scan-solution.js       ← Phase 2: quét Solution CCTS → Excel
└─ ccts-phase3-tick-by-group.js       ← Phase 3: tick theo nhóm lỗi
```

## Tổng quan luồng

```
[Phase 1] Lọc list ticket CCTS "Pending for local team close" (KTV xong, chờ mình đóng)
            │  Lấy list RC-/ID → quét VOMS → biết ticket nào VOMS đã ĐÓNG
            ▼  => Danh sách ticket đủ điều kiện đóng (đối chiếu RC ↔ ticket CCTS)
[Phase 2] Quét mục Solution của từng ticket CCTS  →  xuất Excel
            │
            ▼
[Phase 3] Lọc Excel, gom nhóm theo loại lỗi (trùng ticket, mở cửa, ...)
            │  với mỗi nhóm:
            ▼  tick các ticket trên list CCTS  →  đóng tay
```

---

## Phase 1 — Quét trạng thái VOMS (`ccts-phase1-voms-scan-status.js`)

Mục đích: với danh sách RC-/ID, gọi API VOMS để biết ticket nào đã **Đóng** — đây là điều kiện tiên quyết trước khi đóng bên CCTS.

- Chạy trên trang **VOMS** (`voms.vgreen.net`, đã đăng nhập): F12 → Console → dán → Enter.
- Input: dán list RC-/ID vào biến `RAW` (mỗi dòng 1 cái, giữ dạng chuỗi).
- API: `GET voms-api.vgreen.net/api/v1/repair-cases?...&search=<id|RC->` — `search=` là param lọc duy nhất hoạt động.
- Auth: tự bắt `Authorization` + `X-Tenant-Id` qua hook XHR/fetch **lọc theo URL**; fallback lấy JWT từ local/sessionStorage.
- Dừng giữa chừng: `window.__scanStop = true`.

**Output:**
- Log từng ticket + bảng `console.table` tổng hợp theo trạng thái.
- Tự copy TSV vào clipboard (dán thẳng Excel) + tải file `ticket_status_<timestamp>.csv` và `.xls`.
- ID bọc `="..."` trong CSV để Excel không làm tròn; cảnh báo ID nghi làm tròn (đuôi `0000`).
- Lấy ID 1 nhóm: `copy(__scanByStatus["Đóng"].join("\n"))`.

---

## Phase 2 — Quét Solution CCTS (`ccts-phase2-scan-solution.js`)

Mục đích: lấy mục Solution của từng ticket CCTS → xuất Excel để phân loại lỗi.

- Chạy trên trang **CCTS** (`console.cnpowercore.com`): dán → Enter → gõ `solScan()`.
- Input: dán list `cctsTicketPk` vào `RAW`.
- API: `POST cloud.cnpowercore.com:8091/ccts/cctsTicketSolution/findCCTSTicketSolution`, body `{cctsTicketPk, page, token}`, field lấy `cctsTicketSolutionContent`.
- Auth: cookie `ssoticket` (`credentials:'include'`) + `token` tự bắt từ request.

**Output:** log từng ticket (✅ có solution / ⚪ trống / ❌ lỗi) + tổng hợp + xuất `ccts-solutions.xlsx` (cột TicketID dạng Text). Nhiều bản ghi solution nối bằng ` ||| `.

---

## Phase 3 — Tick theo nhóm lỗi (`ccts-phase3-tick-by-group.js`)

Mục đích: sau khi gom nhóm từ Excel, tick chọn các ticket của nhóm để đóng tay.

- Chạy trên trang **CCTS**, ở màn list ticket: dán list nhóm vào `RAW` → Enter.
- Input: ID dạng **UI** (kết thúc `...0`), dán thẳng từ Excel (không cần dấu phẩy/nháy).
- Khớp dòng: bắt số dài trong dòng → lấy **19 chữ số cuối** (bỏ STT dính đầu) → so khớp.
- Idempotent: kiểm tra `is-checked` trước, không toggle ngược → chạy lại an toàn.

**Output:** log từng ID (✅ tick mới / ☑️ đã sẵn tick / 🚫 disabled / ❌ không thấy) + tổng hợp `Khớp x/N`.

---

## Ghi chú kỹ thuật quan trọng

- **ID 19 chữ số bị làm tròn:** `cctsTicketPk` (PK thật) qua double JS/UI chỉ chính xác ~16 chữ số đầu, đuôi làm tròn (`...385` → `...384`).
  - Gọi API (Phase 2): gửi nguyên `cctsTicketPk` dạng chuỗi → chính xác tuyệt đối.
  - Khớp DOM (Phase 3): lấy ID dạng UI (đã làm tròn) từ Excel, khớp theo 19 số cuối của dòng.
- **Đọc response:** dùng `response.text()` + regex, không `JSON.parse` cả cục (tránh ghép field sai giữa các ticket).
- **Token (CCTS):** tự bắt từ request bất kỳ qua hook. Nếu báo chưa có token → search lại list hoặc mở 1 ticket 1 lần.
- **Phân trang & giữ tick (Phase 3):** Element UI chỉ giữ tick qua trang nếu bật `reserve-selection`. Để chắc → đặt page size 100/200 cho hiện hết rồi chạy 1 lần; hoặc tick từng trang và đóng tay ngay trên trang đó.
- **Excel:** cột TicketID/Serial để dạng Text, đối chiếu bằng `EXACT`/`SUMPRODUCT` (tránh làm tròn 15 chữ số).

## Tham chiếu API

| Hệ | Mục đích | Endpoint |
|---|---|---|
| VOMS | List/trạng thái repair-case | `GET voms-api.vgreen.net/api/v1/repair-cases?search=<id\|RC->` |
| CCTS | List ticket | `POST cloud.cnpowercore.com:8091/ccts/cctsTicket/findCCTSTicket` |
| CCTS | Lấy solution | `POST .../ccts/cctsTicketSolution/findCCTSTicketSolution` |
| CCTS | Phân tích lỗi | `POST .../ccts/cctsTicketErrorAnalysis/addCCTSTicketErrorAnalysis` |
| CCTS | Yêu cầu đóng | `POST .../ccts/cctsTicket/batchSubmitCloseRequest` |

- VOMS: auth `Authorization` + `X-Tenant-Id`; `search=` là param lọc duy nhất.
- CCTS: auth cookie `ssoticket` (`credentials:'include'`), body có field `token`.
