import 'package:flutter/material.dart';

import '../shared/analytics_screen.dart';
import '../shared/notification_screen.dart';
import '../shared/overview_home.dart';
import '../shared/profile_screen.dart';
import '../shared/repository_screen.dart';
import '../shared/role_shell.dart';
import '../shared/student_list_screen.dart';

/// School Administrator on mobile (SPMP §6.5): approve or return submitted
/// records from anywhere (M-06), analytics snapshot (M-07) and repository
/// lookup (M-08). User, section and assignment management stay on the web.
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RoleShell(
      subtitle: 'Administrator',
      tabs: [
        ShellTab(
          label: 'Home',
          icon: Icons.home_rounded,
          builder: (context, goTo) => OverviewHome(goTo: goTo, recordsTab: 1, analyticsTab: 3),
        ),
        ShellTab(
          label: 'Approvals',
          icon: Icons.fact_check_outlined,
          builder: (context, goTo) => const StudentListScreen(initialStatus: 'Pending Approval'),
          opensFor: const {
            NotificationTitles.recordSubmitted,
            NotificationTitles.recordsSubmitted,
            NotificationTitles.amendmentNeeded,
          },
        ),
        ShellTab(label: 'Repository', icon: Icons.manage_search_rounded, builder: (context, goTo) => const RepositoryScreen()),
        ShellTab(label: 'Analytics', icon: Icons.insights_rounded, builder: (context, goTo) => const AnalyticsScreen()),
        ShellTab(label: 'Account', icon: Icons.person_outline_rounded, builder: (context, goTo) => const ProfileScreen()),
      ],
    );
  }
}

