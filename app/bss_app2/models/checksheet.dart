/// Mô hình hoá checksheet BSS đã được xác nhận.
/// Mục 3 rẽ nhánh theo loại khóa (SJ / SK).

class Position {
  final String slug; // dùng cho tên file, vd "khoang6-trai"
  final String label; // hiển thị, vd "Khoang 6 · Trái"
  const Position(this.slug, this.label);
}

enum Media { photo, video, either }

class Task {
  final String code; // mã hạng mục, vd "03-Sensor" (dùng cho tên file + ảnh mẫu)
  final String name;
  final String sub;
  final Media media;
  final String group;
  final List<Position>? positions; // null = không theo vị trí
  final bool side; // có phân trái/phải hay không
  final int minCount; // số tối thiểu khi không theo vị trí
  final bool multi; // cho phép nhiều ảnh (vd checklist dài)
  final bool allowNa; // cho phép đánh dấu không áp dụng
  final String note;

  const Task({
    required this.code,
    required this.name,
    this.sub = '',
    this.media = Media.photo,
    this.group = '',
    this.positions,
    this.side = false,
    this.minCount = 1,
    this.multi = false,
    this.allowNa = false,
    this.note = '',
  });

  int get required => positions != null ? positions!.length : minCount;
}

List<Position> _khoangSide(int n) {
  final l = <Position>[];
  for (var k = 1; k <= n; k++) {
    l.add(Position('khoang$k-trai', 'Khoang $k · Trái'));
    l.add(Position('khoang$k-phai', 'Khoang $k · Phải'));
  }
  return l;
}

List<Position> _khoangOnly(int n) {
  final l = <Position>[];
  for (var k = 1; k <= n; k++) {
    l.add(Position('khoang$k', 'Khoang $k'));
  }
  return l;
}

/// Sinh danh sách hạng mục theo loại tủ và loại khóa.
List<Task> buildTasks({required String cab, required String lock}) {
  final n = cab == 'BSS-12' ? 12 : 6;
  final t = <Task>[];

  t.add(Task(code: '01-SN', name: 'Ảnh SN trên thân tủ', sub: 'Ảnh toàn cảnh', group: 'Khởi tạo'));
  t.add(Task(code: '02-FW', name: 'Ảnh FW màn hình', sub: 'Ảnh toàn cảnh', group: 'Khởi tạo'));

  // Mục 3 — rẽ nhánh theo loại khóa
  if (lock == 'SJ') {
    t.add(Task(code: '03-Sensor', name: 'Sensor', sub: 'Mỗi khoang 2 ảnh (trái/phải) — ${n * 2} ảnh', positions: _khoangSide(n), side: true, group: 'Mục 3 · Khóa SJ'));
    t.add(Task(code: '03-Oc', name: 'Ốc', sub: 'Mỗi khoang 2 ảnh (trái/phải) — ${n * 2} ảnh', positions: _khoangSide(n), side: true, group: 'Mục 3 · Khóa SJ'));
    t.add(Task(code: '03-JumpCan', name: 'Jump Can', sub: 'Mỗi khoang 1 ảnh — $n ảnh', positions: _khoangOnly(n), group: 'Mục 3 · Khóa SJ'));
    t.add(Task(code: '03-DayThit', name: 'Dây thít', sub: 'Mỗi khoang 1 ảnh — $n ảnh', positions: _khoangOnly(n), group: 'Mục 3 · Khóa SJ'));
  } else {
    t.add(Task(code: '03-VideoSensor', name: 'Video test cảm biến', sub: 'Chưa lắp ốc, đảm bảo chắc chắn', media: Media.video, group: 'Mục 3 · Khóa SK'));
    t.add(Task(code: '03-Khoa', name: '6 khóa sau rework', sub: 'Đã lắp hết ốc, ốc không bị đè — ${n * 2} ảnh (trái/phải)', positions: _khoangSide(n), side: true, group: 'Mục 3 · Khóa SK'));
  }

  t.add(Task(code: '04-Rubber', name: 'Rubber đã tháo', sub: 'Ảnh tổng quan cả 6 slot đã tháo', group: 'Kiểm tra'));
  t.add(Task(code: '05-Format', name: 'Đã format thẻ nhớ', group: 'Kiểm tra'));
  t.add(Task(code: '06-FWCam', name: 'Update FW Camera thành công', group: 'Kiểm tra'));
  t.add(Task(code: '07-NgayCam', name: 'Ngày mới nhất + camera về khoang pin', sub: 'Ảnh hoặc video', media: Media.either, group: 'Kiểm tra'));
  t.add(Task(code: '08-JumpCan60', name: 'Đo Jump Can 60 Ohm', group: 'Đo đạc'));
  t.add(Task(code: '09-CableModule', name: 'Đo thông mạch DC+ / DC-', sub: 'Module → terminal BCC', media: Media.video, group: 'Đo đạc'));
  t.add(Task(code: '10-CLRework', name: 'Checklist Rework', sub: 'Có thể nhiều ảnh nếu dài', multi: true, group: 'Hồ sơ'));
  t.add(Task(code: '11-6Pin', name: 'Mặt tủ lắp đủ 6 pin', group: 'Lắp đặt'));
  t.add(Task(code: '12-NapCam', name: 'Lắp đặt nắp Camera', group: 'Lắp đặt'));
  t.add(Task(code: '13-JackTerminal', name: 'Cắm chặt jack trên terminal', media: Media.video, group: 'Lắp đặt'));
  t.add(Task(code: '14-Gioang', name: 'Gioăng cao su không lệch', group: 'Lắp đặt'));
  t.add(Task(code: '15-CamNhaPin', name: 'Cắm nhả Pin 6 slot', media: Media.video, allowNa: true, note: 'Nếu tủ chưa lắp pin → tích "không áp dụng" và ghi chú', group: 'Lắp đặt'));
  t.add(Task(code: '16-CLFAC', name: 'Checklist FAC', group: 'Hồ sơ'));

  return t;
}
