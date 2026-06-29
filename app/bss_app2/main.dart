import 'package:flutter/material.dart';
import 'screens/setup_screen.dart';
import 'theme.dart';

void main() => runApp(const BssApp());

class BssApp extends StatelessWidget {
  const BssApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BSS Checksheet',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const SetupScreen(),
    );
  }
}
