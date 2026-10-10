import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/notifications/notification_poller.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';

/// Notification titles the backend writes (must match the strings in
/// backend/src/controllers). Role tabs use them to say which alerts open them.
class NotificationTitles {
  static const recordSubmitted = 'Record Submitted for Approval';
  static const recordsSubmitted = 'Records Submitted for Approval';
  static const submissionApproved = 'Submission Approved';
  static const submissionRejected = 'Submission Rejected';
  static const revisionRequested = 'Revision Requested';
  static const amendmentNeeded = 'Approved Record Needs Amendment';
  static const uploadNeedsCorrection = 'Upload Needs Correction';
  static const uploadHasWarnings = 'Upload Has Warnings';
}

/// SPMP M-09 (Notification History): every alert the backend raised for
/// this account - validation results, revision requests, approvals and
/// rejections - so nothing is lost if a phone notification was missed.
/// Tapping an alert whose title is in [openableTitles] marks it read and
/// closes this screen with that title, so the role shell can open the
/// matching tab (SPMP M-06: act on a record from its notification).
class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key, this.openableTitles = const {}});

  final Set<String> openableTitles;

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final GlobalKey<AsyncViewState<Json>> _viewKey = GlobalKey();
  bool _unreadOnly = false;

  Future<ApiResult<Json>> _load() async {
    final result = await EduCheckApi.instance.notifications();
    NotificationPoller.instance.unreadCount.value = (result.data['unread_count'] as num?)?.toInt() ?? 0;
    return result;
  }

  Future<void> _markRead(Json item) async {
    if (item['status'] != 'Unread') return;
    try {
      await EduCheckApi.instance.markNotificationRead((item['notification_id'] as num).toInt());
      await _viewKey.currentState?.reload();
    } catch (error) {
      if (mounted) showMessage(context, error.toString(), error: true);
    }
  }

  Future<void> _open(Json item) async {
    final title = item['title']?.toString() ?? '';
    await _markRead(item);
    if (!mounted) return;
    if (widget.openableTitles.contains(title)) Navigator.pop(context, title);
  }

  Future<void> _markAllRead() async {
    try {
      await EduCheckApi.instance.markAllNotificationsRead();
      await _viewKey.currentState?.reload();
      if (mounted) showMessage(context, 'All notifications marked as read.');
    } catch (error) {
      if (mounted) showMessage(context, error.toString(), error: true);
    }
  }

  IconData _iconFor(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('approved')) return Icons.verified_outlined;
    if (lower.contains('rejected')) return Icons.cancel_outlined;
    if (lower.contains('revision') || lower.contains('amendment')) return Icons.edit_note_rounded;
    if (lower.contains('validat')) return Icons.fact_check_outlined;
    return Icons.notifications_none_rounded;
  }

  Color _colorFor(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('approved')) return AppTheme.success;
    if (lower.contains('rejected')) return AppTheme.danger;
    if (lower.contains('revision') || lower.contains('amendment')) return AppTheme.warning;
    return AppTheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: detailAppBar('Notifications', actions: [
        TextButton(onPressed: _markAllRead, child: const Text('Mark all read')),
      ]),
      body: AsyncView<Json>(
        key: _viewKey,
        load: _load,
        builder: (context, data, reload) {
          final all = asList(data['notifications']);
          final items = _unreadOnly ? all.where((n) => n['status'] == 'Unread').toList() : all;

          return [
            Row(
              children: [
                ChoiceChip(
                  label: Text('All (${all.length})'),
                  selected: !_unreadOnly,
                  onSelected: (_) => setState(() => _unreadOnly = false),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: Text('Unread (${data['unread_count'] ?? 0})'),
                  selected: _unreadOnly,
                  onSelected: (_) => setState(() => _unreadOnly = true),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (items.isEmpty)
              EmptyState(
                icon: Icons.notifications_off_outlined,
                message: _unreadOnly ? 'You have no unread notifications.' : 'No notifications yet.',
              ),
            for (final item in items) ...[
              _NotificationTile(
                item: item,
                icon: _iconFor(item['title']?.toString() ?? ''),
                color: _colorFor(item['title']?.toString() ?? ''),
                opens: widget.openableTitles.contains(item['title']?.toString()),
                onTap: () => _open(item),
              ),
              const SizedBox(height: 10),
            ],
            if (all.length >= 50)
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  'Showing your 50 most recent notifications.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: AppTheme.textGray),
                ),
              ),
          ];
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.item,
    required this.icon,
    required this.color,
    required this.onTap,
    this.opens = false,
  });

  final Json item;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  /// Tapping opens the related screen, so show a chevron.
  final bool opens;

  @override
  Widget build(BuildContext context) {
    final unread = item['status'] == 'Unread';
    return AppCard(
      onTap: onTap,
      borderColor: unread ? AppTheme.primary.withValues(alpha: 0.35) : null,
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(icon: icon, color: color, background: color.withValues(alpha: 0.1), size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item['title']?.toString() ?? '',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: unread ? FontWeight.bold : FontWeight.w600,
                          color: AppTheme.textDark,
                        ),
                      ),
                    ),
                    if (unread)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item['message']?.toString() ?? '',
                  style: const TextStyle(fontSize: 12.5, color: AppTheme.textGray, height: 1.4),
                ),
                const SizedBox(height: 6),
                Text(
                  formatDate(item['created_at'], withTime: true),
                  style: const TextStyle(fontSize: 11, color: AppTheme.textGray),
                ),
              ],
            ),
          ),
          if (opens) ...[
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.textGray),
          ],
        ],
      ),
    );
  }
}
