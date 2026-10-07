import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../notifications/notification_poller.dart';
import '../theme/app_theme.dart';

/// Shared building blocks so every screen looks and behaves the same:
/// card style, status colours, loading/error/offline states.

String formatDate(dynamic value, {bool withTime = false}) {
  if (value == null) return '-';
  final date = DateTime.tryParse(value.toString())?.toLocal();
  if (date == null) return value.toString();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final day = '${months[date.month - 1]} ${date.day}, ${date.year}';
  if (!withTime) return day;
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  final minute = date.minute.toString().padLeft(2, '0');
  return '$day, $hour:$minute ${date.hour < 12 ? 'AM' : 'PM'}';
}

String formatGrade(dynamic value) {
  if (value == null) return '-';
  final number = num.tryParse(value.toString());
  if (number == null) return value.toString();
  return number % 1 == 0 ? number.toInt().toString() : number.toStringAsFixed(2);
}

class StatusStyle {
  const StatusStyle(this.foreground, this.background, this.icon);

  final Color foreground;
  final Color background;
  final IconData icon;

  static StatusStyle of(String? status) {
    switch (status) {
      case 'Approved':
      case 'Validated':
      case 'Complete':
      case 'Passed':
        return const StatusStyle(AppTheme.success, Color(0xFFF0FDF4), Icons.check_circle_outline_rounded);
      case 'Pending Approval':
      case 'Uploaded':
        return const StatusStyle(AppTheme.primaryBlue, Color(0xFFEFF6FF), Icons.hourglass_top_rounded);
      case 'Needs Attention':
      case 'Partial':
        return const StatusStyle(AppTheme.warning, Color(0xFFFFF7ED), Icons.warning_amber_rounded);
      case 'Needs Revision':
      case 'Rejected':
      case 'Failed':
        return const StatusStyle(AppTheme.danger, Color(0xFFFEF2F2), Icons.error_outline_rounded);
      case 'Amendment Requested':
        return const StatusStyle(AppTheme.purple, Color(0xFFF5F3FF), Icons.edit_note_rounded);
      default:
        return const StatusStyle(AppTheme.textGray, Color(0xFFF1F5F9), Icons.radio_button_unchecked_rounded);
    }
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill(this.status, {super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final style = StatusStyle.of(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(color: style.background, borderRadius: BorderRadius.circular(20)),
      child: Text(
        status,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: style.foreground),
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16), this.borderColor});

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor ?? AppTheme.border),
          ),
          child: child,
        ),
      ),
    );
  }
}

class IconTile extends StatelessWidget {
  const IconTile({super.key, required this.icon, required this.color, required this.background, this.size = 42});

  final IconData icon;
  final Color color;
  final Color background;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(11)),
      child: Icon(icon, color: color, size: size * 0.52),
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.background,
    this.onTap,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final Color background;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          IconTile(icon: icon, color: color, background: background, size: 40),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textGray, height: 1.2),
                ),
                const SizedBox(height: 3),
                Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Two StatCards per row.
class StatGrid extends StatelessWidget {
  const StatGrid({super.key, required this.cards});

