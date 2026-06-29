# ccts-resolve-ids.js

Script chạy trong **Console trình duyệt** để tra **external ID** (`thirdTicketId`, dạng `RC-...`) → ra **Ticket ID CCTS**. Trả về `cctsTicketPk` (PK chuẩn), `cctsTicketId` (hiển thị, lossy) và `status`.

> 💡 **Khác với 2 script close:** con này **gọi API** `findCCTSTicket` (có token auto-capture), không đụng UI. Việc của nó chỉ là **tra cứu / resolve ID**, không sửa gì cả — chạy thoải mái, không lo đóng nhầm.

## Dùng khi nào

Có danh sách mã `RC-...` (từ VOMS hoặc nguồn ngoài) mà cần biết ticket CCTS tương ứng — đặc biệt cần lấy **`cctsTicketPk`** để feed sang các script đóng/phân tích khác.

## Chạy ở đâu

- Trang: `console.cnpowercore.com`, F12 → Console.
- Dán danh sách `RC-` vào biến `EXTERNAL_IDS` → dán cả file → Enter.
- Nếu báo **chưa bắt được token** → bấm Search/refresh list trên UI 1 lần để trigger 1 request, token tự bắt rồi chạy lại.

## Cấu hình (sửa đầu file)

| Biến | Ý nghĩa |
|------|---------|
| `EXTERNAL_IDS` | Danh sách `RC-...`, ngăn cách bằng xuống dòng / space / phẩy đều được. |
| `FIND` | Endpoint: `cloud.cnpowercore.com:8091/ccts/cctsTicket/findCCTSTicket`. |
| `DELAY_MS` | Nghỉ giữa các request (mặc định 300ms) cho lịch sự, tránh spam server. |
| `PAGE_SIZE` | Số kết quả/trang khi tìm (mặc định 10). |
| `TIMEZONE` | `timezoneOffset` = 420 (GMT+7). |

## Output

3 dạng, lấy cái nào tùy nhu cầu:
- **`console.table`** — bảng nhìn nhanh trên Console.
- **TSV** — in ra Console để **copy thẳng vào Excel**. ⚠️ **Format cột PK/ID = Text TRƯỚC khi dán** (xem lưu ý precision).
- **`window.__cctsResolveResults`** — mảng kết quả còn lại trong biến global, dùng tiếp ở script khác trong cùng tab.

## Lưu ý / Gotcha

- **Precision là điểm sống còn.** Script đọc **raw `response.text()`**, **KHÔNG** `JSON.parse` — vì PK 19 chữ số sẽ bị làm tròn nếu qua Number. Parse bằng cách `split('"cctsTicketPk":')` rồi regex từng chunk → tránh ghép nhầm field giữa các ticket.
- **`cctsTicketPk` mới là PK thật.** `cctsTicketId` hiển thị trên UI bị lossy (làm tròn 19 chữ số, kiểu `...001 → ...000`). Khi feed sang script đóng/phân tích, **luôn dùng `cctsTicketPk`**, đừng dùng `cctsTicketId`.
- **Excel:** ID dài là Text, không phải Number. Dán vào ô General là Excel làm tròn cuối ID ngay. Nếu cần đối chiếu trong Excel, dùng `EXACT`/`SUMPRODUCT`, **không** dùng `COUNTIF` (COUNTIF cũng làm tròn 15 chữ số).
- **Token:** tự bắt qua hook `fetch` + `XHR` (nhặt field `token` trong body POST tới `/ccts/`). Hook chỉ cài 1 lần (`window.__ccts_token_hooked`). Auth qua cookie `ssoticket` nên fetch dùng `credentials:'include'`.
- **Khớp ticket:** ưu tiên ticket có `thirdTicketId` đúng bằng `RC-` đang tra; nếu không có thì lấy kết quả đầu tiên. Nếu một `RC-` map ra nhiều ticket lạ thì kiểm tra lại thủ công.

## Phụ thuộc

- Đăng nhập sẵn CCTS (cần cookie `ssoticket`).
- Cần 1 request đã chạy để bắt token (bấm Search trên UI nếu chưa có).
