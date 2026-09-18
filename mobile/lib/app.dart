import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/adviser/adviser_dashboard_screen.dart';
import 'screens/adviser/review_queue_screen.dart';
import 'screens/subject/subject_dashboard_screen.dart';
import 'screens/admin/admin_dashboard_screen.dart';

class EduCheckApp extends StatelessWidget {
  const EduCheckApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'EduCheck',
      theme: AppTheme.lightTheme,
      home: const SubjectDashboardScreen(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/adviser-dashboard': (context) =>
            const AdviserDashboardScreen(),
        '/adviser-review-queue': (context) =>
            const ReviewQueueScreen(),
        '/subject-dashboard': (context) =>
            const SubjectDashboardScreen(),
        '/admin-dashboard': (context) =>
            const AdminDashboardScreen(),
      },
    );
  }
}