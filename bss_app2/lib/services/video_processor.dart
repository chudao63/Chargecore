import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:ffmpeg_kit_flutter_min/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min/ffprobe_kit.dart';
import 'package:ffmpeg_kit_flutter_min/return_code.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class VideoProcessor {
  /// Gắn watermark vào video bằng cách vẽ thanh thông tin ở cuối frame.
  /// Cùng thiết kế với ImageProcessor (nền tối, vạch cam, chữ trắng).
  static Future<void> processVideo({
    required String srcPath,
    required String savePath,
    required List<String> watermarkLines,
  }) async {
    // 1. Lấy kích thước video để render PNG đúng width
    int videoWidth = 1920;
    try {
      final session = await FFprobeKit.getMediaInformation(srcPath);
      final streams = session.getMediaInformation()?.getStreams();
      for (final s in streams ?? []) {
        final props = s.getAllProperties();
        if (props?['codec_type'] == 'video') {
          videoWidth = (props?['width'] as int?) ?? 1920;
          break;
        }
      }
    } catch (_) {}

    // 2. Vẽ PNG thanh watermark trên main thread (dart:ui)
    final overlayBytes = await _renderOverlayPng(watermarkLines, videoWidth.toDouble());

    // 3. Lưu PNG tạm
    final tmpDir = await getTemporaryDirectory();
    final overlayPath = p.join(
      tmpDir.path,
      'bss_wm_${DateTime.now().millisecondsSinceEpoch}.png',
    );
    await File(overlayPath).writeAsBytes(overlayBytes);

    try {
      // 4. FFmpeg: chèn PNG ở cuối video, giữ nguyên audio
      final session = await FFmpegKit.execute(
        '-i "$srcPath" -i "$overlayPath" '
        '-filter_complex "[0:v][1:v]overlay=0:H-h" '
        '-codec:a copy -y "$savePath"',
      );
      final rc = await session.getReturnCode();
      if (!ReturnCode.isSuccess(rc)) {
        final log = await session.getOutput();
        throw Exception('FFmpeg lỗi khi gắn watermark: $log');
      }
    } finally {
      await File(overlayPath).delete().catchError((_) {});
    }
  }

  /// Vẽ thanh watermark trong suốt phía trên, nền tối + vạch cam + chữ trắng phía dưới.
  static Future<Uint8List> _renderOverlayPng(
      List<String> lines, double width) async {
    final fontSize = (width * 0.026).clamp(15.0, 64.0);
    final lineHeight = fontSize * 1.34;
    final pad = fontSize * 0.7;
    final barH = lines.length * lineHeight + pad * 2 - (lineHeight - fontSize);

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, width, barH));

    // Nền tối bán trong suốt
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, barH),
      Paint()..color = const Color(0x94000000),
    );
    // Vạch accent màu cam bên trái
    canvas.drawRect(
      Rect.fromLTWH(0, 0, fontSize * 0.35, barH),
      Paint()..color = const Color(0xFFE0571F),
    );

    var y = pad;
    for (final ln in lines) {
      final tp = TextPainter(
        text: TextSpan(
          text: ln,
          style: TextStyle(
            color: Colors.white,
            fontSize: fontSize,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
        maxLines: 1,
        ellipsis: '…',
      )..layout(maxWidth: width - pad * 2);
      tp.paint(canvas, Offset(pad, y));
      y += lineHeight;
    }

    final picture = recorder.endRecording();
    final image = await picture.toImage(width.toInt(), barH.toInt());
    final bd = await image.toByteData(format: ui.ImageByteFormat.png);
    return bd!.buffer.asUint8List();
  }
}
