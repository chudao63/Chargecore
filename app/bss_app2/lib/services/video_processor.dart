import 'package:flutter/services.dart';

/// Gắn watermark vào video bằng Android Media3 Transformer (native).
/// Cùng thiết kế với ImageProcessor: nền tối, vạch cam, chữ trắng ở cuối frame.
class VideoProcessor {
  static const _channel = MethodChannel('com.bss.video_watermark');

  static Future<void> processVideo({
    required String srcPath,
    required String savePath,
    required List<String> watermarkLines,
  }) async {
    await _channel.invokeMethod<void>('processVideo', {
      'srcPath': srcPath,
      'destPath': savePath,
      'lines': watermarkLines,
    });
  }
}
