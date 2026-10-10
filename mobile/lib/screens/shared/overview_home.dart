import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'profile_screen.dart';
import 'school_year.dart';
import 'student_list_screen.dart';
import 'student_record_screen.dart';

/// Home tab for Adviser, Administrator and Principal: a snapshot of the
/// submission workflow for the current school year (SPMP M-03 / M-07),
/// what needs this user's attention, and quick links. Scope is enforced by
/// the backend, so the same widget serves all three roles.
class OverviewHome extends StatelessWidget {
  const OverviewHome({super.key, required this.goTo, required this.recordsTab, required this.analyticsTab});

  final void Function(int index) goTo;
  final int recordsTab;
  final int analyticsTab;

  Future<ApiResult<Json>> _load() async {
    final year = await SchoolYearContext.current();
    final id = SchoolYearContext.idOf(year.data);
    final records = await EduCheckApi.instance.consolidatedRecords(id);
    final sections = await EduCheckApi.instance.sectionProgress(id);
    List<Json> assignments = [];
    if (SessionStore.instance.role == 'adviser') {
      assignments = (await EduCheckApi.instance.myAssignments()).data;
    }
    return ApiResult<Json>(
      {
        'school_year': year.data,
        'students': records.data['students'],
        'sections': sections.data,
        'assignments': assignments,
      },
      fromCache: records.fromCache || sections.fromCache,
      cachedAt: records.cachedAt ?? sections.cachedAt,
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = SessionStore.instance.role;
    final username = SessionStore.instance.user?['username']?.toString() ?? '';

    return AsyncView<Json>(
      load: _load,
      builder: (context, data, reload) {
        final schoolYear = asMap(data['school_year']);
        final schoolYearId = SchoolYearContext.idOf(schoolYear);
        final students = asList(data['students']);
        final sections = asList(data['sections']);
        final sectionNames = {
          for (final s in sections) s['section_id']: 'Grade ${s['grade_level']} - ${s['section_name']}',
        };

        int count(String status) =>
            students.where((s) => (asMap(s['submission'])['status'] ?? 'Not Submitted') == status).length;
        final needsRevision = students
            .where((s) => asList(s['subjects']).any((subject) => subject['status'] == 'Needs Revision'))
            .length;
        final ready = students
            .where((s) =>
                s['all_subjects_submitted'] == true &&
                !asList(s['subjects']).any((subject) => subject['status'] == 'Needs Revision') &&
                const {'Not Submitted', 'Rejected', 'Amendment Requested'}.contains(asMap(s['submission'])['status']))
            .length;

        final adviserSections = asList(data['assignments'])
            .where((a) => a['subject_id'] == null)
            .map((a) => 'Grade ${a['grade_level']} - ${a['section_name']}')
            .toList();

        final detail = switch (role) {
          'adviser' => adviserSections.isEmpty
              ? 'Class Adviser • no section assigned yet'
              : 'Class Adviser • ${adviserSections.join(', ')}',
          'admin' => 'School Administrator • ${sections.length} sections',
          _ => 'Principal • school-wide view',
        };

        // What this role should act on first.
        final attention = switch (role) {
          'admin' => students.where((s) => asMap(s['submission'])['status'] == 'Pending Approval').toList(),
          'adviser' => students
              .where((s) =>
                  asList(s['subjects']).any((subject) => subject['status'] == 'Needs Revision') ||
                  const {'Rejected', 'Amendment Requested'}.contains(asMap(s['submission'])['status']))
              .toList(),
          _ => <Json>[],
        };

        void openList(String status) => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => Scaffold(
                  backgroundColor: AppTheme.background,
                  appBar: detailAppBar(status),
                  body: StudentListScreen(initialStatus: status),
                ),
              ),
            );

        return [
          WelcomeCard(
            greeting: 'Good day, $username!',
            detail: '$detail\nSchool year ${schoolYear['school_year']}',
            icon: role == 'principal' ? Icons.account_balance_rounded : Icons.school_rounded,
          ),
          const SectionTitle('Overview'),
          StatGrid(cards: [
            if (role == 'adviser')
              StatCard(
                title: 'Ready to submit',
                value: '$ready',
                icon: Icons.task_alt_rounded,
                color: AppTheme.success,
                background: AppTheme.successBg,
                onTap: () => goTo(recordsTab),
              )
            else
              StatCard(
                title: 'Learners with records',
                value: '${students.length}',
                icon: Icons.groups_rounded,
                color: AppTheme.primary,
                background: AppTheme.primaryTint,
                onTap: () => goTo(recordsTab),
              ),
            StatCard(
              title: 'Pending approval',
              value: '${count('Pending Approval')}',
              icon: Icons.hourglass_top_rounded,
              color: AppTheme.primary,
              background: AppTheme.primaryTint,
              onTap: () => openList('Pending Approval'),
            ),
            StatCard(
              title: 'Approved',
              value: '${count('Approved')}',
              icon: Icons.verified_outlined,
              color: AppTheme.success,
              background: AppTheme.successBg,
              onTap: () => openList('Approved'),
            ),
            StatCard(
              title: 'Need revision',
              value: '$needsRevision',
              icon: Icons.edit_note_rounded,
              color: AppTheme.danger,
              background: AppTheme.dangerBg,
              onTap: () => goTo(recordsTab),
            ),
          ]),
          if (role != 'principal') ...[
            SectionTitle(
              role == 'admin' ? 'Awaiting your approval' : 'Needs your attention',
              action: attention.isEmpty
                  ? null
                  : TextButton(
                      onPressed: () => role == 'admin' ? openList('Pending Approval') : goTo(recordsTab),
                      child: const Text('View all'),
                    ),
            ),
            if (attention.isEmpty)
              EmptyState(
                icon: Icons.check_circle_outline_rounded,
                message: role == 'admin'
                    ? 'Nothing is waiting for approval.'
                    : 'No returned records or subjects awaiting revision.',
              ),
            for (final student in attention.take(5)) ...[
              AppCard(
                padding: const EdgeInsets.all(14),
                onTap: () async {
                  final changed = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                      builder: (_) => StudentRecordScreen(
                        schoolYearId: schoolYearId,
                        lrn: student['lrn'].toString(),
                        sectionName: sectionNames[student['section_id']],
                      ),
                    ),
                  );
                  if (changed == true) await reload();
                },
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${student['last_name']}, ${student['first_name']}',
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            sectionNames[student['section_id']] ?? 'LRN ${student['lrn']}',
                            style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                          ),
                        ],
                      ),
                    ),
                    StatusPill(
                      asList(student['subjects']).any((s) => s['status'] == 'Needs Revision')
                          ? 'Needs Revision'
                          : asMap(student['submission'])['status']?.toString() ?? 'Not Submitted',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],
          ],
          SectionTitle(
            role == 'adviser' ? 'My section' : 'Sections',
            action: TextButton(onPressed: () => goTo(analyticsTab), child: const Text('Analytics')),
          ),
          if (sections.isEmpty)
            EmptyState(
              icon: Icons.groups_outlined,
              message: role == 'adviser'
                  ? 'You are not assigned as Class Adviser of a section yet.'
                  : 'No sections have been set up yet.',
            ),
          for (final section in sections.take(role == 'adviser' ? 3 : 6)) ...[
            _SectionRow(section: section),
            const SizedBox(height: 8),
          ],
          if (role != 'adviser' && sections.length > 6)
            TextButton(onPressed: () => goTo(analyticsTab), child: Text('See all ${sections.length} sections')),
          const SizedBox(height: 6),
          Text(
            'Signed in as ${roleLabels[role] ?? role}. Pull down to refresh.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: AppTheme.textGray),
          ),
        ];
      },
    );
  }
}

class _SectionRow extends StatelessWidget {
  const _SectionRow({required this.section});

  final Json section;

  @override
  Widget build(BuildContext context) {
    final expected = (section['subjects_expected'] as num?)?.toInt() ?? 0;
    final submitted = (section['subjects_submitted'] as num?)?.toInt() ?? 0;
    final approved = (asMap(section['submission_status_counts'])['Approved'] as num?)?.toInt() ?? 0;
    final learners = (section['student_count'] as num?)?.toInt() ?? 0;

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Grade ${section['grade_level']} - ${section['section_name']}',
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
              ),
              Text(
                '$approved/$learners approved',
                style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: LinearProgressIndicator(
              value: expected == 0 ? 0 : submitted / expected,
              minHeight: 7,
              backgroundColor: AppTheme.surfaceSunken,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$submitted of $expected subjects validated',
            style: const TextStyle(fontSize: 11, color: AppTheme.textGray),
          ),
        ],
      ),
    );
  }
}
