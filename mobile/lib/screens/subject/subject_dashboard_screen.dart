import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import '../shared/profile_screen.dart';
import '../shared/role_shell.dart';
import 'upload_detail_screen.dart';

/// Subject Teacher on mobile (SPMP §6.5): the status of every e-Class
/// Record they uploaded (M-03), what validation flagged and why (M-04),
/// and alerts when an Adviser asks for a revision (M-02). Uploading itself
/// stays on the web.
class SubjectDashboardScreen extends StatelessWidget {
  const SubjectDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RoleShell(
      subtitle: 'Subject Teacher',
      tabs: [
        ShellTab(label: 'Home', icon: Icons.home_rounded, builder: (context, goTo) => _SubjectHome(goTo: goTo)),
        ShellTab(label: 'My Uploads', icon: Icons.upload_file_rounded, builder: (context, goTo) => const _UploadsList()),
        ShellTab(label: 'Account', icon: Icons.person_outline_rounded, builder: (context, goTo) => const ProfileScreen()),
      ],
    );
  }
}

const _actionStatuses = {'Needs Revision', 'Needs Attention'};

Future<ApiResult<Json>> _loadUploads() async {
  final summary = await EduCheckApi.instance.myUploadSummary();
  final uploads = await EduCheckApi.instance.myUploads();
  return ApiResult<Json>(
    {'summary': summary.data, 'uploads': uploads.data},
    fromCache: summary.fromCache || uploads.fromCache,
    cachedAt: summary.cachedAt ?? uploads.cachedAt,
  );
}

void _openUpload(BuildContext context, Json upload) => Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => UploadDetailScreen(classRecordId: (upload['class_record_id'] as num).toInt()),
      ),
    );

class _SubjectHome extends StatelessWidget {
  const _SubjectHome({required this.goTo});

  final void Function(int index) goTo;

  @override
  Widget build(BuildContext context) {
    final username = SessionStore.instance.user?['username']?.toString() ?? '';

    return AsyncView<Json>(
      load: _loadUploads,
      builder: (context, data, reload) {
        final summary = asMap(data['summary']);
        final uploads = asList(data['uploads']);
        final needsAction = uploads.where((u) => _actionStatuses.contains(u['status'])).toList();

        return [
          WelcomeCard(
            greeting: 'Good day, $username!',
            detail: 'Subject Teacher\nTrack your e-Class Record uploads and validation results.',
            icon: Icons.menu_book_rounded,
          ),
          const SectionTitle('My uploads'),
          StatGrid(cards: [
            StatCard(
              title: 'Total uploaded',
              value: '${summary['total_uploaded'] ?? 0}',
              icon: Icons.upload_file_rounded,
              color: AppTheme.primaryBlue,
              background: const Color(0xFFEFF6FF),
              onTap: () => goTo(1),
            ),
            StatCard(
              title: 'Validated',
              value: '${summary['validated'] ?? 0}',
              icon: Icons.verified_outlined,
              color: AppTheme.success,
              background: const Color(0xFFF0FDF4),
              onTap: () => goTo(1),
            ),
            StatCard(
              title: 'Needs attention',
              value: '${summary['needs_attention'] ?? 0}',
              icon: Icons.warning_amber_rounded,
              color: AppTheme.danger,
              background: const Color(0xFFFEF2F2),
              onTap: () => goTo(1),
            ),
            StatCard(
              title: 'Awaiting validation',
              value: '${summary['pending_validation'] ?? 0}',
              icon: Icons.hourglass_top_rounded,
              color: AppTheme.warning,
              background: const Color(0xFFFFF7ED),
              onTap: () => goTo(1),
            ),
          ]),
          SectionTitle(
            'Needs your action',
            action: needsAction.isEmpty ? null : TextButton(onPressed: () => goTo(1), child: const Text('View all')),
          ),
          if (needsAction.isEmpty)
            const EmptyState(
              icon: Icons.check_circle_outline_rounded,
              message: 'Nothing to fix right now. Revision requests and validation problems will appear here.',
            ),
          for (final upload in needsAction.take(5)) ...[
            _UploadTile(upload: upload, onTap: () => _openUpload(context, upload)),
            const SizedBox(height: 8),
          ],
          const SectionTitle('Recent uploads'),
          if (uploads.isEmpty)
            const EmptyState(
              icon: Icons.cloud_upload_outlined,
              message: 'No uploads yet. Upload your e-Class Record from the EduCheck web app.',
            ),
          for (final upload in uploads.take(3)) ...[
            _UploadTile(upload: upload, onTap: () => _openUpload(context, upload)),
            const SizedBox(height: 8),
          ],
        ];
      },
    );
  }
}

class _UploadsList extends StatefulWidget {
  const _UploadsList();

  @override
  State<_UploadsList> createState() => _UploadsListState();
}

class _UploadsListState extends State<_UploadsList> {
  String? _filter;

  @override
  Widget build(BuildContext context) {
    return AsyncView<Json>(
      load: _loadUploads,
      builder: (context, data, reload) {
        final uploads = asList(data['uploads']);
        final statuses = uploads.map((u) => u['status'].toString()).toSet().toList()..sort();
        final visible = _filter == null ? uploads : uploads.where((u) => u['status'] == _filter).toList();

        return [
          const Text(
            'My Uploads',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textDark),
          ),
          const SizedBox(height: 4),
          const Text(
            'Every e-Class Record you uploaded, newest first.',
            style: TextStyle(fontSize: 12.5, color: AppTheme.textGray),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text('All (${uploads.length})'),
                    selected: _filter == null,
                    onSelected: (_) => setState(() => _filter = null),
                  ),
                ),
                for (final status in statuses)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(status),
                      selected: _filter == status,
                      onSelected: (_) => setState(() => _filter = status),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (visible.isEmpty)
            const EmptyState(icon: Icons.cloud_upload_outlined, message: 'No uploads to show.'),
          for (final upload in visible) ...[
            _UploadTile(upload: upload, onTap: () => _openUpload(context, upload)),
            const SizedBox(height: 8),
          ],
        ];
      },
    );
  }
}

class _UploadTile extends StatelessWidget {
  const _UploadTile({required this.upload, required this.onTap});

  final Json upload;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = upload['status']?.toString() ?? '-';
    final style = StatusStyle.of(status);

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          IconTile(icon: Icons.description_outlined, color: style.foreground, background: style.background, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${upload['subject_name']} • Grade ${upload['grade_level']}',
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
                const SizedBox(height: 3),
                Text(
                  'SY ${upload['school_year']} • ${formatDate(upload['upload_date'])}',
                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                ),
                if (status == 'Needs Revision' && (upload['revision_remarks'] ?? '').toString().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    upload['revision_remarks'].toString(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, color: AppTheme.danger),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          StatusPill(status),
        ],
      ),
    );
  }
}
