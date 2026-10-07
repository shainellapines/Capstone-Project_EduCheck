import 'package:flutter/material.dart';

import '../shared/analytics_screen.dart';
import '../shared/overview_home.dart';
import '../shared/profile_screen.dart';
import '../shared/repository_screen.dart';
import '../shared/role_shell.dart';
import '../shared/student_list_screen.dart';

/// Class Adviser on mobile (SPMP §6.5): an on-the-go view of every
/// subject's status for their own section (M-03), submit for approval or
/// return a subject to its teacher, SF10 preview (M-05), section analytics
/// and repository lookup. Uploads stay on the web.
class AdviserDashboardScreen extends StatelessWidget {
  const AdviserDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RoleShell(
      subtitle: 'Class Adviser',
      tabs: [
        ShellTab(
          label: 'Home',
          icon: Icons.home_rounded,
          builder: (context, goTo) => OverviewHome(goTo: goTo, recordsTab: 1, analyticsTab: 2),
        ),
        ShellTab(label: 'Records', icon: Icons.description_outlined, builder: (context, goTo) => const StudentListScreen()),
        ShellTab(label: 'Analytics', icon: Icons.insights_rounded, builder: (context, goTo) => const AnalyticsScreen()),
        ShellTab(label: 'Repository', icon: Icons.manage_search_rounded, builder: (context, goTo) => const RepositoryScreen()),
        ShellTab(label: 'Account', icon: Icons.person_outline_rounded, builder: (context, goTo) => const ProfileScreen()),
      ],
    );
  }
}
