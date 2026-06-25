import 'package:flutter/material.dart';
import '../models/session.dart';
import '../services/location_service.dart';
import '../theme.dart';
import 'checklist_screen.dart';

class ChargerSetupScreen extends StatefulWidget {
  const ChargerSetupScreen({super.key});
  @override
  State<ChargerSetupScreen> createState() => _ChargerSetupScreenState();
}

class _ChargerSetupScreenState extends State<ChargerSetupScreen> {
  final _sn = TextEditingController();
  final _tech = TextEditingController();
  final _code = TextEditingController();
  final _note = TextEditingController();
  final app = AppState.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trụ sạc — tạo phiên', style: TextStyle(fontWeight: FontWeight.w700))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _label('SN trụ sạc'),
            TextField(controller: _sn, decoration: _dec('VD: TS-0001')),
            _label('Loại trụ'),
            _seg(['AC', 'DC'], app.chargerType, (v) => setState(() => app.chargerType = v)),
            _label('Tên kỹ thuật viên'),
            TextField(controller: _tech, decoration: _dec('VD: Nguyễn Văn A')),
            _label('Mã ticket (tuỳ chọn)'),
            TextField(controller: _code, decoration: _dec('VD: SC-12345')),
            _label('Ghi chú chung (tuỳ chọn)'),
            TextField(controller: _note, minLines: 2, maxLines: 4, decoration: _dec('Mô tả ngắn sự cố / các bước...')),
            const SizedBox(height: 26),
            FilledButton(
              onPressed: () {
                app.flow = 'charger';
                app.sn = _sn.text.trim().isEmpty ? '—' : _sn.text.trim();
                app.tech = _tech.text.trim().isEmpty ? '—' : _tech.text.trim();
                app.ticketCode = _code.text.trim();
                app.ticketNote = _note.text.trim();
                app.startTicket();
                LocationService.refresh();
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ChecklistScreen()));
              },
              child: const Text('Bắt đầu →'),
            ),
            const SizedBox(height: 16),
            const Text('Ảnh sẽ tự lưu vào bộ sưu tập kèm watermark (SN, giờ, GPS/địa danh, ghi chú).',
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _label(String s) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 7),
        child: Text(s.toUpperCase(),
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.muted, letterSpacing: .4)),
      );

  InputDecoration _dec(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: AppColors.surface,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.borderDark, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
        ),
      );

  Widget _seg(List<String> opts, String cur, ValueChanged<String> onTap) {
    return Row(
      children: [
        for (final o in opts) ...[
          Expanded(
            child: GestureDetector(
              onTap: () => onTap(o),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 13),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: cur == o ? const Color(0xFFFDEEE6) : AppColors.surface,
                  border: Border.all(color: cur == o ? AppColors.accent : AppColors.borderDark, width: 1.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(o,
                    style: TextStyle(
                        fontWeight: FontWeight.w600, color: cur == o ? AppColors.accentDark : AppColors.ink)),
              ),
            ),
          ),
          if (o != opts.last) const SizedBox(width: 8),
        ]
      ],
    );
  }
}
