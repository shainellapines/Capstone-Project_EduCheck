import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'sf10_preview_screen.dart';

/// One learner's consolidated record for a school year: every subject's
/// three term grades, final grade and upload status, plus the submission
/// workflow state. Actions follow SPMP §6.2 and the backend's rules:
///   Adviser   - submit for approval; return one subject to its teacher
///   Admin     - approve or return a record that is Pending Approval (M-06)
///   Principal - view only
class StudentRecordScreen extends StatefulWidget {
  const StudentRecordScreen({super.key, required this.schoolYearId, required this.lrn, this.sectionName});

  final int schoolYearId;
  final String lrn;
  final String? sectionName;

  @override
  State<StudentRecordScreen> createState() => _StudentRecordScreenState();
}

class _StudentRecordScreenState extends State<StudentRecordScreen> {
  final GlobalKey<AsyncViewState<Json>> _viewKey = GlobalKey();
  bool _busy = false;
  bool _changed = false;

  String? get _role => SessionStore.instance.role;

  Future<ApiResult<Json>> _load() => EduCheckApi.instance.studentRecord(widget.schoolYearId, widget.lrn);

  Future<void> _run(Future<Json> Function() action) async {
    setState(() => _busy = true);
    try {
      final result = await action();
      _changed = true;
      if (mounted) showMessage(context, result['message']?.toString() ?? 'Done.');
      await _viewKey.currentState?.reload();
    } catch (error) {
      if (mounted) showMessage(context, error.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submit() async {
    final ok = await confirmAction(
      context,
      title: 'Submit for approval?',
      message: 'The consolidated record will be sent to the School Administrator for approval.',
      confirmLabel: 'Submit',
    );
    if (ok) await _run(() => EduCheckApi.instance.submitForApproval(widget.schoolYearId, widget.lrn));
  }

  Future<void> _requestRevision(Json subject) async {
    final remarks = await askForRemarks(
      context,
      title: 'Return ${subject['subject_name']}?',
      hint: 'What should ${subject['teacher_name']} correct?',
      confirmLabel: 'Return to teacher',
      confirmColor: AppTheme.warning,
    );
    if (remarks == null) return;
    await _run(() => EduCheckApi.instance.requestRevision((subject['class_record_id'] as num).toInt(), remarks));
  }

  Future<void> _approve() async {
    final ok = await confirmAction(
      context,
      title: 'Approve this record?',
      message: 'The record becomes final and is frozen as approved. The Adviser and subject teachers are notified.',
      confirmLabel: 'Approve',
    );
    if (ok) await _run(() => EduCheckApi.instance.approve(widget.schoolYearId, widget.lrn));
  }

  Future<void> _reject() async {
    final remarks = await askForRemarks(
      context,
      title: 'Return this record?',
      hint: 'Reason for returning it to the Adviser',
      confirmLabel: 'Return',
      confirmColor: AppTheme.danger,
    );
    if (remarks == null) return;
    await _run(() => EduCheckApi.instance.reject(widget.schoolYearId, widget.lrn, remarks));
  }

  @override
  Widget build(BuildContext context) {
    // Report back whether anything changed (system back gesture included)
    // so the list behind this screen can refresh.
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, _changed);
      },
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          leading: BackButton(onPressed: () => Navigator.pop(context, _changed)),
          title: const Text(
            'Student Record',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textDark),
          ),
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          foregroundColor: AppTheme.textDark,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppTheme.border),
          ),
        ),
        body: AsyncView<Json>(
          key: _viewKey,
          load: _load,
          builder: (context, student, reload) => _buildContent(student),
        ),
        bottomNavigationBar: _busy ? const LinearProgressIndicator(minHeight: 3) : null,
      ),
    );
  }

  List<Widget> _buildContent(Json student) {
    final submission = asMap(student['submission']);
    final status = submission['status']?.toString() ?? 'Not Submitted';
    final subjects = asList(student['subjects']);
    final flagged = subjects.where((s) => s['status'] == 'Needs Revision').length;
    final complete = student['all_subjects_submitted'] == true;

    return [
      AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppTheme.lightBlue,
                  child: Text(
                    '${(student['first_name'] ?? ' ').toString().characters.first}'
                    '${(student['last_name'] ?? ' ').toString().characters.first}',
                    style: const TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${student['last_name']}, ${student['first_name']}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        // sectionName already reads "Grade 6 - Rizal".
                        'LRN ${student['lrn']} • ${widget.sectionName ?? 'Grade ${student['grade_level']}'}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textGray),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                StatusPill(status),
                _chip(Icons.menu_book_outlined, '${student['subjects_recorded']}/${student['subjects_expected'] ?? '?'} subjects'),
                if (flagged > 0) _chip(Icons.edit_note_rounded, '$flagged needs revision', color: AppTheme.danger),
              ],
            ),
            if ((submission['remarks'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10)),
                child: Text(
                  'Administrator remarks: ${submission['remarks']}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B), height: 1.35),
                ),
              ),
            ],
          ],
        ),
      ),
      const SectionTitle('Subjects'),
      for (final subject in subjects) ...[
        _SubjectCard(
          subject: subject,
          onReturn: _role == 'adviser' && subject['status'] != 'Needs Revision' && !_busy
              ? () => _requestRevision(subject)
              : null,
        ),
        const SizedBox(height: 10),
      ],
      const SizedBox(height: 8),
      ..._actions(status, complete, flagged),
      if (_role != 'subject') ...[
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => Sf10PreviewScreen(lrn: widget.lrn)),
          ),
          icon: const Icon(Icons.description_outlined, size: 18),
          label: const Text('Preview permanent record (SF10)'),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(46)),
        ),
      ],
    ];
  }

  List<Widget> _actions(String status, bool complete, int flagged) {
    if (_role == 'adviser') {
      final canSubmit = complete && flagged == 0 && status != 'Approved' && status != 'Pending Approval';
      final hint = status == 'Approved'
          ? 'This record is approved. Return a subject to reopen it.'
          : status == 'Pending Approval'
              ? 'Waiting for the Administrator\'s decision.'
              : !complete
                  ? 'Every subject needs an uploaded grade before submitting.'
                  : flagged > 0
                      ? 'Resolve subjects marked Needs Revision first.'
                      : null;
      return [
        FilledButton.icon(
          onPressed: canSubmit && !_busy ? _submit : null,
          icon: const Icon(Icons.send_rounded, size: 18),
          label: const Text('Submit for approval'),
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
        if (hint != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(hint, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppTheme.textGray)),
          ),
      ];
    }

    if (_role == 'admin' && status == 'Pending Approval') {
      return [
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _reject,
                icon: const Icon(Icons.undo_rounded, size: 18),
                label: const Text('Return'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.danger,
                  side: const BorderSide(color: AppTheme.danger),
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                onPressed: _busy ? null : _approve,
                icon: const Icon(Icons.verified_rounded, size: 18),
                label: const Text('Approve'),
                style: FilledButton.styleFrom(backgroundColor: AppTheme.success, minimumSize: const Size.fromHeight(48)),
              ),
            ),
          ],
        ),
      ];
    }

    if (_role == 'principal') {
      return const [
        Text(
          'View only - approvals are made by the School Administrator.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, color: AppTheme.textGray),
        ),
      ];
    }

    return const [];
  }

  Widget _chip(IconData icon, String label, {Color color = AppTheme.textGray}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

class _SubjectCard extends StatelessWidget {
  const _SubjectCard({required this.subject, this.onReturn});

  final Json subject;
  final VoidCallback? onReturn;

  @override
  Widget build(BuildContext context) {
    final finalGrade = subject['final_grade'];
    final failing = finalGrade is num && finalGrade < 75;

    return AppCard(
      padding: const EdgeInsets.all(14),
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
                      subject['subject_name']?.toString() ?? '',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subject['teacher_name']?.toString() ?? '',
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                    ),
                  ],
                ),
              ),
              StatusPill(subject['status']?.toString() ?? '-'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _grade('Term 1', subject['term_1']),
              _grade('Term 2', subject['term_2']),
              _grade('Term 3', subject['term_3']),
              _grade('Final', finalGrade, emphasize: true, danger: failing),
            ],
          ),
          if ((subject['revision_remarks'] ?? '').toString().isNotEmpty && subject['status'] == 'Needs Revision') ...[
            const SizedBox(height: 10),
            Text(
              'Revision requested: ${subject['revision_remarks']}',
              style: const TextStyle(fontSize: 11.5, color: AppTheme.danger, height: 1.35),
            ),
          ],
          if (onReturn != null) ...[
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onReturn,
                icon: const Icon(Icons.undo_rounded, size: 16),
                label: const Text('Return to teacher'),
                style: TextButton.styleFrom(foregroundColor: AppTheme.warning),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _grade(String label, dynamic value, {bool emphasize = false, bool danger = false}) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textGray)),
          const SizedBox(height: 3),
          Text(
            formatGrade(value),
            style: TextStyle(
              fontSize: emphasize ? 17 : 14,
              fontWeight: emphasize ? FontWeight.bold : FontWeight.w600,
              color: danger ? AppTheme.danger : AppTheme.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
