# Hướng dẫn sử dụng — Đóng ticket CCTS bằng script

Tài liệu này dành cho người **không cần biết code**. Bạn chỉ cần làm theo từng bước: copy → dán → bấm Enter. Cứ làm đúng thứ tự là được.

---

## 0. Chuẩn bị (làm 1 lần, hiểu để dùng cả 3 phase)

### Bạn cần có
- Tài khoản đăng nhập sẵn vào **VOMS** (`voms.vgreen.net`) và **CCTS** (`console.cnpowercore.com`).
- 3 file script (do bộ phận kỹ thuật cung cấp): `ccts-phase1-voms-scan-status.js`, `ccts-phase2-scan-solution.js`, `ccts-phase3-tick-by-group.js`. Mở bằng Notepad là thấy nội dung để copy.

### Cách mở "Console" để chạy script
Console là ô để dán script vào. Cách mở:
1. Mở trang web (VOMS hoặc CCTS) trên trình duyệt **Chrome**.
2. Bấm phím **F12** (hoặc chuột phải vào trang → **Inspect / Kiểm tra**).
3. Một bảng hiện ra. Bấm vào tab tên **Console** ở phía trên.
4. Chỗ con trỏ nhấp nháy chính là nơi dán script.

> **Lần đầu dán script, Chrome có thể chặn vì lý do an toàn.** Nếu thấy dòng chữ yêu cầu, gõ đúng chữ `allow pasting` rồi Enter, sau đó dán lại. Chỉ cần làm 1 lần cho mỗi lần mở.

### Cách "dán danh sách ID" vào script
Trong mỗi file script có một đoạn nằm giữa **2 dấu nháy ngược** ` (giống dấu huyền, thường ở phím trên cùng bên trái bàn phím). Ví dụ:

```
const RAW = `
1123769398138896384
1123752141192298496
`;
```

Bạn **xoá mấy dòng số mẫu** ở giữa và **dán danh sách của bạn vào đúng chỗ đó** (mỗi ID một dòng, copy thẳng từ Excel là được, không cần thêm dấu phẩy hay dấu nháy gì cả).

---

## Luồng tổng quát (đọc để hình dung)

```
Phase 1: Hỏi VOMS xem ticket nào đã ĐÓNG chưa
            │   (chỉ ticket VOMS đã đóng mới được đóng tiếp bên CCTS)
            ▼
Phase 2: Lấy nội dung "Solution" của từng ticket → ra file Excel
            │   (để biết mỗi ticket bị lỗi gì)
            ▼
Phase 3: Trong Excel, gom các ticket cùng loại lỗi thành nhóm
            │   rồi tick chọn từng nhóm trên CCTS → bấm đóng bằng tay
            ▼
        Xong
