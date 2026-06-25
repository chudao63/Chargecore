import 'package:flutter/material.dart';
import '../models/session.dart';
import '../theme.dart';
import 'setup_screen.dart';
import 'charger_setup_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppState.instance;
    return Scaffold(
      appBar: AppBar(title: const Text('Chọn luồng công việc', style: TextStyle(fontWeight: FontWeight.w700))),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 8),
            _card(
              context,
              icon: Icons.dns_outlined,
              title: 'BSS Checksheet',
              desc: 'Chụp ảnh kiểm tra tủ BSS theo checklist',
              onTap: () {
                app.flow = 'bss';
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SetupScreen()));
              },
            ),
            const SizedBox(height: 14),
            _card(
              context,
              icon: Icons.ev_station_outlined,
              title: 'Xử lý sự cố trụ sạc',
              desc: 'Chụp ảnh trước / trong / sau khi xử lý sự cố',
              onTap: () {
                app.flow = 'charger';
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ChargerSetupScreen()));
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _card(BuildContext context,
      {required IconData icon, required String title, required String desc, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: const Color(0xFFFDEEE6), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: AppColors.accent, size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 3),
                  Text(desc, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.muted),
          ],
        ),
      ),
    );
  }
}
