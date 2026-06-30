# Hướng dẫn đóng ticket CCTS — chạy theo RC

Bộ 4 script chạy ở **Console** trình duyệt (Chrome). Mọi thứ chạy theo **RC** (`thirdTicketId`, dạng `RC-xxxx`) để tránh lỗi làm tròn ID 19 chữ số.

```
Phase 0 (CCTS) → quét list, ra danh sách RC + Excel
Phase 1 (VOMS) → lọc RC nào VOMS đã "Đóng"
Phase 2 (CCTS) → nhóm RC đã đóng theo mã lỗi + lấy Solution / spare / file
Phase 3 (CCTS) → tick chọn từng nhóm rồi đóng tay
```

## Bảng tra nhanh

| Phase | Chạy ở trang | Dán gì vào đâu | Input | Output |
|---|---|---|---|---|
| 0 | CCTS | dán cả file → Enter → gõ `dumpRC()` | (không) | clipboard: list RC · file `ccts-list-rc.xlsx` |
| 1 | VOMS | dán list RC vào `RAW` → dán cả file → Enter | list RC (Phase 0) | clipboard: RC "Đóng" · file `voms-status-<ts>.xlsx` |
| 2 | CCTS | dán RC "Đóng" vào `RAW` → dán cả file → (`groupByErr()`) | list RC đã đóng (Phase 1) | list RC từng nhóm · file `ccts-nhom-loi.xlsx` |
| 3 | CCTS (màn list) | dán RC 1 nhóm vào `RAW` → dán cả file → Enter | list RC 1 nhóm (Phase 2) | tick sẵn các dòng → tự bấm đóng |

---

## Chuẩn bị (làm 1 lần mỗi lần mở Console)

