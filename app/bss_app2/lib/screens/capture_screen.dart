import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:gal/gal.dart';
import 'package:path/path.dart' as p;

import '../models/checksheet.dart';
import '../models/session.dart';
import '../services/image_processor.dart';
import '../services/location_service.dart';
import '../services/reference_service.dart';
import '../services/storage_service.dart';
import '../services/video_processor.dart';
import '../theme.dart';

class CaptureScreen extends StatefulWidget {
  final Task task;
  const CaptureScreen({super.key, required this.task});
  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  final app = AppState.instance;
  final _picker = ImagePicker();

  int? _khoang;
  String _side = 'trai';
  String? _refAsset;
  bool _busy = false;

  final _naNote = TextEditingController();
  final _stepNote = TextEditingController();

  Task get t => widget.task;

  @override
  void initState() {
    super.initState();
    if (t.allowNa && app.na.containsKey(t.code)) {
      _naNote.text = app.na[t.code]!.note;
    }
    _stepNote.text = app.itemNotes[t.code] ?? '';
    _resolveRef();
  }

  String? get _posSlug {
    if (t.positions == null || _khoang == null) return null;
    return t.side ? 'khoang$_khoang-$_side' : 'khoang$_khoang';
  }

  Future<void> _resolveRef() async {
    final r = await ReferenceService.resolve(t.code, _posSlug);
    if (mounted) setState(() => _refAsset = r);
  }

