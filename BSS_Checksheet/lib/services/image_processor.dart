import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

/// Vẽ watermark bằng dart:ui (hỗ trợ đầy đủ tiếng Việt), rồi mã hoá JPEG
/// ở luồng nền để không làm đứng giao diện.
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
    // 1) Vẽ watermark + lấy pixel thô (RGBA) — chạy trên luồng chính (bắt buộc với dart:ui).
    final raw = await _composite(srcBytes, watermarkLines);

    // 2) Mã hoá JPEG ở luồng nền (không decode PNG nữa nên nhanh hơn nhiều).
    final jpg = await compute(_encodeJpg, raw);

    final out = File(savePath);
    await out.writeAsBytes(jpg);
    return out;
  }

  static Future<({Uint8List bytes, int width, int height})> _composite(
      Uint8List srcBytes, List<String> lines) async {
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
    final bd = await outImg.toByteData(format: ui.ImageByteFormat.rawRgba);
    return (bytes: bd!.buffer.asUint8List(), width: image.width, height: image.height);
  }
}

/// Hàm chạy ở luồng nền: dựng ảnh từ pixel thô RGBA rồi mã hoá JPEG.
Uint8List _encodeJpg(({Uint8List bytes, int width, int height}) r) {
  final im = img.Image.fromBytes(
    width: r.width,
    height: r.height,
    bytes: r.bytes.buffer,
    numChannels: 4,
    order: img.ChannelOrder.rgba,
  );
  return img.encodeJpg(im, quality: 85);
}
