import 'package:flutter/material.dart';

import '../shared/analytics_screen.dart';
import '../shared/overview_home.dart';
import '../shared/profile_screen.dart';
import '../shared/repository_screen.dart';
import '../shared/role_shell.dart';
import '../shared/student_list_screen.dart';

/// Principal on mobile: school-wide, view-only (SPMP §6.2) - submission
/// progress, analytics snapshot and repository. Approving and returning
/// records is the School Administrator's action, matching the web app and
/// the backend.
class PrincipalDashboardScreen extends StatelessWidget {
  const PrincipalDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RoleShell(
      subtitle: 'Principal',
      tabs: [
        ShellTab(
          label: 'Home',
          icon: Icons.home_rounded,
          builder: (context, goTo) => OverviewHome(goTo: goTo, recordsTab: 1, analyticsTab: 2),
        ),
        ShellTab(label: 'Submissions', icon: Icons.fact_check_outlined, builder: (context, goTo) => const StudentListScreen()),
        ShellTab(label: 'Analytics', icon: Icons.insights_rounded, builder: (context, goTo) => const AnalyticsScreen()),
        ShellTab(label: 'Repository', icon: Icons.manage_search_rounded, builder: (context, goTo) => const RepositoryScreen()),
        ShellTab(label: 'Account', icon: Icons.person_outline_rounded, builder: (context, goTo) => const ProfileScreen()),
      ],
    );
  }
}
