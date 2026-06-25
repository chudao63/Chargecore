# Chargecore — Automation & Tools

Tập hợp script tự động hóa và app nội bộ phục vụ vận hành BSS / EV charging,
làm việc trên 2 hệ thống chính: **CCTS** (console.cnpowercore.com) và **VOMS** (voms.vgreen.net).

## Cấu trúc

| File / Folder | Loại | Mục đích |
|---|---|---|
| `bss_app2/` | Flutter app | Mã nguồn app BSS Checksheet — chụp ảnh kiểm tra có watermark cho KTV |
| `BSS_Rework_Checksheet.apk` | Build | Bản APK đã build của app trên (xem ghi chú bên dưới) |
| `Lọc trạng thái ticket VOMS v1.txt` | Console script | Lọc / nhóm ticket VOMS theo trạng thái (bản v1) |
| `Lọc trạng thái ticket VOMS v2.txt` | Console script | Bản v2 — cải tiến của v1 |
| `Quét và đóng các ticket có trạng thái Closed.txt` | Console script | Quét ticket VOMS (RC-) tìm CPO log trạng thái CLOSED rồi đóng |
| `Thông tin đã note CCTS và VOMS.txt` | Ghi chú | Note kỹ thuật: endpoint, tham số, lưu ý của 2 hệ thống |

## Cách dùng script

Các file `.txt` là script chạy trên **Console trình duyệt** (F12 → Console):

1. Mở đúng trang hệ thống (CCTS hoặc VOMS) và đã đăng nhập.
2. Mở Console, paste nội dung script, Enter.
3. Theo dõi log in ra để biết tiến độ.

## Ghi chú kỹ thuật quan trọng

- **CCTS — lỗi precision:** dùng `cctsTicketPk` làm khóa chính cho mọi API call.
  KHÔNG dùng `cctsTicketId` (bị làm tròn do số 19 chữ số) để gọi API.
- **VOMS — tra cứu RC code:** dùng tham số `search=RC-...` để tìm chính xác,
  không dùng `code=` / `keyword=` / `q=`.
- ID dạng số rất dài (18–19 chữ số) dễ bị lỗi làm tròn — luôn xử lý dưới dạng chuỗi.

## App BSS Checksheet (`bss_app2/`)

App Flutter cho KTV chụp ảnh kiểm tra hiện trường, watermark thông tin (SN, GPS,
địa chỉ, thời gian, ghi chú) burned-in vào ảnh.

- Build APK: `flutter build apk --release`
- File APK ra ở: `build/app/outputs/flutter-apk/app-release.apk`
