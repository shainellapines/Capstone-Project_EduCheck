import 'package:flutter/material.dart';

import '../../core/api/educheck_api.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';

/// SPMP M-05: read-only preview of a learner's permanent record (SF10) -
/// readiness, gaps and every Grade 1-6 year. Generating the .xlsx stays on
/// the web platform (SPMP §6.5: mobile only previews).
class Sf10PreviewScreen extends StatelessWidget {
  const Sf10PreviewScreen({super.key, required this.lrn});

  final String lrn;

  static const Map<String, String> _blockLabels = {
    'Complete': 'Complete',
    'Partial': 'Partially filled',
    'Missing': 'No record',
    'Unsupported': '3-term year',
    'Unavailable': 'Unavailable',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: detailAppBar('SF10 Preview'),
      body: AsyncView<Json>(
        load: () => EduCheckApi.instance.sf10Preview(lrn),
        builder: (context, data, reload) {
          final record = asMap(data['record']);
          final learner = asMap(record['learner']);
          final readiness = asMap(data['readiness']);
          final years = asList(record['years']);
          final blocks = asList(readiness['blocks']);
          final issues = asList(readiness['issues']);
          final status = readiness['status']?.toString() ?? 'NOT_READY';

          return [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${learner['last_name']}, ${learner['first_name']}'
                    '${(learner['middle_name'] ?? '').toString().isNotEmpty ? ' ${learner['middle_name']}' : ''}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'LRN ${learner['lrn']}${learner['sex'] != null ? ' • ${learner['sex']}' : ''}'
                    '${learner['birth_date'] != null ? ' • Born ${formatDate(learner['birth_date'])}' : ''}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textGray),
                  ),
                  const SizedBox(height: 14),
                  _ReadinessBar(status: status, blocks: blocks),
                ],
              ),
            ),
            if (issues.isNotEmpty) ...[
              const SectionTitle('Readiness notes'),
              AppCard(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    for (final issue in issues)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              issue['level'] == 'info' ? Icons.info_outline_rounded : Icons.warning_amber_rounded,
                              size: 16,
                              color: issue['level'] == 'info' ? AppTheme.textGray : AppTheme.warning,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                issue['message']?.toString() ?? '',
                                style: const TextStyle(fontSize: 12.5, color: AppTheme.textDark, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
            const SectionTitle('Scholastic record'),
            for (final block in blocks) ...[
              _GradeBlock(
                block: block,
                label: _blockLabels[block['status']] ?? block['status'].toString(),
                year: years.cast<Json?>().firstWhere(
                      (y) => y!['school_year'] == block['school_year'] && y['source'] == block['source'],
                      orElse: () => null,
                    ),
              ),
              const SizedBox(height: 10),
            ],
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text(
                'Years graded in 3 terms are kept as recorded and are not converted into quarters. '
                'Generate the official SF10 file from the EduCheck web app.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11.5, color: AppTheme.textGray, height: 1.4),
              ),
            ),
          ];
        },
      ),
    );
  }
}

class _ReadinessBar extends StatelessWidget {
  const _ReadinessBar({required this.status, required this.blocks});

  final String status;
  final List<Json> blocks;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'READY' => ('Ready', AppTheme.success),
      'PARTIAL' => ('Partially ready', AppTheme.warning),
      _ => ('Not ready', AppTheme.danger),
    };
    final filled = blocks.where((b) => b['status'] == 'Complete' || b['status'] == 'Partial').length;

    Color segment(String? blockStatus) => switch (blockStatus) {
          'Complete' => AppTheme.success,
          'Partial' || 'Unavailable' => AppTheme.warning,
          'Unsupported' => AppTheme.info,
          _ => AppTheme.border,
        };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
            const Spacer(),
            Text('$filled / 6 grades on the form', style: const TextStyle(fontSize: 12, color: AppTheme.textGray)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (var i = 0; i < blocks.length; i++) ...[
              Expanded(
                child: Container(
                  height: 7,
                  decoration: BoxDecoration(
                    color: segment(blocks[i]['status']?.toString()),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              if (i < blocks.length - 1) const SizedBox(width: 4),
            ],
          ],
        ),
      ],
    );
  }
}

class _GradeBlock extends StatelessWidget {
  const _GradeBlock({required this.block, required this.label, required this.year});

  final Json block;
  final String label;
  final Json? year;

  @override
  Widget build(BuildContext context) {
    final status = block['status']?.toString();
    final pillStatus = status == 'Complete' ? 'Complete' : status == 'Partial' ? 'Partial' : 'Not Submitted';
    final quarters = year?['grading_scheme'] == 'QUARTER_4';
    final subjects = asList(year?['subjects']);

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: AppTheme.surfaceSunken, borderRadius: BorderRadius.circular(9)),
                child: Text(
                  '${block['grade_level']}',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Grade ${block['grade_level']}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    Text(
                      year == null
                          ? 'Not yet recorded'
                          : '${year!['school_year']} • ${year!['source'] == 'EDUCHECK' ? 'EduCheck' : 'Entered manually'}',
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: StatusStyle.of(pillStatus).background,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  label,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: StatusStyle.of(pillStatus).foreground),
                ),
              ),
            ],
          ),
          if (subjects.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Divider(height: 1, color: AppTheme.border),
            const SizedBox(height: 6),
            for (final subject in subjects)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        subject['label']?.toString() ?? '',
                        style: const TextStyle(fontSize: 12.5, color: AppTheme.textDark),
                      ),
                    ),
                    Text(
                      (subject['ratings'] as List? ?? []).take(quarters ? 4 : 3).map(formatGrade).join('  '),
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                    ),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 30,
                      child: Text(
                        formatGrade(subject['final_rating']),
                        textAlign: TextAlign.right,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'General average',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textGray),
                  ),
                ),
                Text(
                  formatGrade(year?['general_average']),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
