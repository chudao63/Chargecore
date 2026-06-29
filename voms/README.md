# VOMS Automation Scripts — Hướng dẫn dùng

Bộ script chạy trong **Console trình duyệt** trên trang VOMS (`voms.vgreen.net`), gọi thẳng API `voms-api.vgreen.net/api/v1/repair-cases`.

Hai việc:
1. **Quét trạng thái** một list ticket (đọc thôi, không sửa gì) → xuất CSV/XLS.
2. **Quét + tự đóng** các ticket có log CPO = CLOSED (Sửa chữa → Hoàn công tự động).

---

## Hai file

| File | Việc |
|------|------|
| **`voms-scan-status.js`** | Quét trạng thái list ticket → xuất CSV/XLS/TSV |
| **`Quét và đóng các ticket có trạng thái Close VOMS.js`** | Quét + tự đóng ticket Close (có panel UI) |

> `voms-scan-status.js` là bản gộp đã thay thế các đời cũ (v1, v2, scan-ticket-using-api). Nó gồm: nhận cả ID lẫn mã `RC-`, fallback lấy JWT từ storage, khớp record chính xác, xuất CSV/XLS, map trạng thái đầy đủ, cảnh báo ID đuôi `0000`, hook bắt header lọc theo URL.

---

## Cách chạy chung

1. Mở trang VOMS, **đăng nhập sẵn**.
2. Bấm `F12` → tab **Console**.
3. Dán nội dung file → `Enter`.
4. Dừng giữa chừng (script quét): gõ `window.__scanStop = true`.

### Tự bắt token (không cần copy tay)
Script tự hook `XMLHttpRequest` + `fetch` để chộp `Authorization` và `X-Tenant-Id` từ request của app. Nếu chưa bắt được:
- Còn **fallback**: tự tìm JWT (`eyJ...`) trong `localStorage`/`sessionStorage` và giải `tid` từ payload token.
- Nếu vẫn báo *"Chưa bắt được token"* → **gõ tìm 1 ID bất kỳ trên trang** để app tự gọi API, rồi chạy lại script.

### Quy tắc kỹ thuật quan trọng
- Chỉ tham số **`search=`** hoạt động trên API. (`code=`, `keyword=`, `q=` đều trả 400.)
- Gặp **401/403** = hết phiên → script tự dừng. **F5 đăng nhập lại** rồi chạy lại.
- Lỗi mạng/CORS/5xx → tự retry tối đa 3 lần.

---

## Script quét trạng thái — `voms-scan-status.js`

### Chỉnh trước khi chạy
Dán list ID/mã vào biến `RAW` (mỗi dòng 1 cái, **giữ dạng chuỗi**). Nhận cả ID 18–19 số lẫn mã `RC-...`.

```js
const RAW = `
1123584011974082560
RC-YRO033X3N6I75
`;
```

Cấu hình tốc độ: `DELAY = 250` (ms nghỉ giữa request), `RETRIES = 3`, `RETRY_WAIT = 1500`.

### Kết quả
- Bảng chi tiết + bảng tổng hợp theo trạng thái in ra Console.
- **Tự copy TSV vào clipboard** → dán thẳng vào Excel.
- Tự tải về 2 file: `ticket_status_<timestamp>.csv` và `.xls` (ID/Serial ép kiểu Text để không bị làm tròn).
- Biến truy cập sau khi chạy:
  - `__scanResults` — mảng kết quả đầy đủ
  - `__scanByStatus` — gom ID theo trạng thái
  - `__scanTSV` — chuỗi TSV
  - Lấy ID 1 nhóm: `copy(__scanByStatus["Đóng"].join("\n"))`
  - Xem các nhóm có: `Object.keys(__scanByStatus)`

> Lưu ý: bản gộp **không in cột "RC"** riêng trong file xuất (vẫn đọc `code` bên trong, chỉ không có cột). Cột trong file: ID, Trạng thái, Status raw, Mã trạm, Serial, Ghi chú.

### Bảng map trạng thái (raw → tiếng Việt)

| Raw | Nhãn |
|-----|------|
| `pending` | Chờ xử lý |
| `assigned` | Đã phân công |
| `accepted` | KTV đã nhận |
| `in_progress` / `processing` | Đang xử lý |
| `completed` | Hoàn thành |
| `reopened` | Mở lại |
| `closed` | Đóng |
| `cancelled` / `canceled` | Đã huỷ |

Gặp mã lạ → thêm vào object `STATUS_VI`.

