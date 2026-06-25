import 'package:flutter/services.dart';

/// Phân giải ảnh mẫu nhúng trong assets/refs/.
///
/// Quy ước đặt tên (đặt file vào assets/refs/):
///   - Theo hạng mục:        <code>.jpg          vd  03-Sensor.jpg
///   - Theo vị trí cụ thể:   <code>__<posSlug>.jpg  vd  03-Sensor__khoang1-trai.jpg
/// Hỗ trợ đuôi .jpg / .jpeg / .png. Ảnh theo vị trí được ưu tiên trước.
class ReferenceService {
  static const _exts = ['jpg', 'jpeg', 'png'];

  static Future<String?> resolve(String code, String? posSlug) async {
    final candidates = <String>[];
    if (posSlug != null) {
      for (final e in _exts) {
        candidates.add('assets/refs/${code}__$posSlug.$e');
      }
    }
    for (final e in _exts) {
      candidates.add('assets/refs/$code.$e');
    }
    for (final c in candidates) {
      if (await _exists(c)) return c;
    }
    return null;
  }

  static Future<bool> _exists(String asset) async {
    try {
      await rootBundle.load(asset);
      return true;
    } catch (_) {
      return false;
    }
  }
}
