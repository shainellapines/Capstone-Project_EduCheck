import 'package:flutter/material.dart';

import '../../core/notifications/notification_poller.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'notification_screen.dart';

class ShellTab {
  const ShellTab({required this.label, required this.icon, required this.builder});

  final String label;
  final IconData icon;
  final Widget Function(BuildContext context, void Function(int index) goTo) builder;
}

/// Common frame for every role's dashboard: header with the live
/// notification bell, bottom navigation, and tabs kept alive between
/// switches so lists don't reload every time.
class RoleShell extends StatefulWidget {
  const RoleShell({super.key, required this.subtitle, required this.tabs});

  final String subtitle;
  final List<ShellTab> tabs;

  @override
  State<RoleShell> createState() => _RoleShellState();
}

class _RoleShellState extends State<RoleShell> {
  int _index = 0;
  final Set<int> _built = {0};

  void _goTo(int index) => setState(() {
        _index = index;
        _built.add(index);
      });

  Future<void> _openNotifications() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen()));
    NotificationPoller.instance.refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            DashboardHeader(title: 'EduCheck', subtitle: widget.subtitle, onBell: _openNotifications),
            Expanded(
              child: IndexedStack(
                index: _index,
                children: [
                  for (var i = 0; i < widget.tabs.length; i++)
                    _built.contains(i) ? widget.tabs[i].builder(context, _goTo) : const SizedBox.shrink(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _goTo,
        backgroundColor: Colors.white,
        indicatorColor: AppTheme.lightBlue,
        height: 66,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          for (final tab in widget.tabs)
            NavigationDestination(
              icon: Icon(tab.icon, color: AppTheme.textGray),
              selectedIcon: Icon(tab.icon, color: AppTheme.primaryBlue),
              label: tab.label,
            ),
        ],
      ),
    );
  }
}