> ID đuôi `0000` bị đánh dấu *"ID nghi bị làm tròn (sai số)"* — dấu hiệu ID 18 số bị Excel làm tròn 15 số trước khi paste vào script. Phải lưu ID dạng **Text** trong Excel.

---

## Script quét + đóng ticket — `Quét và đóng các ticket có trạng thái Close VOMS.js`

> Phiên bản hiện tại: **v7**. Có Panel UI nổi, tự điền form theo tên cảnh báo, xuất CSV.

### Chạy
Dán file → Enter → hiện **panel nổi góc phải** (kéo thả được). Dán list ticket vào ô textarea → bấm **▶ Chạy**. Nút **⬇ CSV** tải lại file kết quả lần chạy gần nhất.

Gọi lại panel nếu lỡ tắt: `vomsPanel()`. Hoặc chạy không panel: `runAll(['RC-...','RC-...'])`.

### Luồng xử lý mỗi ticket (`processTicket`)
1. Search ID → mở chi tiết.
2. Đọc **Log CPO**. Không có `CLOSED`/`CLOSE` → **SKIP** (`NO_CLOSED`).
3. Đọc **"Tên cảnh báo CPO"** → tra bảng `PRESETS`. Không khớp → **SKIP** (`NO_PRESET`).
4. Bấm **Chỉnh sửa**, điền form theo preset:
   - Hình thức xử lý, Phân loại sửa chữa, Nhóm lỗi, Chi tiết lỗi, Nhóm xử lý, Hành động xử lý.
   - **Mô tả chi tiết lỗi** = `"trụ báo lỗi <tên cảnh báo thực tế>"` (điền động theo alarm).
   - **Mô tả chi tiết sửa chữa** = mặc định `"KTV kiểm tra, trụ đã xanh, hoạt động bình thường"`.
5. Bấm **Cập nhật** → **Sửa chữa** (xác nhận) → **Hoàn công** (xác nhận).
6. Xong → `DONE`, quay lại list.

### Quy tắc dừng mẻ
- `ABORT:*` và `UPDATE_FAIL` → **DỪNG TOÀN BỘ** để xử lý tay (form còn mở dở).
- `STUCK_HOANCONG` (đã Sửa chữa nhưng nút Hoàn công xám/mất) → **chạy tiếp**, chỉ ghi log để làm tay sau.

### Bảng mã trạng thái kết quả

| Status | Nghĩa | Cần tay? |
|--------|-------|:---:|
| `DONE` | Đóng thành công (Sửa chữa + Hoàn công) | |
| `NO_CLOSED` | Log CPO chưa có CLOSED → bỏ qua | |
| `NOT_FOUND` | Không tìm thấy ticket khi search | |
| `SKIP_STATE` | Không có nút "Sửa chữa" (có thể đã xử lý) | |
| `NO_EDIT` | Không có nút "Chỉnh sửa" | |
| `NO_PRESET:<mã>` | Mã cảnh báo chưa có trong PRESETS | |
| `DETAIL_TIMEOUT` | Trang chi tiết load không kịp | |
| `ERR_SEARCH` | Không thấy ô tìm kiếm | |
| `STUCK_HOANCONG` | Đã Sửa chữa, Hoàn công xám/mất | ✅ |
| `UPDATE_FAIL` | Dialog còn mở sau Cập nhật | ✅ |
| `ABORT:<bước>` | Dừng tại bước điền form | ✅ |

### Biến/hàm sau khi chạy
- `__lastResult` — map `{id: status}`
- `__lastRecords` — mảng `{id, status, alarm}`
- File xuất: `voms-close-result-<YYYYMMDD-HHMM>.csv` (cột: STT, Ticket, **Lỗi trụ gặp**, Trạng thái, Ghi chú, Cần xử lý tay).

> **Thêm mã mới:** thêm 1 dòng vào object `RAW` trong file, theo mẫu `mk(chiTietLoi, nhomXuLy, hanhDong, moTaLoi[, moTaSua])`. Mã nào không có trong bảng → ticket bị SKIP với `NO_PRESET`.

---

## Mẹo chống lỗi làm tròn ID (Excel)

ID ticket 18–19 số, kiểu `double` của Excel chỉ chính xác ~15 số → 3 số cuối bị về `000`.
- Trong file xuất, ID được bọc `="..."` (CSV) hoặc `mso-number-format:'\@'` (XLS) để ép **Text**.
- Khi tự nhập ID vào Excel: format ô **Text** trước, hoặc thêm dấu `'` đầu.
- So sánh ID giữa 2 cột: dùng `EXACT()` / `SUMPRODUCT()`, **không** so sánh số trực tiếp.