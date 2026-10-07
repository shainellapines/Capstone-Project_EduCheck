import 'package:flutter/material.dart';

import '../../core/api/educheck_api.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';

/// SPMP M-03 + M-04 for a Subject Teacher: one uploaded e-Class Record -
/// where it is in the workflow, the Adviser's revision request if any, and
/// exactly what the rule-based validator flagged and why (read-only; the
/// fix and re-upload happen on the web app).
class UploadDetailScreen extends StatelessWidget {
  const UploadDetailScreen({super.key, required this.classRecordId});

  final int classRecordId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: detailAppBar('Upload Details'),
      body: AsyncView<Json>(
        load: () => EduCheckApi.instance.uploadValidation(classRecordId),
        builder: (context, data, reload) {
          final record = asMap(data['class_record']);
          final validation = asMap(data['validation']);
          final issues = asList(validation['issues']);
          final errors = issues.where((i) => i['severity'] == 'error').toList();
          final warnings = issues.where((i) => i['severity'] != 'error').toList();
          final status = record['status']?.toString() ?? '-';

          return [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${record['subject_name']} • Grade ${record['grade_level']}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'SY ${record['school_year']} • Uploaded ${formatDate(record['upload_date'], withTime: true)}',
                              style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                            ),
                          ],
                        ),
                      ),
                      StatusPill(status),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.insert_drive_file_outlined, size: 16, color: AppTheme.textGray),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          record['file_name']?.toString() ?? '',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textGray),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (status == 'Needs Revision') ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.edit_note_rounded, color: AppTheme.danger),
                        SizedBox(width: 8),
                        Text(
                          'Revision requested by the Adviser',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      record['revision_remarks']?.toString() ?? '',
                      style: const TextStyle(fontSize: 13, color: Color(0xFF7F1D1D), height: 1.4),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Correct the file and re-upload it on the EduCheck web app. '
                      'Requested ${formatDate(record['revision_requested_at'], withTime: true)}.',
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF991B1B)),
                    ),
                  ],
                ),
              ),
            ],
            const SectionTitle('Validation summary'),
            StatGrid(cards: [
              StatCard(
                title: 'Errors',
                value: '${validation['error_count'] ?? 0}',
                icon: Icons.error_outline_rounded,
                color: AppTheme.danger,
                background: const Color(0xFFFEF2F2),
              ),
              StatCard(
                title: 'Warnings',
                value: '${validation['warning_count'] ?? 0}',
                icon: Icons.warning_amber_rounded,
                color: AppTheme.warning,
                background: const Color(0xFFFFF7ED),
              ),
              StatCard(
                title: 'Learners checked',
                value: '${validation['learner_count'] ?? 0}',
                icon: Icons.groups_rounded,
                color: AppTheme.primaryBlue,
                background: const Color(0xFFEFF6FF),
              ),
              StatCard(
                title: 'Ready for submission',
                value: validation['ready_for_submission'] == true ? 'Yes' : 'No',
                icon: Icons.task_alt_rounded,
                color: validation['ready_for_submission'] == true ? AppTheme.success : AppTheme.danger,
                background: validation['ready_for_submission'] == true ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
              ),
            ]),
            if (issues.isEmpty) ...[
              const SizedBox(height: 14),
              const EmptyState(
                icon: Icons.verified_outlined,
                message: 'No issues found. Every learner passed the validation rules.',
              ),
            ],
            if (errors.isNotEmpty) ...[
              const SectionTitle('Errors to fix'),
              for (final issue in errors) ...[_IssueTile(issue: issue), const SizedBox(height: 8)],
            ],
            if (warnings.isNotEmpty) ...[
              const SectionTitle('Warnings'),
              for (final issue in warnings) ...[_IssueTile(issue: issue), const SizedBox(height: 8)],
            ],
          ];
        },
      ),
    );
  }
}

class _IssueTile extends StatelessWidget {
  const _IssueTile({required this.issue});

  final Json issue;

  @override
  Widget build(BuildContext context) {
    final isError = issue['severity'] == 'error';
    final color = isError ? AppTheme.danger : AppTheme.warning;
    final where = [
      if (issue['learner_name'] != null) issue['learner_name'],
      if (issue['term'] != null) issue['term'],
      if (issue['field'] != null) issue['field'],
    ].join(' • ');

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(
            icon: isError ? Icons.error_outline_rounded : Icons.warning_amber_rounded,
            color: color,
            background: color.withValues(alpha: 0.1),
            size: 36,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  issue['message']?.toString() ?? '',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textDark, height: 1.4),
                ),
                if (where.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(where, style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray)),
                ],
                const SizedBox(height: 4),
                Text(
                  issue['code']?.toString() ?? '',
                  style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: color, letterSpacing: 0.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