  final List<Widget> cards;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < cards.length; i += 2) {
      // IntrinsicHeight + stretch keeps both cards in a row the same height
      // when one title wraps to two lines.
      rows.add(IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: cards[i]),
            const SizedBox(width: 10),
            Expanded(child: i + 1 < cards.length ? cards[i + 1] : const SizedBox()),
          ],
        ),
      ));
      if (i + 2 < cards.length) rows.add(const SizedBox(height: 10));
    }
    return Column(children: rows);
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.action});

  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 22, bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textDark),
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      child: Column(
        children: [
          Icon(icon, size: 34, color: const Color(0xFF94A3B8)),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppTheme.textGray, height: 1.4),
          ),
        ],
      ),
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.cachedAt});

  final DateTime? cachedAt;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, size: 18, color: AppTheme.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Offline - showing data last synced ${formatDate(cachedAt?.toIso8601String(), withTime: true)}. '
              'Pull down to refresh when you are back online.',
              style: const TextStyle(fontSize: 11.5, color: Color(0xFF9A3412), height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

/// Loads data with [load], shows a spinner, an error with Retry, or the
/// content built by [builder]; pull-to-refresh re-runs [load]. When the
/// data came from the offline cache an "Offline" banner is shown on top.
class AsyncView<T> extends StatefulWidget {
  const AsyncView({super.key, required this.load, required this.builder, this.padding});

  final Future<ApiResult<T>> Function() load;
  final List<Widget> Function(BuildContext context, T data, Future<void> Function() reload) builder;
  final EdgeInsets? padding;

  @override
  State<AsyncView<T>> createState() => AsyncViewState<T>();
}

class AsyncViewState<T> extends State<AsyncView<T>> {
  ApiResult<T>? _result;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    reload();
  }

  Future<void> reload() async {
    setState(() {
      _loading = _result == null;
      _error = null;
    });
    try {
      final result = await widget.load();
      if (!mounted) return;
      setState(() {
        _result = result;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final children = <Widget>[];
    if (_error != null && _result == null) {
      children.add(_ErrorCard(message: _error!, onRetry: reload));
    } else if (_result != null) {
      if (_error != null) children.add(_ErrorCard(message: _error!, onRetry: reload));
      if (_result!.fromCache) children.add(OfflineBanner(cachedAt: _result!.cachedAt));
      children.addAll(widget.builder(context, _result!.data, reload));
    }

    return RefreshIndicator(
      onRefresh: reload,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: widget.padding ?? const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: children,
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppTheme.danger),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: const TextStyle(fontSize: 12.5, color: Color(0xFF991B1B), height: 1.35)),
          ),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

/// Top bar used by every role's home: title, subtitle and a bell with the
/// live unread count (NotificationPoller).
class DashboardHeader extends StatelessWidget {
  const DashboardHeader({super.key, required this.title, required this.subtitle, required this.onBell});

  final String title;
  final String subtitle;
  final VoidCallback onBell;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: AppTheme.primaryBlue, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.school_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textGray)),
              ],
            ),
          ),
          ValueListenableBuilder<int>(
            valueListenable: NotificationPoller.instance.unreadCount,
            builder: (context, unread, _) {
              return Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    IconButton(
                      tooltip: 'Notifications',
                      onPressed: onBell,
                      padding: EdgeInsets.zero,
                      icon: const Icon(Icons.notifications_none_rounded, color: AppTheme.textDark, size: 23),
                    ),
                    if (unread > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          constraints: const BoxConstraints(minWidth: 18),
                          decoration: BoxDecoration(
                            color: AppTheme.danger,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: Text(
                            unread > 99 ? '99+' : '$unread',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

/// Welcome banner (blue card) used at the top of each home tab.
class WelcomeCard extends StatelessWidget {
  const WelcomeCard({super.key, required this.greeting, required this.detail, this.icon = Icons.school_rounded});

  final String greeting;
  final String detail;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppTheme.primaryBlue, borderRadius: BorderRadius.circular(20)),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(greeting, style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold)),
                const SizedBox(height: 5),
                Text(detail, style: const TextStyle(color: Color(0xFFDCE8FF), fontSize: 12, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Prompts for a reason (revision request, rejection). Returns null if
/// cancelled; the confirm button stays disabled until text is entered
/// when [required] is true.
Future<String?> askForRemarks(
  BuildContext context, {
  required String title,
  required String hint,
  required String confirmLabel,
  bool required = true,
  Color confirmColor = AppTheme.primaryBlue,
}) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setState) {
          final canConfirm = !required || controller.text.trim().isNotEmpty;
          return AlertDialog(
            title: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            content: TextField(
              controller: controller,
              autofocus: true,
              minLines: 3,
              maxLines: 5,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: hint,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: confirmColor),
                onPressed: canConfirm ? () => Navigator.pop(context, controller.text.trim()) : null,
                child: Text(confirmLabel),
              ),
            ],
          );
        },
      );
    },
  );
}

Future<bool> confirmAction(BuildContext context, {required String title, required String message, required String confirmLabel}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
      content: Text(message, style: const TextStyle(height: 1.4)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(confirmLabel)),
      ],
    ),
  );
  return result ?? false;
}

void showMessage(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: error ? AppTheme.danger : null,
      behavior: SnackBarBehavior.floating,
    ));
}

/// Standard white app bar for pushed (detail) screens.
PreferredSizeWidget detailAppBar(String title, {List<Widget>? actions}) {
  return AppBar(
    title: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
    backgroundColor: Colors.white,
    surfaceTintColor: Colors.white,
    foregroundColor: AppTheme.textDark,
    elevation: 0,
    actions: actions,
    bottom: const PreferredSize(
      preferredSize: Size.fromHeight(1),
      child: Divider(height: 1, color: AppTheme.border),
    ),
  );
}
