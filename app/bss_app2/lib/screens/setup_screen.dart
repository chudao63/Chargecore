import 'package:flutter/material.dart';
import '../models/session.dart';
import '../services/location_service.dart';
import '../theme.dart';
import 'checklist_screen.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});
  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _sn = TextEditingController();
  final _tech = TextEditingController();
  final app = AppState.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BSS Checksheet', style: TextStyle(fontWeight: FontWeight.w700))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _label('Mã Trạm và SN tủ BSS'),
            TextField(controller: _sn, decoration: _dec('VD: Mã Trạm - SN tủ')),
            _label('Tên kỹ thuật viên'),
            TextField(controller: _tech, decoration: _dec('VD: Nguyễn Văn A')),
            _label('Loại tủ'),
            _seg(['BSS-6', 'BSS-12'], app.cab, (v) => setState(() => app.cab = v)),
            _label('Loại khóa'),
            _seg(['SJ', 'SK'], app.lock, (v) => setState(() => app.lock = v)),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () {
                app.flow = 'bss';
                app.sn = _sn.text.trim().isEmpty ? '—' : _sn.text.trim();
                app.tech = _tech.text.trim().isEmpty ? '—' : _tech.text.trim();
                app.startTicket();
                LocationService.refresh(); // lấy GPS nền
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ChecklistScreen()));
              },
              child: const Text('Bắt đầu →'),
            ),
            const SizedBox(height: 16),
            const Text('Ảnh mẫu được nhúng sẵn trong app (assets/refs).',
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
                        fontWeight: FontWeight.w600,
                        color: cur == o ? AppColors.accentDark : AppColors.ink)),
              ),
            ),
          ),
          if (o != opts.last) const SizedBox(width: 8),
        ]
      ],
    );
  }
}
