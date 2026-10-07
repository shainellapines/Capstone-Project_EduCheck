import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'school_year.dart';
import 'student_record_screen.dart';

/// SPMP M-07 (Academic Analytics Snapshot): submission completion by
/// section, outstanding items, grade summary and the intervention list.
/// The backend scopes everything - an Adviser only ever sees their own
/// section, Admin and Principal see the whole school.
class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  Future<ApiResult<Json>> _load() async {
    final year = await SchoolYearContext.current();
    final id = SchoolYearContext.idOf(year.data);
    final analytics = await EduCheckApi.instance.analytics(id);
    final sections = await EduCheckApi.instance.sectionProgress(id);
    return ApiResult<Json>(
      {'school_year': year.data, 'analytics': analytics.data, 'sections': sections.data},
      fromCache: analytics.fromCache || sections.fromCache,
      cachedAt: analytics.cachedAt ?? sections.cachedAt,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAdviser = SessionStore.instance.role == 'adviser';

    return AsyncView<Json>(
      load: _load,
      builder: (context, data, reload) {
        final schoolYear = asMap(data['school_year']);
        final analytics = asMap(data['analytics']);
        final overview = asMap(analytics['overview']);
        final sections = asList(data['sections']);
        final flags = asList(analytics['intervention_flags']);
        final distribution = asList(analytics['grade_distribution']);
        final sectionNames = {for (final s in sections) s['section_id']: s['section_name']};

        final totalStudents = sections.fold<int>(0, (sum, s) => sum + ((s['student_count'] as num?)?.toInt() ?? 0));
        final approved = sections.fold<int>(
          0,
          (sum, s) => sum + ((asMap(s['submission_status_counts'])['Approved'] as num?)?.toInt() ?? 0),
        );
        final completion = totalStudents == 0 ? 0.0 : approved / totalStudents;

        return [
          Text(
            isAdviser ? 'My section • SY ${schoolYear['school_year']}' : 'School-wide • SY ${schoolYear['school_year']}',
            style: const TextStyle(fontSize: 12.5, color: AppTheme.textGray),
          ),
          const SizedBox(height: 10),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Records approved', style: TextStyle(fontSize: 13, color: AppTheme.textGray)),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${(completion * 100).round()}%',
                      style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 5),
                      child: Text(
                        '$approved of $totalStudents learners',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textGray),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: completion,
                    minHeight: 9,
                    backgroundColor: const Color(0xFFE2E8F0),
                    color: AppTheme.success,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          StatGrid(cards: [
            StatCard(
              title: 'Average final grade',
              value: formatGrade(overview['average_final_grade']),
              icon: Icons.insights_rounded,
              color: AppTheme.primaryBlue,
              background: const Color(0xFFEFF6FF),
            ),
            StatCard(
              title: 'Pass rate',
              value: overview['pass_rate'] == null ? '-' : '${formatGrade(overview['pass_rate'])}%',
              icon: Icons.check_circle_outline_rounded,
              color: AppTheme.success,
              background: const Color(0xFFF0FDF4),
            ),
            StatCard(
              title: 'Grades below 75',
              value: '${overview['at_risk_count'] ?? 0}',
              icon: Icons.trending_down_rounded,
              color: AppTheme.danger,
              background: const Color(0xFFFEF2F2),
            ),
            StatCard(
              title: 'Learners needing intervention',
              value: '${flags.length}',
              icon: Icons.support_rounded,
              color: AppTheme.warning,
              background: const Color(0xFFFFF7ED),
            ),
          ]),
          const SectionTitle('Completion by section'),
          if (sections.isEmpty)
            const EmptyState(icon: Icons.groups_outlined, message: 'No sections to show.'),
          for (final section in sections) ...[
            _SectionProgressCard(section: section),
            const SizedBox(height: 10),
          ],
          if (distribution.any((band) => (band['count'] as num? ?? 0) > 0)) ...[
            const SectionTitle('Grade distribution'),
            AppCard(child: _Distribution(bands: distribution)),
          ],
          const SectionTitle('Intervention list'),
          if (flags.isEmpty)
            const EmptyState(icon: Icons.emoji_events_outlined, message: 'No learner has a final grade below 75.'),
          for (final flag in flags.take(30)) ...[
            AppCard(
              padding: const EdgeInsets.all(14),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => StudentRecordScreen(
                    schoolYearId: SchoolYearContext.idOf(schoolYear),
                    lrn: flag['lrn'].toString(),
                    sectionName: sectionNames[flag['section_id']]?.toString(),
                  ),
                ),
              ),
              child: Row(
                children: [
                  const IconTile(
                    icon: Icons.warning_amber_rounded,
                    color: AppTheme.danger,
                    background: Color(0xFFFEF2F2),
                    size: 38,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${flag['last_name']}, ${flag['first_name']}',
                          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          asList(flag['failing_subjects'])
                              .map((s) => '${s['subject_name']} ${formatGrade(s['final_grade'])}')
                              .join(' • '),
                          style: const TextStyle(fontSize: 11.5, color: AppTheme.danger),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    flag['section_name']?.toString() ?? '',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textGray),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          if (flags.length > 30)
            Text(
              'Showing 30 of ${flags.length}. See the full list on the web app.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
            ),
        ];
      },
    );
  }
}

class _SectionProgressCard extends StatelessWidget {
  const _SectionProgressCard({required this.section});

  final Json section;

  @override
  Widget build(BuildContext context) {
    final expected = (section['subjects_expected'] as num?)?.toInt() ?? 0;
    final submitted = (section['subjects_submitted'] as num?)?.toInt() ?? 0;
    final revision = (section['subjects_needs_revision'] as num?)?.toInt() ?? 0;
    final attention = (section['subjects_needs_attention'] as num?)?.toInt() ?? 0;
    final notStarted = (section['subjects_not_started'] as num?)?.toInt() ?? 0;
    final counts = asMap(section['submission_status_counts']);
    final outstanding = revision + attention + notStarted;

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
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
              ),
              Text(
                '$submitted/$expected subjects',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textGray),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: LinearProgressIndicator(
              value: expected == 0 ? 0 : submitted / expected,
              minHeight: 7,
              backgroundColor: const Color(0xFFE2E8F0),
              color: AppTheme.primaryBlue,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _tag('${section['student_count']} learners', AppTheme.textGray),
              _tag('${counts['Approved'] ?? 0} approved', AppTheme.success),
              _tag('${counts['Pending Approval'] ?? 0} pending', AppTheme.primaryBlue),
              if (outstanding > 0) _tag('$outstanding subject(s) outstanding', AppTheme.warning),
              if (revision > 0) _tag('$revision need revision', AppTheme.danger),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _Distribution extends StatelessWidget {
  const _Distribution({required this.bands});

  final List<Json> bands;

  @override
  Widget build(BuildContext context) {
    final maxCount = bands.fold<int>(1, (m, b) => ((b['count'] as num?)?.toInt() ?? 0) > m ? (b['count'] as num).toInt() : m);

    return Column(
      children: [
        for (final band in bands)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Row(
              children: [
                SizedBox(
                  width: 64,
                  child: Text(
                    band['band'].toString(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark),
                  ),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ((band['count'] as num?)?.toInt() ?? 0) / maxCount,
                      minHeight: 10,
                      backgroundColor: const Color(0xFFF1F5F9),
                      color: band['band'] == 'Below 75' ? AppTheme.danger : AppTheme.primaryBlue,
                    ),
                  ),
                ),
                SizedBox(
                  width: 40,
                  child: Text(
                    '${band['count']}',
                    textAlign: TextAlign.right,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textGray),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