  @override
  Widget build(BuildContext context) {
    final naOn = t.allowNa && app.na.containsKey(t.code);
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(t.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text('${t.code} · ${t.sub.isEmpty ? (t.media == Media.video ? '1 video' : '1 ảnh') : t.sub}',
                style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _refBox(),
          if (t.positions != null) ...[
            _posHeader('Chọn khoang'),
            _khoangGrid(),
            if (t.side) ...[
              _posHeader('Chọn bên'),
              _sideSeg(),
            ],
          ],
          if (t.note.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(top: 14),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.infoBg,
                border: Border.all(color: const Color(0xFFCFE1F5)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(t.note, style: const TextStyle(fontSize: 13, color: Color(0xFF0D3F6E))),
            ),
          if (t.allowNa) ...[
            const SizedBox(height: 14),
            Row(children: [
              Checkbox(
                value: naOn,
                onChanged: (v) {
                  setState(() => app.setNa(t, v == true ? _naNote.text : null));
                },
              ),
              const Expanded(child: Text('Mục này không áp dụng (ghi chú lý do)')),
            ]),
            if (naOn)
              TextField(
                controller: _naNote,
                decoration: const InputDecoration(hintText: 'VD: tủ chưa lắp pin', border: OutlineInputBorder()),
                onChanged: (v) => app.setNa(t, v),
              ),
          ],
          if (app.flow == 'charger') ...[
            const SizedBox(height: 16),
            Text('GHI CHÚ BƯỚC (hiện trên ảnh)',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.muted, letterSpacing: .4)),
            const SizedBox(height: 7),
            TextField(
              controller: _stepNote,
              minLines: 1,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'VD: Thay module nguồn DC', border: OutlineInputBorder()),
              onChanged: (v) => app.setItemNote(t.code, v),
            ),
          ],
          const SizedBox(height: 18),
          _shots(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: _captureButtons(),
        ),
      ),
    );
  }

  Widget _captureButtons() {
    if (_busy) {
      return const FilledButton(onPressed: null, child: Text('Đang xử lý…'));
    }
    if (t.media == Media.either) {
      return Row(children: [
        Expanded(child: FilledButton(onPressed: () => _capture(false), child: const Text('Chụp ảnh'))),
        const SizedBox(width: 10),
        Expanded(child: FilledButton(onPressed: () => _capture(true), child: const Text('Quay video'))),
      ]);
    }
    final isVideo = t.media == Media.video;
    return FilledButton(
      onPressed: () => _capture(isVideo),
      child: Text(isVideo ? 'Quay video' : 'Chụp ảnh'),
    );
  }

  Widget _refBox() {
    final hasImage = _refAsset != null;
    return GestureDetector(
      onTap: hasImage ? () => _openRefViewer(_refAsset!) : null,
      child: Container(
      height: 200,
      decoration: BoxDecoration(color: const Color(0xFF5F6469), borderRadius: BorderRadius.circular(12)),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_refAsset != null)
            Image.asset(_refAsset!, fit: BoxFit.contain)
          else
            Center(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Text('Chưa gắn ảnh mẫu cho "${t.name}".\nThả ảnh vào assets/refs/${t.code}.jpg',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
              ),
            ),
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(5)),
              child: const Text('ẢNH MẪU',
                  style: TextStyle(color: Colors.white, fontSize: 10, letterSpacing: .6, fontWeight: FontWeight.w600)),
            ),
          ),
          if (hasImage)
            Positioned(
              bottom: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.zoom_in, color: Colors.white, size: 15),
                  SizedBox(width: 4),
                  Text('Bấm để phóng to', style: TextStyle(color: Colors.white, fontSize: 11)),
                ]),
              ),
            ),
        ],
      ),
      ),
    );
  }

  void _openRefViewer(String asset) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, __, ___) => _RefViewer(asset: asset),
      ),
    );
  }

  Widget _posHeader(String s) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 8),
        child: Text(s.toUpperCase(),
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.muted, letterSpacing: .4)),
      );

  Widget _khoangGrid() {
    final n = app.khoangCount;
    final filled = app.shotsOf(t).map((s) => s.posSlug).whereType<String>().toSet();
    return GridView.count(
      crossAxisCount: 6,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 7,
      crossAxisSpacing: 7,
      childAspectRatio: 1.3,
      children: [
        for (var k = 1; k <= n; k++) _khoangBtn(k, filled),
      ],
    );
  }

  Widget _khoangBtn(int k, Set<String> filled) {
    final selected = _khoang == k;
    bool full, some = false;
    if (t.side) {
      full = filled.contains('khoang$k-trai') && filled.contains('khoang$k-phai');
      some = filled.contains('khoang$k-trai') || filled.contains('khoang$k-phai');
    } else {
      full = filled.contains('khoang$k');
    }
    Color bg = AppColors.surface, bd = AppColors.borderDark, fg = AppColors.ink;
    if (full) {
      bg = AppColors.okBg;
      bd = AppColors.ok;
      fg = AppColors.ok;
    }
    if (selected) {
      bg = const Color(0xFFFDEEE6);
      bd = AppColors.accent;
      fg = AppColors.accentDark;
    }
    return GestureDetector(
      onTap: () {
        setState(() => _khoang = k);
        _resolveRef();
      },
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(color: bg, border: Border.all(color: bd, width: 1.5), borderRadius: BorderRadius.circular(8)),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text('$k', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: fg)),
            if (some && !full && !selected)
              const Positioned(top: 2, right: 5, child: Text('•', style: TextStyle(color: AppColors.warn, fontSize: 12))),
          ],
        ),
      ),
    );
  }

  Widget _sideSeg() {
    Widget btn(String v, String label) {
      final on = _side == v;
      return Expanded(
        child: GestureDetector(
          onTap: () {
            setState(() => _side = v);
            _resolveRef();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: on ? const Color(0xFFFDEEE6) : AppColors.surface,
              border: Border.all(color: on ? AppColors.accent : AppColors.borderDark, width: 1.5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: on ? AppColors.accentDark : AppColors.ink)),
          ),
        ),
      );
    }

    return Row(children: [btn('trai', 'Trái'), const SizedBox(width: 8), btn('phai', 'Phải')]);
  }

  Widget _shots() {
    final arr = app.shotsOf(t);
    if (arr.isEmpty) return const SizedBox.shrink();
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: .78,
      children: [
        for (final s in arr)
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(8),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (s.isVideo)
                        Container(color: const Color(0xFFDFE6EF), child: const Icon(Icons.play_arrow, color: AppColors.info, size: 30))
                      else
                        Image.file(File(s.path), fit: BoxFit.cover),
                      Positioned(
                        top: 3,
                        right: 3,
                        child: GestureDetector(
                          onTap: () => setState(() => app.removeShot(t, s)),
                          child: Container(
                            width: 22,
                            height: 22,
                            alignment: Alignment.center,
                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                            child: const Icon(Icons.close, color: Colors.white, size: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(4),
                  child: Text(s.filename, style: const TextStyle(fontSize: 8.5, color: AppColors.muted), maxLines: 3, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Future<void> _capture(bool video) async {
    if (t.positions != null && _khoang == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Hãy chọn khoang trước khi chụp.')));
      return;
    }
    setState(() => _busy = true);
    try {
      final now = DateTime.now();
      final dir = await StorageService.ticketDir(app.ticketId);
      final slug = _posSlug;
      final stamp = _stamp(now);
      String? destPath;
      bool isVid = false;

      if (video) {
        final XFile? x = await _picker.pickVideo(source: ImageSource.camera);
        if (x == null) return;
        final fn = [app.filePrefix, t.code, slug, stamp].whereType<String>().join('_') + '.mp4';
        final dest = p.join(dir.path, fn);

        final posLabel = slug == null
            ? null
            : (t.side ? 'Khoang $_khoang · ${_side == 'trai' ? 'Trái' : 'Phải'}' : 'Khoang $_khoang');
        final stepNote = app.itemNotes[t.code] ?? '';
        final lines = <String>[
          'SN: ${app.sn}  |  ${t.name}',
          if (posLabel != null) posLabel,
          '${_human(now)}  |  KTV: ${app.tech}',
          if (stepNote.isNotEmpty) 'Ghi chú: $stepNote',
          if (app.ticketNote.isNotEmpty) 'GC chung: ${app.ticketNote}',
          if (LocationService.address.isNotEmpty) LocationService.address,
          'GPS: ${LocationService.label}',
        ];

        await VideoProcessor.processVideo(
          srcPath: x.path,
          savePath: dest,
          watermarkLines: lines,
        );

        app.addShot(t, Shot(filename: fn, path: dest, isVideo: true, posSlug: slug, when: now));
        destPath = dest;
        isVid = true;
      } else {
        final XFile? x = await _picker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1920,
          maxHeight: 1920,
          imageQuality: 88,
        );
        if (x == null) return;
        final bytes = await x.readAsBytes();
        final fn = [app.filePrefix, t.code, slug, stamp].whereType<String>().join('_') + '.jpg';
        final dest = p.join(dir.path, fn);

        final posLabel = slug == null
            ? null
            : (t.side ? 'Khoang $_khoang · ${_side == 'trai' ? 'Trái' : 'Phải'}' : 'Khoang $_khoang');
        final stepNote = app.itemNotes[t.code] ?? '';
        final lines = <String>[
          'SN: ${app.sn}  |  ${t.name}',
          if (posLabel != null) posLabel,
          '${_human(now)}  |  KTV: ${app.tech}',
          if (stepNote.isNotEmpty) 'Ghi chú: $stepNote',
          if (app.ticketNote.isNotEmpty) 'GC chung: ${app.ticketNote}',
          if (LocationService.address.isNotEmpty) LocationService.address,
          'GPS: ${LocationService.label}',
        ];
        final desc = 'SN=${app.sn}; ${t.code} ${t.name}; ${posLabel ?? ''}; KTV=${app.tech}; ${app.ticketId}';

        await ImageProcessor.processPhoto(
          srcBytes: bytes,
          savePath: dest,
          watermarkLines: lines,
          when: now,
          lat: LocationService.lat,
          lng: LocationService.lng,
          description: desc,
        );
        app.addShot(t, Shot(filename: fn, path: dest, isVideo: false, posSlug: slug, when: now));
        destPath = dest;
      }

      // Lưu thẳng vào bộ sưu tập điện thoại (album "BSS Checksheet")
      if (destPath != null) {
        try {
          await Gal.requestAccess(toAlbum: true);
          if (isVid) {
            await Gal.putVideo(destPath, album: 'BSS Checksheet');
          } else {
            await Gal.putImage(destPath, album: 'BSS Checksheet');
          }
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Đã lưu vào bộ sưu tập · album "BSS Checksheet"')),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Đã chụp nhưng chưa lưu được vào bộ sưu tập: $e')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
      _resolveRef();
    }
  }

  static String _stamp(DateTime d) =>
      '${d.year}${_2(d.month)}${_2(d.day)}-${_2(d.hour)}${_2(d.minute)}${_2(d.second)}';
  static String _human(DateTime d) =>
      '${_2(d.day)}/${_2(d.month)}/${d.year} ${_2(d.hour)}:${_2(d.minute)}:${_2(d.second)}';
  static String _2(int n) => n.toString().padLeft(2, '0');
}

/// Màn xem ảnh mẫu toàn màn hình: phóng to/thu nhỏ bằng hai ngón, bấm nền để đóng.
class _RefViewer extends StatelessWidget {
  final String asset;
  const _RefViewer({required this.asset});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: InteractiveViewer(
              minScale: 0.8,
              maxScale: 5,
              child: Center(child: Image.asset(asset, fit: BoxFit.contain)),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 12,
            child: IconButton(
              style: IconButton.styleFrom(backgroundColor: Colors.black54),
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ],
      ),
    );
  }
}
