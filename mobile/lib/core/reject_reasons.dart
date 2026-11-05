import 'package:flutter/material.dart';

import 'theme/app_theme.dart';

/// Why the Administrator returns a consolidated record during approval.
/// Same list as the web app (frontend/src/utils/rejectReasons.js).
const rejectReasons = [
  'Wrong learner details (name, LRN, sex or birthdate)',
  'Learner does not belong to this section',
  "Grades do not match the teacher's class record",
  'Learner transferred out or dropped',
  'Other',
];

const rejectGuidance =
    'Reject only for problems EduCheck cannot check, such as wrong learner details or grades that do not match the class record. The Adviser sees your reason.';

/// "Reason: details", or just the reason. "Other" needs details.
String buildRejectRemarks(String? reason, String details) {
  final text = details.trim();
  if (reason == null || (reason == 'Other' && text.isEmpty)) return '';
  if (reason == 'Other') return text;
  return text.isEmpty ? reason : '$reason: $text';
}

/// Asks for a rejection reason. Returns the remarks to send, or null if
/// cancelled. Confirm stays disabled until a reason is chosen.
Future<String?> askForRejectReason(BuildContext context) {
  final details = TextEditingController();
  String? reason;

  return showDialog<String>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) {
        final remarks = buildRejectRemarks(reason, details.text);
        final border = OutlineInputBorder(
          borderRadius: AppTheme.corners,
          borderSide: const BorderSide(color: AppTheme.border),
        );

        return AlertDialog(
          title: const Text('Reject this record?', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(rejectGuidance, style: TextStyle(fontSize: 12.5, height: 1.4, color: AppTheme.textGray)),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: reason,
                  isExpanded: true,
                  hint: const Text('Choose a reason'),
                  decoration: InputDecoration(border: border, enabledBorder: border, fillColor: AppTheme.background),
                  items: [
                    for (final option in rejectReasons)
                      DropdownMenuItem(value: option, child: Text(option, overflow: TextOverflow.ellipsis)),
                  ],
                  onChanged: (value) => setState(() => reason = value),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: details,
                  minLines: 2,
                  maxLines: 4,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: reason == 'Other'
                        ? 'Describe the problem (required)'
                        : 'Details, e.g. which subject or what to correct (optional)',
                    fillColor: AppTheme.background,
                    border: border,
                    enabledBorder: border,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppTheme.danger),
              onPressed: remarks.isEmpty ? null : () => Navigator.pop(context, remarks),
              child: const Text('Reject'),
            ),
          ],
        );
      },
    ),
  );
}
