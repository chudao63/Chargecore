import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

/// Vẽ watermark bằng dart:ui (TextPainter render đầy đủ tiếng Việt),
/// rồi encode JPEG. Mọi thông tin (SN, giờ, GPS, hạng mục, vị trí) được
/// in nhìn thấy ngay trên ảnh.
class ImageProcessor {
  static Future<File> processPhoto({
    required Uint8List srcBytes,
    required String savePath,
    required List<String> watermarkLines,
    required DateTime when,
    double? lat,
    double? lng,
    required String description,
  }) async {
    final pngBytes = await _composite(srcBytes, watermarkLines);

    // Re-encode sang JPEG để file nhẹ hơn.
    final decoded = img.decodePng(pngBytes);
    final out = File(savePath);
    if (decoded != null) {
      await out.writeAsBytes(img.encodeJpg(decoded, quality: 90));
    } else {
      await out.writeAsBytes(pngBytes); // fallback giữ PNG
    }
    return out;
  }

  static Future<Uint8List> _composite(Uint8List srcBytes, List<String> lines) async {
    final codec = await ui.instantiateImageCodec(srcBytes);
    final frame = await codec.getNextFrame();
    final image = frame.image;
    final w = image.width.toDouble();
    final h = image.height.toDouble();

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, w, h));
    canvas.drawImage(image, Offset.zero, Paint());

    final fontSize = (w * 0.026).clamp(15.0, 64.0);
    final lineHeight = fontSize * 1.34;
    final pad = fontSize * 0.7;
    final boxH = lines.length * lineHeight + pad * 2 - (lineHeight - fontSize);
    final boxTop = h - boxH;

    canvas.drawRect(Rect.fromLTWH(0, boxTop, w, boxH), Paint()..color = const Color(0x94000000));
    canvas.drawRect(Rect.fromLTWH(0, boxTop, fontSize * 0.35, boxH), Paint()..color = const Color(0xFFE0571F));

    var y = boxTop + pad;
    for (final ln in lines) {
      final tp = TextPainter(
        text: TextSpan(
          text: ln,
          style: TextStyle(color: Colors.white, fontSize: fontSize, fontWeight: FontWeight.w500),
        ),
        textDirection: TextDirection.ltr,
        maxLines: 1,
        ellipsis: '…',
      )..layout(maxWidth: w - pad * 2);
      tp.paint(canvas, Offset(pad, y));
      y += lineHeight;
    }

    final picture = recorder.endRecording();
    final outImg = await picture.toImage(image.width, image.height);
    final bd = await outImg.toByteData(format: ui.ImageByteFormat.png);
    return bd!.buffer.asUint8List();
  }
}
