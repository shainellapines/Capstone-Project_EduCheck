import 'package:flutter/material.dart';

/// Colors from the EduCheck design system (light theme), the same values
/// the web app uses in frontend/src/App.css. Screens use these names,
/// never raw Color(0x...) values, so mobile and web stay in step.
class AppTheme {
  // Primary: one deep green-teal. `primary` is the action fill and link
  // color (ec-action / ec-primary-600); `primaryTint` is the selected or
  // highlighted background (ec-primary-50).
  static const Color primary = Color(0xFF14545E);
  static const Color primaryHover = Color(0xFF0E404A);
  static const Color primaryTint = Color(0xFFEEF5F5);
  static const Color primarySoft = Color(0xFFD6E7E8);
  static const Color primaryMark = Color(0xFF478C94);

  // Surfaces: warm paper, never pure white or cool grey.
  static const Color background = Color(0xFFF6F3EC);
  static const Color surface = Color(0xFFFCFAF6);
  static const Color surfaceSunken = Color(0xFFEFEBE2);

  // Text and lines.
  static const Color textDark = Color(0xFF1F1D1A);
  static const Color textGray = Color(0xFF5C574D);
  static const Color border = Color(0xFFDDD7CA);
  static const Color borderStrong = Color(0xFF8A8375);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // Status colors: for status only (badges, status tiles, banners).
  static const Color neutral = Color(0xFF565147);
  static const Color neutralBg = Color(0xFFEBE7DE);
  static const Color info = Color(0xFF1B4D8C);
  static const Color infoBg = Color(0xFFE4EDF8);
  static const Color infoSolid = Color(0xFF1F5AA6);
  static const Color revision = Color(0xFF6A5000);
  static const Color revisionBg = Color(0xFFFBF1B4);
  static const Color danger = Color(0xFF99231A);
  static const Color dangerBg = Color(0xFFFBE4E0);
  static const Color dangerBorder = Color(0xFFE9B0A8);
  static const Color success = Color(0xFF1C6638);
  static const Color successBg = Color(0xFFE3EFE5);
  static const Color warning = Color(0xFF8A4500);
  static const Color warningBg = Color(0xFFFDE3C6);
  static const Color onStatusSolid = Color(0xFFFFFFFF);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        onPrimary: onPrimary,
        surface: surface,
        onSurface: textDark,
        error: danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primary,
        foregroundColor: onPrimary,
        elevation: 0,
      ),
      dividerColor: border,
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: primary, linearTrackColor: surfaceSunken),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
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
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
      ),
    );
  }
}
