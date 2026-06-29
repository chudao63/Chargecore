# ccts-batch-analysis-close.js - Đang lỗi chưa check VOMS và overdue -> gây ra lỗi bên VOMS chưa đóng nhưng bên mình đóng -> Cần sửa logic và ghép vào thành hàm

Script chạy trong **Console trình duyệt** để đóng hàng loạt ticket CCTS qua **giao diện** (DOM Element UI), không gọi API. Flow: tick chọn ticket → Batch add problem analysis → Submit → Batch close → Confirm.

> ⚠️ **Phân biệt với `ccts-auto-close.js`:** con kia gọi thẳng API POST (`batchSubmitCloseRequest`), tự capture token. Con **này** click trực tiếp lên UI — chậm hơn nhưng không cần token, đi đúng luồng người dùng nên ít rủi ro bị server từ chối. Dùng khi muốn "đóng tay an toàn" một danh sách ID cụ thể.

## Dùng khi nào

Có sẵn một **danh sách ID ticket** cần đóng với cùng một lý do ("trụ xanh, KTV kiểm tra bình thường"), muốn xử lý hàng loạt thay vì click từng cái.

## Chạy ở đâu

- Trang: `console.cnpowercore.com`, **tab list ticket** (bảng đang hiện ticket).
- Mở DevTools → Console → dán toàn bộ script → Enter.
- Bảng phải **load xong** trước khi chạy (script có `waitForTable` chờ tối đa ~20s, nhưng đừng chạy ngay lúc trang còn trắng).

## Cấu hình (sửa đầu file)

| Biến | Ý nghĩa |
|------|---------|
| `TARGET_IDS` | Mảng ID ticket (**string**, 18–19 chữ số). Đây là ID hiển thị trên UI. |
| `REASON` | Lý do điền vào ô Reason Explanation. Mặc định: `"KTV kiểm tra, trụ xanh hoạt động bình thường"`. |
| `SELECT_ONLY` | `true` = **chỉ tick chọn rồi dừng**, không mở dialog. Dùng để test trước. |
| `STOP_BEFORE_CLOSE` | `true` = làm xong Problem Analysis trang đầu rồi **dừng**, chưa close. |
| `PAGE_WAIT` | ms chờ bảng render lại sau khi đổi trang (mặc định 900). Tăng nếu mạng/bảng chậm. |

## Quy trình test an toàn (làm theo thứ tự)

1. **Lần 1:** `SELECT_ONLY = true` → chạy, xem nó tick đúng số ticket mong đợi chưa.
2. **Lần 2:** `SELECT_ONLY = false`, `STOP_BEFORE_CLOSE = true` → chạy, kiểm tra Problem Analysis điền đúng (Others → Error recover by it self + reason) và Submit OK.
3. **Lần 3 (chạy thật):** cả hai = `false` → chạy full: analysis + close toàn bộ các trang.

## Cách hoạt động (tóm tắt)

- **Per-page:** quét từng trang, tick ticket mục tiêu có trên trang đó rồi xử lý, sau đó sang trang kế. Đúng dù bảng bật/tắt reserve-selection.
- Checkbox lấy từ bảng **fixed-left** (`.el-table__fixed`) vì đó là chỗ checkbox tương tác được.
- **Problem Category** chọn theo cascader 2 cấp: `["Others", "Error recover by it self"]`.
- Sau mỗi Submit, **tick lại** ticket phòng khi selection bị clear.
- Vòng `run()` luôn quay về trang 1 mỗi vòng (vì list dịch lên sau khi đóng), có `safety` counter tối đa 80 vòng chống loop vô hạn.

## Lưu ý / Gotcha

- **ID luôn để dạng STRING.** ID 18–19 chữ số vượt giới hạn chính xác của `Number` trong JS — để dạng số là sai cuối ID ngay. Trong `TARGET_IDS` đã bọc `"..."`, đừng bỏ ngoặc kép.
- `rowTicketId()` nhận diện ID bằng regex "chuỗi ≥16 chữ số", không phụ thuộc tên cột → nếu CCTS đổi layout cột vẫn chạy.
- `setReactiveValue()` set value kiểu Vue (gọi native setter + dispatch `input`/`change`), nếu không Vue không nhận giá trị ô Reason.
- Selector phụ thuộc Element UI (`.el-table`, `.el-cascader`, `.el-dropdown`, `.el-pagination`). Nếu CCTS nâng cấp framework UI thì cần chỉnh selector.
- Nếu Console báo "Không đọc được ID nào" → gửi `outerHTML` 1 dòng trong bảng để chỉnh lại selector.

## Phụ thuộc

- Đăng nhập sẵn CCTS (script đi qua UI nên dùng session đang mở).
- Không cần token/cookie thủ công.