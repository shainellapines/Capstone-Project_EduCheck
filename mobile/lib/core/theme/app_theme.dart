import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color lightBlue = Color(0xFFEAF2FF);
  static const Color background = Color(0xFFF7F9FC);
  static const Color textDark = Color(0xFF1E293B);
  static const Color textGray = Color(0xFF64748B);
  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD18A00);
  static const Color purple = Color(0xFF7C3AED);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: primaryBlue,
            width: 1.5,
          ),
        ),
      ),
    );
  }
}