1. Đăng nhập sẵn **VOMS** (`voms.vgreen.net`) và **CCTS** (`console.cnpowercore.com`).
2. Mở trang → **F12** → tab **Console**.
3. Lần đầu dán bị Chrome chặn → gõ `allow pasting` rồi Enter, sau đó dán lại.
4. "Dán list vào `RAW`": trong file có đoạn giữa 2 dấu nháy ngược `` ` ``. Xoá dòng mẫu, dán list của bạn vào (mỗi dòng 1 cái, copy thẳng từ Excel, không cần dấu phẩy/nháy).

---

## Phase 0 — Lấy danh sách RC (trang CCTS)

**File:** `ccts-phase0-dump-rc.js`

1. Vào màn **danh sách ticket** CCTS, bấm **search 1 lần** (để script bắt được token).
2. Console → dán **cả file** → Enter.
3. Gõ: **`dumpRC()`** → Enter.

- **Input:** không cần. Bộ lọc (EV / dinh / khoảng ngày) nằm ở `CFG` đầu file, sửa nếu cần.
- **Output:**
  - List **RC** tự copy vào clipboard → dán thẳng sang Phase 1.
  - File **`ccts-list-rc.xlsx`** (RC, cctsTicketId, errorCode, trạm…) để tham khảo.
  - Giữ sẵn `window.__cctsTable` trong tab → Phase 2 dùng lại được (khỏi quét lại).
- Ticket **không có RC** (BSS / tạo tay) sẽ được liệt kê riêng — mấy cái này verify VOMS không được, xử lý tay.

---

## Phase 1 — Lọc RC đã đóng bên VOMS (trang VOMS)

**File:** `ccts-phase1-voms-by-rc.js`

1. Sang tab **VOMS**, **search thử 1 ticket bất kỳ 1 lần** (để bắt token).
2. Mở file bằng Notepad → dán list RC (từ Phase 0) vào `RAW`.
3. Console → dán **cả file** → Enter (chạy luôn, không cần gõ thêm).

- **Input:** list **RC** cần kiểm tra.
- **Output:**
  - Bảng tổng hợp theo trạng thái trong Console.
  - List **RC trạng thái "Đóng"** tự copy vào clipboard → dán sang Phase 2.
  - File **`voms-status-<thời-gian>.xlsx`** (sheet Chi_tiet + Tong_hop).
  - Lấy lại bất cứ lúc nào: `copy(__scanByStatus["Đóng"].join("\n"))`
- Dừng giữa chừng: gõ `window.__scanStop = true` → Enter.

> Chỉ RC **"Đóng"** mới được mang sang Phase 2/3. Đây là điều kiện bắt buộc trước khi đóng CCTS.

---

## Phase 2 — Nhóm theo mã lỗi + lấy Solution/spare (trang CCTS)

**File:** `ccts-phase2-group-by-errorcode.js`

1. Mở file → dán list **RC đã đóng** (từ Phase 1) vào `RAW`.
2. Console → dán **cả file** → Enter.
   - Nếu **cùng tab** vừa chạy Phase 0: tự chạy luôn (dùng lại `__cctsTable`).
   - Nếu không: bấm search list 1 lần (bắt token) rồi gõ **`groupByErr()`**.

- **Input:** list **RC đã đóng**.
- **Output:**
  - In **list RC từng nhóm errorCode** ra Console.
  - File **`ccts-nhom-loi.xlsx`** — mỗi mã lỗi 1 sheet, cột: RC, cctsTicketId, errorName, trạm, **Solution**, **Vật tư (spare)**, **Số file**, **Link file**.
  - Lấy RC 1 nhóm để dán Phase 3: `copy(__byErr["C2405"].join("\n"))` · xem các nhóm: `Object.keys(__byErr)`
- RC rỗng mã lỗi → gom vào nhóm `KHONG_CO_MA`. RC không tìm thấy trong list → sheet `KHONG_THAY`.
- Bước này gọi thêm 2 API/RC (Solution + spare) nên chạy hơi lâu, cứ để chạy.

---

## Phase 3 — Tick theo nhóm rồi đóng tay (trang CCTS)

**File:** `ccts-phase3-tick-by-rc.js`

1. Ở màn **list ticket** CCTS, đặt **số dòng/trang = 100 hoặc 200** để cả nhóm hiện trên 1 trang.
2. Mở file → dán list **RC của 1 nhóm** (lấy từ Phase 2 / 1 sheet Excel) vào `RAW`.
3. Console → dán **cả file** → Enter. Script tự tick các dòng khớp RC.
4. Nhìn lên màn hình kiểm tra dòng đã tick đúng → **bấm nút đóng ticket bằng tay**.
5. Lặp lại bước 2 cho nhóm tiếp theo.

- **Input:** list **RC** của 1 nhóm.
- **Output:** mỗi RC hiện ✅ tick mới / ☑️ đã sẵn tick / 🚫 disabled / ❌ không thấy + dòng `Khớp x/N`.
- Chạy lại nhiều lần **an toàn** — cái nào tick rồi giữ nguyên, không bị đóng tự động.

> **Lưu ý quan trọng:** Phase 3 khớp bằng cách tìm chuỗi RC trong từng dòng, nên **list phải đang hiển thị cột chứa RC** (`thirdTicketId`). Nếu báo ❌ "không thấy" hàng loạt → bật cột RC trên list (hoặc báo lại để đổi sang khớp bằng `cctsTicketId`).

---

## Lỗi thường gặp

| Hiện tượng | Xử lý |
|---|---|
| Chrome chặn dán | Gõ `allow pasting` → Enter → dán lại |
| "Chưa bắt được token" (CCTS) | Search list / mở 1 ticket 1 lần rồi gõ lại hàm |
| "Chưa bắt được token" (VOMS) | Search 1 ticket trên VOMS 1 lần rồi chạy lại |
| HTTP 401/403 | Phiên hết hạn → F5 đăng nhập lại rồi chạy lại |
| Phase 3 ❌ hàng loạt | Tăng số dòng/trang lên 100–200; kiểm tra list có hiện cột RC |
| Excel không tải | Lần chạy đầu cần mạng để nạp thư viện SheetJS từ CDN |

## Quy tắc an toàn

- Chỉ đóng ticket CCTS khi VOMS đã "Đóng" (Phase 1 xác nhận).
- Script chỉ **tick**, người vẫn là người **bấm đóng cuối cùng**.
- Token/cookie tạm thời nằm trong Console — không chia sẻ cho người ngoài; xong việc nên đăng nhập lại để cấp phiên mới.
