import 'package:flutter/material.dart';

class AppColors {
  static const bg = Color(0xFFF1EFE8);
  static const surface = Color(0xFFFFFFFF);
  static const ink = Color(0xFF16181C);
  static const muted = Color(0xFF73726C);
  static const accent = Color(0xFFE0571F);
  static const accentDark = Color(0xFFB6440F);
  static const ok = Color(0xFF1F9D63);
  static const okBg = Color(0xFFE6F4EC);
  static const border = Color(0xFFE0DDD2);
  static const borderDark = Color(0xFFCBC8BC);
  static const info = Color(0xFF185FA5);
  static const infoBg = Color(0xFFE6F1FB);
  static const warn = Color(0xFF9A6A00);
  static const warnBg = Color(0xFFFBEED4);
}

ThemeData buildTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.accent,
      primary: AppColors.accent,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.ink,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(54),
        textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
  );
}
