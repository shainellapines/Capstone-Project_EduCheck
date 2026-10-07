import 'package:flutter/material.dart';

import 'core/api/api_client.dart';
import 'core/notifications/notification_poller.dart';
import 'core/session/session_store.dart';
import 'core/theme/app_theme.dart';
import 'screens/admin/admin_dashboard_screen.dart';
import 'screens/adviser/adviser_dashboard_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/principal/principal_dashboard_screen.dart';
import 'screens/subject/subject_dashboard_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// The dashboard for the signed-in role. The role comes from the backend
/// (JWT login response), never from a picker on the device.
Widget homeForRole(String? role) {
  switch (role) {
    case 'admin':
      return const AdminDashboardScreen();
    case 'principal':
      return const PrincipalDashboardScreen();
    case 'adviser':
      return const AdviserDashboardScreen();
    case 'subject':
      return const SubjectDashboardScreen();
    default:
      return const LoginScreen();
  }
}

/// Opens the signed-in user's dashboard and starts notification polling.
void enterApp(BuildContext context) {
  NotificationPoller.instance.start();
  Navigator.of(context).pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => homeForRole(SessionStore.instance.role)),
    (route) => false,
  );
}

class EduCheckApp extends StatefulWidget {
  const EduCheckApp({super.key});

  @override
  State<EduCheckApp> createState() => _EduCheckAppState();
}

class _EduCheckAppState extends State<EduCheckApp> {
  @override
  void initState() {
    super.initState();

    // Expired/revoked token on any request: back to login.
    ApiClient.instance.onUnauthorized = () {
      NotificationPoller.instance.stop();
      navigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen(sessionExpired: true)),
        (route) => false,
      );
    };

    if (SessionStore.instance.isLoggedIn) NotificationPoller.instance.start();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      title: 'EduCheck',
      theme: AppTheme.lightTheme,
      home: SessionStore.instance.isLoggedIn ? homeForRole(SessionStore.instance.role) : const LoginScreen(),
    );
  }
}
