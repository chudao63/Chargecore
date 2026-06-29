# voms-scan-status.js

Script Console quét **trạng thái** một danh sách ticket VOMS qua API `repair-cases`. Đọc status từng ID/mã → dịch sang nhãn tiếng Việt → gom nhóm, đếm số lượng → xuất TSV/CSV/XLS.

> 🔀 **Đây là bản gộp v1 + v2.** Lấy v2 làm gốc và port thêm 4 thứ từ v1. Sau khi dùng ổn thì **xóa `Lọc trạng thái ticket VOMS v1/v2`** cũ đi, chỉ giữ file này.

## Dùng khi nào

Có danh sách ID (hoặc mã `RC-`) cần biết hiện đang ở trạng thái nào — lọc cái nào đã `closed`, `reopened`, chưa có KTV nhận, v.v. Chỉ **đọc**, không sửa ticket.

## Chạy ở đâu

- Trang VOMS (**đã đăng nhập**) → F12 → Console → dán danh sách vào biến `RAW` đầu file → dán cả script → Enter.
- **Dừng giữa chừng:** gõ `window.__scanStop = true` trong Console.
- Nếu báo chưa bắt được token → bấm tìm 1 ID bất kỳ trên trang VOMS rồi chạy lại.

## Gộp từ đâu

| Thành phần | Nguồn |
|---|---|
| Nhận cả `RC-` lẫn ID số | v2 |
| Fallback JWT từ local/sessionStorage + giải `tid` từ payload | v2 |
| Khớp record chính xác (`items.find(id/code)` rồi mới `items[0]`) | v2 |
| Xuất file CSV + XLS (ID ép Text, có sheet tổng hợp) | v1 |
| Map status đầy đủ (thêm `in_progress`/`processing`) | v1 |
| Cảnh báo ID nghi làm tròn (đuôi `0000`) | v1 |
| Hook bắt header **lọc theo URL** (chỉ tóm từ request repair-cases) | v1 |

## Cấu hình (sửa đầu file)

| Biến | Ý nghĩa |
|------|---------|
| `RAW` | Danh sách ID/mã, mỗi dòng một cái (string). |
| `DELAY` | Nghỉ giữa request (250ms). Tăng nếu bị chặn tần suất. |
| `RETRIES` | Số lần thử lại khi lỗi mạng/CORS/5xx (mặc định 3). |
| `RETRY_WAIT` | Chờ trước khi thử lại (1500ms). |
| `STATUS_VI` | Map mã status → nhãn tiếng Việt. Gặp mã lạ thì thêm vào đây. |

## Output

- **`console.table`** — bảng chi tiết + bảng tổng hợp theo trạng thái.
- **In theo nhóm** — list ID từng trạng thái, copy nhanh.
- **TSV** — tự `copy()` vào clipboard, dán thẳng Excel.
- **Tải file** — `ticket_status_<timestamp>.csv` và `.xls` (ID/Serial ép Text sẵn).
- **Biến global:** `__scanResults`, `__scanByStatus`, `__scanTSV`. Lấy ID 1 nhóm: `copy(__scanByStatus["Đóng"].join("\n"))`.

**Cột xuất ra:** ID · Trạng thái · Status raw · Mã trạm · Serial · Ghi chú. (Cột **RC** đã bỏ khỏi bảng/file; field `code` vẫn còn trong dữ liệu — chỉ hiện ở dòng log lúc chạy `... -> Đóng (RC-...)`.)

> 📝 File `.xls` thực ra là HTML-table đặt đuôi `.xls`, nên Excel hiện popup *"format and extension don't match"* — bấm **Yes** mở bình thường, dữ liệu an toàn. Không muốn popup thì dùng file `.csv` (cũng giữ ID dạng Text).

## Trạng thái (status code → nhãn)

`pending` = Chờ xử lý · `assigned` = Đã phân công · `accepted` = KTV đã nhận · `in_progress`/`processing` = Đang xử lý · `completed` = Hoàn thành · `reopened` = Mở lại · `closed` = Đóng · `cancelled`/`canceled` = Đã huỷ.

## Lưu ý / Gotcha

- **`search=` mới là param đúng.** API lọc bằng `?search=<id|RC->`. Các param `code=`, `keyword=`, `q=` trả **400** — đừng đổi.
- **ID 18 chữ số luôn là Text trong Excel.** File CSV bọc `="..."`, XLS ép `mso-number-format:'\@'` để không bị làm tròn. Dán TSV thủ công thì format cột ID/Serial = Text trước. Đối chiếu dùng `EXACT`/`SUMPRODUCT`, **không** `COUNTIF`.
- **ID nghi làm tròn:** ID kết thúc `0000` mà không tìm thấy → ghi chú "nghi bị làm tròn", dấu hiệu ID đã hỏng ở khâu trước.
- **Auth:** JWT Bearer + `X-Tenant-Id`, tự bắt từ request repair-cases (hook lọc URL nên không vớ nhầm token của backend khác). Fallback đọc `eyJ...` trong storage. **401/403** = hết phiên → F5 đăng nhập lại (script tự dừng).
- **Endpoint:** `https://voms-api.vgreen.net/api/v1/repair-cases`. Đọc `data.items[0].status` + `data.meta.totalItems`. `total > 1` → ghi chú "N kết quả khớp".

## Phụ thuộc

- Đăng nhập sẵn VOMS (JWT còn hạn).
- Cần ít nhất 1 request đã chạy để bắt header (thường fallback storage đủ, không cần mồi tay).