```

---

## Phase 1 — Kiểm tra VOMS đã đóng ticket chưa

**Mục đích:** Bạn chỉ được đóng ticket bên CCTS sau khi bên VOMS đã đóng. Phase này giúp bạn biết ticket nào VOMS đã đóng.

**Làm ở trang VOMS** (`voms.vgreen.net`).

1. Đăng nhập VOMS. Bấm tìm thử **1 ticket bất kỳ** một lần (bước này để script "bắt" được quyền truy cập — quan trọng, đừng bỏ).
2. Mở Console (F12 → tab Console).
3. Mở file `ccts-phase1-voms-scan-status.js` bằng Notepad. Dán **danh sách mã RC hoặc ID** cần kiểm tra vào giữa 2 dấu nháy ngược (xem mục 0).
4. Copy **toàn bộ** nội dung file đã sửa → dán vào Console → Enter.

**Kết quả bạn thấy:**
- Màn hình chạy từng dòng, ví dụ: `[1/50] RC-XXXX → Đóng`. Mỗi ticket hiện trạng thái của nó.
- Cuối cùng có bảng tổng hợp gom theo trạng thái (bao nhiêu cái "Đóng", bao nhiêu "Đang xử lý"...).
- File Excel (`.csv` và `.xls`) **tự động tải về** máy. Danh sách cũng được tự copy sẵn, có thể dán thẳng vào Excel.

**Việc của bạn:** lấy ra những ticket có trạng thái **"Đóng"** — đó là các ticket được phép xử lý tiếp ở Phase 2 & 3.

> Muốn dừng giữa chừng: gõ `window.__scanStop = true` vào Console rồi Enter.

---

## Phase 2 — Lấy nội dung Solution của từng ticket

**Mục đích:** Lấy phần "Solution" (mô tả cách xử lý / lỗi) của mỗi ticket, xuất ra Excel để bạn phân loại lỗi.

**Làm ở trang CCTS** (`console.cnpowercore.com`).

1. Đăng nhập CCTS, vào màn danh sách ticket. Bấm **search / tải lại danh sách** một lần (để script bắt được quyền truy cập).
2. Mở Console (F12 → tab Console).
3. Mở file `ccts-phase2-scan-solution.js`. Dán **danh sách ID ticket** (các ticket VOMS đã đóng ở Phase 1) vào giữa 2 dấu nháy ngược.
4. Copy toàn bộ file → dán vào Console → Enter.
5. Gõ thêm dòng này rồi Enter để bắt đầu chạy: **`solScan()`**

**Kết quả bạn thấy:**
- Chạy từng ticket: ✅ là lấy được solution, ⚪ là ticket trống (không có nội dung), ❌ là lỗi.
- Cuối có tổng hợp: bao nhiêu cái có solution, bao nhiêu trống/lỗi.
- File **`ccts-solutions.xlsx`** tự tải về máy.

> Nếu màn hình báo "**Chưa bắt được token**": quay lại trang CCTS, bấm search danh sách hoặc mở 1 ticket một lần, rồi gõ lại `solScan()`.

---

## Phase 3 — Tick chọn theo nhóm rồi đóng tay

**Mục đích:** Sau khi đã phân loại lỗi trong Excel, tick chọn từng nhóm ticket trên CCTS để đóng.

### Trước tiên: phân nhóm trong Excel
1. Mở file `ccts-solutions.xlsx` từ Phase 2.
2. Đọc cột **Solution**, gom các ticket cùng loại lỗi thành nhóm (ví dụ: nhóm "trùng ticket", nhóm "mở cửa"...). Có thể dùng lọc/sắp xếp của Excel.
3. Với **mỗi nhóm**, copy cột **TicketID** của nhóm đó (chỉ riêng nhóm đang xử lý).

### Sau đó: tick và đóng từng nhóm
**Làm ở trang CCTS**, ở màn danh sách ticket.

1. **Quan trọng:** chỉnh số dòng hiển thị mỗi trang lên **100** (hoặc 200) để tất cả ticket của nhóm hiện trên cùng 1 trang. Tránh việc chuyển trang làm mất dấu tick.
2. Mở Console (F12 → tab Console).
3. Mở file `ccts-phase3-tick-by-group.js`. Dán **danh sách ID của nhóm** (vừa copy từ Excel) vào giữa 2 dấu nháy ngược.
4. Copy toàn bộ file → dán vào Console → Enter.
5. Script sẽ tự tick các dòng tương ứng.

**Kết quả bạn thấy:**
- Từng ID: ✅ "tick mới" (vừa tick), ☑️ "đã sẵn tick", ❌ "không thấy trên màn hình".
- Dòng tổng hợp: `Khớp x/N` — cho biết tick được bao nhiêu trên tổng số.

6. Nhìn lên màn hình CCTS kiểm tra các dòng đã được tick đúng → bấm nút **đóng ticket** bằng tay như bình thường.
7. Làm lại từ bước 3 cho **nhóm tiếp theo**.

> Nếu báo `❌ không thấy` vài ticket: chúng có thể ở trang khác (tăng số dòng/trang rồi chạy lại) hoặc đã bị đổi trạng thái (kiểm tra lại bộ lọc). Chạy lại script nhiều lần **không gây lỗi** — cái nào tick rồi sẽ giữ nguyên.

---

## Các lỗi thường gặp & cách xử lý

| Hiện tượng | Cách xử lý |
|---|---|
| Chrome chặn không cho dán | Gõ `allow pasting` rồi Enter, sau đó dán lại |
| Báo "Chưa bắt được token" | Quay lại trang, search danh sách / mở 1 ticket một lần rồi chạy lại |
| Phase 1 báo "ID nghi bị làm tròn" | Lấy lại mã từ hệ thống cho chính xác (đừng sửa tay) |
| Phase 3 tick thiếu vài cái | Tăng số dòng/trang lên 100–200, chạy lại; hoặc kiểm tra ticket còn trong danh sách không |
| Tick xong chuyển trang thì mất tick | Đặt số dòng/trang đủ lớn để cả nhóm trên 1 trang, đóng tay trước khi chuyển trang |
| Lỡ tick nhầm | Bỏ tick thủ công trên màn hình, hoặc tải lại trang để xoá hết tick rồi làm lại |

---

## Quy tắc an toàn cần nhớ

- **Luôn xem lại trên màn hình** trước khi bấm đóng — script chỉ giúp tick, **người vẫn là người bấm đóng cuối cùng**.
- Chỉ đóng ticket khi VOMS đã đóng (Phase 1 xác nhận).
- Chạy lại script không sao — nó không bấm đóng tự động, chỉ tick.
- Không chia sẻ nội dung Console cho người ngoài (có thể chứa thông tin đăng nhập tạm thời).
