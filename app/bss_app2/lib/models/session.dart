import 'package:flutter/foundation.dart';
import 'checksheet.dart';

class Shot {
  final String filename;
  final String path; // đường dẫn file trên máy
  final bool isVideo;
  final String? posSlug; // vị trí (nếu có), vd "khoang6-trai"
  final DateTime when;

  Shot({required this.filename, required this.path, required this.isVideo, this.posSlug, required this.when});

  Map<String, dynamic> toJson() => {
        'filename': filename,
        'path': path,
        'isVideo': isVideo,
        'posSlug': posSlug,
        'when': when.toIso8601String(),
      };

  factory Shot.fromJson(Map<String, dynamic> j) => Shot(
        filename: j['filename'],
        path: j['path'],
        isVideo: j['isVideo'] ?? false,
        posSlug: j['posSlug'],
        when: DateTime.parse(j['when']),
      );
}

class NaInfo {
  final String note;
  const NaInfo(this.note);
}

/// Trạng thái phiên làm việc hiện tại (singleton đơn giản).
class AppState extends ChangeNotifier {
  static final AppState instance = AppState._();
  AppState._();

  String flow = 'bss'; // 'bss' | 'charger'
  String sn = '';
  String tech = '';
  // BSS
  String cab = 'BSS-6';
  String lock = 'SJ';
  // Trụ sạc
  String chargerType = 'DC'; // 'AC' | 'DC'
  String ticketCode = '';
  String ticketNote = ''; // ghi chú chung cho cả ticket

  String ticketId = '';
  List<Task> tasks = [];

  final Map<String, List<Shot>> shots = {}; // key = task.code
  final Map<String, NaInfo> na = {};
  final Map<String, String> itemNotes = {}; // ghi chú bước theo task.code

  String get cabCode => cab == 'BSS-12' ? 'BSS12' : 'BSS6';
  int get khoangCount => cab == 'BSS-12' ? 12 : 6;

  String get filePrefix => flow == 'charger' ? 'TS-$chargerType' : cabCode;

  String get titleMain => flow == 'charger' ? 'Trụ sạc $chargerType' : '$cab · Khóa $lock';
  String get titleSub {
    final base = 'SN $sn · KTV $tech';
    if (flow == 'charger' && ticketCode.isNotEmpty) return '$base · #$ticketCode';
    return base;
  }

  void setItemNote(String code, String v) {
    final t = v.trim();
    if (t.isEmpty) {
      itemNotes.remove(code);
    } else {
      itemNotes[code] = t;
    }
    notifyListeners();
  }

  void startTicket() {
    final now = DateTime.now();
    final s = '${now.year}${_2(now.month)}${_2(now.day)}-${_2(now.hour)}${_2(now.minute)}${_2(now.second)}';
    ticketId = '${filePrefix}_${sn.isEmpty ? 'noSN' : sn}_$s';
    tasks = flow == 'charger'
        ? buildChargerTasks(chargerType)
        : buildTasks(cab: cab, lock: lock);
    shots.clear();
    na.clear();
    itemNotes.clear();
    notifyListeners();
  }

  List<Shot> shotsOf(Task t) => shots[t.code] ?? const [];

  int doneCount(Task t) {
    if (t.allowNa && na.containsKey(t.code)) return t.required;
    final arr = shotsOf(t);
    if (t.positions != null) {
      return arr.map((s) => s.posSlug).whereType<String>().toSet().length;
    }
    return arr.length;
  }

  bool isDone(Task t) => doneCount(t) >= t.required;

  void addShot(Task t, Shot shot) {
    final list = shots.putIfAbsent(t.code, () => []);
    // với hạng mục theo vị trí và không cho nhiều ảnh: thay thế ảnh cùng vị trí
    if (t.positions != null && !t.multi && shot.posSlug != null) {
      list.removeWhere((s) => s.posSlug == shot.posSlug);
    }
    list.add(shot);
    notifyListeners();
  }

  void removeShot(Task t, Shot shot) {
    shots[t.code]?.remove(shot);
    notifyListeners();
  }

  void setNa(Task t, String? note) {
    if (note == null) {
      na.remove(t.code);
    } else {
      na[t.code] = NaInfo(note);
    }
    notifyListeners();
  }

  int get totalDone => tasks.where(isDone).length;
  double get progress => tasks.isEmpty ? 0 : totalDone / tasks.length;

  static String _2(int n) => n.toString().padLeft(2, '0');
}
