import 'package:flutter/material.dart';

import '../../core/notifications/notification_poller.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'notification_screen.dart';

class ShellTab {
  const ShellTab({required this.label, required this.icon, required this.builder, this.opensFor = const {}});

  final String label;
  final IconData icon;
  final Widget Function(BuildContext context, void Function(int index) goTo) builder;

  /// Notification titles (NotificationTitles) that open this tab when tapped.
  final Set<String> opensFor;
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

  /// Bumped when a notification opens a tab, so that tab rebuilds and
  /// reloads instead of showing the list it had before the alert.
  final Map<int, int> _generation = {};

  void _goTo(int index) => setState(() {
        _index = index;
        _built.add(index);
      });

  Future<void> _openNotifications() async {
    final openable = {for (final tab in widget.tabs) ...tab.opensFor};
    final title = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => NotificationScreen(openableTitles: openable)),
    );
    NotificationPoller.instance.refresh();
    if (title == null || !mounted) return;

    final target = widget.tabs.indexWhere((tab) => tab.opensFor.contains(title));
    if (target < 0) return;
    setState(() {
      _generation[target] = (_generation[target] ?? 0) + 1;
      _index = target;
      _built.add(target);
    });
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
                    _built.contains(i)
                        ? KeyedSubtree(
                            key: ValueKey('tab-$i-${_generation[i] ?? 0}'),
                            child: widget.tabs[i].builder(context, _goTo),
                          )
                        : const SizedBox.shrink(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _goTo,
        backgroundColor: AppTheme.surface,
        indicatorColor: AppTheme.primaryTint,
        height: 66,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          for (final tab in widget.tabs)
            NavigationDestination(
              icon: Icon(tab.icon, color: AppTheme.textGray),
              selectedIcon: Icon(tab.icon, color: AppTheme.primary),
              label: tab.label,
            ),
        ],
      ),
    );
  }
}
