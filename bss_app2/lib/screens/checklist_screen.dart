import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import '../models/checksheet.dart';
import '../models/session.dart';
import '../theme.dart';
import 'capture_screen.dart';

class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});
  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  final app = AppState.instance;

  @override
  Widget build(BuildContext context) {
    final pct = (app.progress * 100).round();
    String? lastGroup;
    final children = <Widget>[];
    for (var i = 0; i < app.tasks.length; i++) {
      final t = app.tasks[i];
      if (t.group != lastGroup) {
        children.add(Padding(
          padding: const EdgeInsets.fromLTRB(4, 18, 4, 6),
          child: Text(t.group.toUpperCase(),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: .6)),
        ));
        lastGroup = t.group;
      }
      children.add(_item(t, i));
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(app.titleMain, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            Text(app.titleSub, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(14),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: app.progress,
                minHeight: 8,
                backgroundColor: AppColors.border,
                valueColor: const AlwaysStoppedAnimation(AppColors.ok),
              ),
            ),
          ),
        ),
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(12, 0, 12, 100), children: children),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: FilledButton(
            onPressed: () => Gal.open(),
            child: Text('Hoàn thành $pct% · Mở bộ sưu tập'),
          ),
        ),
      ),
    );
  }

  Widget _item(Task t, int i) {
    final done = app.isDone(t);
    final dc = app.doneCount(t);
    final naOn = t.allowNa && app.na.containsKey(t.code);
    String badge;
    Color badgeFg, badgeBg;
    if (naOn) {
      badge = 'N/A';
      badgeFg = AppColors.ok;
      badgeBg = AppColors.okBg;
    } else if (dc == 0) {
      badge = '0/${t.required}';
      badgeFg = AppColors.muted;
      badgeBg = const Color(0xFFF3F1EA);
    } else if (dc < t.required) {
      badge = '$dc/${t.required}';
      badgeFg = AppColors.warn;
      badgeBg = AppColors.warnBg;
    } else {
      badge = '$dc/${t.required}';
      badgeFg = AppColors.ok;
      badgeBg = AppColors.okBg;
    }

    final tag = t.media == Media.video
        ? _tag('VIDEO', AppColors.info, AppColors.infoBg)
        : t.media == Media.either
            ? _tag('ẢNH/VIDEO', AppColors.info, AppColors.infoBg)
            : _tag('ẢNH', AppColors.muted, const Color(0xFFF3F1EA));

    return GestureDetector(
      onTap: () async {
        await Navigator.push(context, MaterialPageRoute(builder: (_) => CaptureScreen(task: t)));
        setState(() {});
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: done ? AppColors.okBg : const Color(0xFFF3F1EA),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Text(done ? '✓' : '${i + 1}',
                  style: TextStyle(fontWeight: FontWeight.w700, color: done ? AppColors.ok : AppColors.muted)),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Flexible(child: Text(t.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
                    const SizedBox(width: 6),
                    tag,
                  ]),
                  if (t.sub.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(t.sub, style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(99)),
              child: Text(badge, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: badgeFg)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tag(String s, Color fg, Color bg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(5)),
        child: Text(s, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
      );
}
