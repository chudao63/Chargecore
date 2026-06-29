import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class StorageService {
  /// Thư mục lưu ảnh/video của một ticket: <appDocs>/BSS/<ticketId>/
  static Future<Directory> ticketDir(String ticketId) async {
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory(p.join(base.path, 'BSS', ticketId));
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }
}
