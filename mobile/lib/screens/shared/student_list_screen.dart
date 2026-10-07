import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'school_year.dart';
import 'student_record_screen.dart';

const List<String> submissionStatuses = [
  'Not Submitted',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Amendment Requested',
];

/// SPMP M-03 (Submission Status Dashboard): every learner in scope with
/// their consolidation and approval status, filterable and searchable.
/// Scope comes from the backend (Adviser: own section; Admin/Principal:
/// whole school). Tapping a learner opens the record and its actions.
class StudentListScreen extends StatefulWidget {
  const StudentListScreen({super.key, this.initialStatus, this.title});

  final String? initialStatus;
  final String? title;

  @override
  State<StudentListScreen> createState() => _StudentListScreenState();
}

class _StudentListScreenState extends State<StudentListScreen> {
  final GlobalKey<AsyncViewState<Json>> _viewKey = GlobalKey();
  final TextEditingController _search = TextEditingController();
  late String? _status = widget.initialStatus;
  bool _busy = false;

  Future<ApiResult<Json>> _load() async {
    final year = await SchoolYearContext.current();
    final id = SchoolYearContext.idOf(year.data);
    final records = await EduCheckApi.instance.consolidatedRecords(id);
    final sections = await EduCheckApi.instance.sectionProgress(id);
    return ApiResult<Json>(
      {
        'school_year': year.data,
        'students': records.data['students'],
        'sections': sections.data,
      },
      fromCache: records.fromCache || sections.fromCache,
      cachedAt: records.cachedAt ?? sections.cachedAt,
    );
  }

  Future<void> _submitAll(int schoolYearId) async {
    final ok = await confirmAction(
      context,
      title: 'Submit all eligible records?',
      message: 'Every complete record with no subject awaiting revision will be sent to the Administrator.',
      confirmLabel: 'Submit all',
    );
    if (!ok) return;
    setState(() => _busy = true);
    try {
      final result = await EduCheckApi.instance.submitAllEligible(schoolYearId);
      if (mounted) showMessage(context, result['message']?.toString() ?? 'Submitted.');
      await _viewKey.currentState?.reload();
    } catch (error) {
      if (mounted) showMessage(context, error.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = SessionStore.instance.role;

    return Column(
      children: [
        if (_busy) const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: AsyncView<Json>(
            key: _viewKey,
            load: _load,
            builder: (context, data, reload) {
              final schoolYearId = SchoolYearContext.idOf(asMap(data['school_year']));
              final students = asList(data['students']);
              final sectionNames = {
                for (final s in asList(data['sections']))
                  s['section_id']: 'Grade ${s['grade_level']} - ${s['section_name']}',
              };
              final counts = <String, int>{};
              for (final s in students) {
                final status = asMap(s['submission'])['status']?.toString() ?? 'Not Submitted';
                counts[status] = (counts[status] ?? 0) + 1;
              }

              final query = _search.text.trim().toLowerCase();
              final visible = students.where((s) {
                final status = asMap(s['submission'])['status'];
                if (_status != null && status != _status) return false;
                if (query.isEmpty) return true;
                return '${s['last_name']}, ${s['first_name']} ${s['lrn']}'.toLowerCase().contains(query);
              }).toList();

              return [
                if (widget.title != null) ...[
                  Text(
                    widget.title!,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: _search,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search name or LRN',
                    prefixIcon: const Icon(Icons.search_rounded),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.border),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 36,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _filterChip(null, 'All (${students.length})'),
                      for (final status in submissionStatuses)
                        if ((counts[status] ?? 0) > 0) _filterChip(status, '$status (${counts[status]})'),
                    ],
                  ),
                ),
                if (role == 'adviser' && (counts['Not Submitted'] ?? 0) + (counts['Rejected'] ?? 0) + (counts['Amendment Requested'] ?? 0) > 0) ...[
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _submitAll(schoolYearId),
                    icon: const Icon(Icons.send_rounded, size: 17),
                    label: const Text('Submit all eligible for approval'),
                  ),
                ],
                const SizedBox(height: 12),
                if (visible.isEmpty)
                  EmptyState(
                    icon: Icons.person_search_outlined,
                    message: students.isEmpty
                        ? (role == 'adviser'
                            ? 'No consolidated records yet. Records appear once subject grades are uploaded for your section.'
                            : 'No consolidated records for this school year yet.')
                        : 'No learners match this filter.',
                  ),
                for (final student in visible) ...[
                  _StudentTile(
                    student: student,
                    sectionName: sectionNames[student['section_id']],
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
                      if (changed == true) await _viewKey.currentState?.reload();
                    },
                  ),
                  const SizedBox(height: 8),
                ],
              ];
            },
          ),
        ),
      ],
    );
  }

  Widget _filterChip(String? status, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _status == status,
        onSelected: (_) => setState(() => _status = status),
      ),
    );
  }
}

class _StudentTile extends StatelessWidget {
  const _StudentTile({required this.student, required this.sectionName, required this.onTap});

  final Json student;
  final String? sectionName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = asMap(student['submission'])['status']?.toString() ?? 'Not Submitted';
    final subjects = asList(student['subjects']);
    final flagged = subjects.where((s) => s['status'] == 'Needs Revision').length;
    final style = StatusStyle.of(status);

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          IconTile(icon: style.icon, color: style.foreground, background: style.background, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${student['last_name']}, ${student['first_name']}',
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
                const SizedBox(height: 3),
                Text(
                  [
                    if (sectionName != null) sectionName!,
                    '${student['subjects_recorded']}/${student['subjects_expected'] ?? '?'} subjects',
                    if (flagged > 0) '$flagged to revise',
                  ].join(' • '),
                  style: TextStyle(fontSize: 11.5, color: flagged > 0 ? AppTheme.danger : AppTheme.textGray),
                ),
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
