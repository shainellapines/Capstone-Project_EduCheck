import 'package:flutter/material.dart';

class SubmissionWorkflowScreen extends StatefulWidget {
  const SubmissionWorkflowScreen({super.key});

  @override
  State<SubmissionWorkflowScreen> createState() =>
      _SubmissionWorkflowScreenState();
}

class _SubmissionWorkflowScreenState
    extends State<SubmissionWorkflowScreen> {
  bool showThirdQuarterPreview = false;
  bool showSecondQuarterPreview = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1554D1),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Submission Workflow',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Track the submission workflow and review consolidated records',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 20),
          _recordCard(
            quarter: '3rd Quarter',
            schoolYear: '2025-2026',
            students: 0,
            status: 'draft',
            totalStudents: 0,
            onTrack: 0,
            atRisk: 0,
            needsIntervention: 0,
            message:
                'This record is still in draft. Please validate and submit it for review.',
            submittedAt: null,
            files: const [],
            showPreview: showThirdQuarterPreview,
            onPreviewPressed: () {
              setState(() {
                showThirdQuarterPreview = !showThirdQuarterPreview;
              });
            },
            hasStudents: false,
          ),
          const SizedBox(height: 16),
          _recordCard(
            quarter: '2nd Quarter',
            schoolYear: '2025-2026',
            students: 3,
            status: 'submitted',
            totalStudents: 3,
            onTrack: 1,
            atRisk: 1,
            needsIntervention: 1,
            message:
                'This record has been submitted and is waiting for administrative review.',
            submittedAt: '4/8/2026, 10:30:00 AM',
            files: const [
              {
                'name': 'Math_Q2_2025-2026.xlsx',
                'subject': 'Mathematics',
                'students': '3 students',
              },
              {
                'name': 'English_Q2_2025-2026.xlsx',
                'subject': 'English',
                'students': '3 students',
              },
            ],
            showPreview: showSecondQuarterPreview,
            onPreviewPressed: () {
              setState(() {
                showSecondQuarterPreview = !showSecondQuarterPreview;
              });
            },
            hasStudents: true,
          ),
        ],
      ),
    );
  }

  Widget _recordCard({
    required String quarter,
    required String schoolYear,
    required int students,
    required String status,
    required int totalStudents,
    required int onTrack,
    required int atRisk,
    required int needsIntervention,
    required String message,
    required String? submittedAt,
    required List<Map<String, String>> files,
    required bool showPreview,
    required VoidCallback onPreviewPressed,
    required bool hasStudents,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Grade 6 - Sampaguita',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$quarter • $schoolYear • $students students',
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 20),
          _timeline(status),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _summaryItem(
                  'Total Students',
                  totalStudents.toString(),
                ),
              ),
              Expanded(
                child: _summaryItem(
                  'On Track',
                  onTrack.toString(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _summaryItem(
                  'At Risk',
                  atRisk.toString(),
                ),
              ),
              Expanded(
                child: _summaryItem(
                  'Needs Intervention',
                  needsIntervention.toString(),
                ),
              ),
            ],
          ),
          if (files.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text(
              'Uploaded Files',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 10),
            ...files.map(
              (file) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.description_outlined,
                      color: Color(0xFF1554D1),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            file['name']!,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '${file['subject']} • ${file['students']}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Current Status: ${status.toUpperCase()}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1554D1),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    color: Color(0xFF6B7280),
                  ),
                ),
                if (submittedAt != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Submitted At: $submittedAt',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton(
              onPressed: onPreviewPressed,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1554D1),
                side: const BorderSide(
                  color: Color(0xFF1554D1),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                showPreview
                    ? 'Hide Consolidation Preview'
                    : 'Show Consolidation Preview',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          if (showPreview) ...[
            const SizedBox(height: 20),
            _consolidationPreview(hasStudents: hasStudents),
          ],
        ],
      ),
    );
  }

  Widget _consolidationPreview({
    required bool hasStudents,
  }) {
    if (!hasStudents) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          children: [
            const Icon(
              Icons.folder_open_outlined,
              size: 32,
              color: Color(0xFF9CA3AF),
            ),
            const SizedBox(height: 8),
            const Text(
              'Consolidated Student Records',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'No student records available yet.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      );
    }

    final students = [
      {
        'number': '1',
        'name': 'Juan Dela Cruz',
        'lrn': '123456789012',
        'filipino': '88',
        'english': '90',
        'math': '85',
        'science': '87',
        'average': '88.50',
        'status': 'On Track',
      },
      {
        'number': '2',
        'name': 'Maria Santos',
        'lrn': '123456789013',
        'filipino': '72',
        'english': '68',
        'math': '65',
        'science': '70',
        'average': '71.75',
        'status': 'At Risk',
      },
      {
        'number': '3',
        'name': 'Pedro Garcia',
        'lrn': '123456789014',
        'filipino': '62',
        'english': '60',
        'math': '61',
        'science': '63',
        'average': '65.00',
        'status': 'Needs Intervention',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Consolidated Student Records',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFFE5E7EB),
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columnSpacing: 18,
              horizontalMargin: 12,
              headingRowHeight: 46,
              dataRowMinHeight: 64,
              dataRowMaxHeight: 72,
              headingRowColor: WidgetStateProperty.all(
                const Color(0xFFF8FAFC),
              ),
              columns: const [
                DataColumn(
                  label: Text(
                    '#',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Student',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Filipino',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'English',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Math',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Science',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Average',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Status',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
              rows: students.map((student) {
                return DataRow(
                  cells: [
                    DataCell(
                      Text(
                        student['number']!,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    DataCell(
                      SizedBox(
                        width: 150,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              student['name']!,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'LRN: ${student['lrn']}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    DataCell(Text(student['filipino']!)),
                    DataCell(Text(student['english']!)),
                    DataCell(Text(student['math']!)),
                    DataCell(Text(student['science']!)),
                    DataCell(
                      Text(
                        student['average']!,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    DataCell(
                      _statusChip(student['status']!),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _statusChip(String status) {
    Color backgroundColor;
    Color textColor;

    if (status == 'On Track') {
      backgroundColor = const Color(0xFFE8F5E9);
      textColor = const Color(0xFF2E7D32);
    } else if (status == 'At Risk') {
      backgroundColor = const Color(0xFFFFF4E5);
      textColor = const Color(0xFFE67E22);
    } else {
      backgroundColor = const Color(0xFFFFE8E8);
      textColor = const Color(0xFFD32F2F);
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _summaryItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }

  Widget _timeline(String status) {
    final steps = [
      'Draft',
      'Validated',
      'Submitted',
      'Under Review',
      'Approved',
    ];

    int activeIndex;

    switch (status) {
      case 'draft':
        activeIndex = 0;
        break;
      case 'submitted':
        activeIndex = 2;
        break;
      case 'under_review':
        activeIndex = 3;
        break;
      case 'approved':
        activeIndex = 4;
        break;
      default:
        activeIndex = 0;
    }

    return Column(
      children: [
        Row(
          children: List.generate(
            steps.length,
            (index) {
              return Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: index <= activeIndex
                            ? const Color(0xFF1554D1)
                            : const Color(0xFFE5E7EB),
                      ),
                      child: index <= activeIndex
                          ? const Icon(
                              Icons.check,
                              size: 14,
                              color: Colors.white,
                            )
                          : null,
                    ),
                    if (index < steps.length - 1)
                      Expanded(
                        child: Container(
                          height: 2,
                          color: index < activeIndex
                              ? const Color(0xFF1554D1)
                              : const Color(0xFFE5E7EB),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: steps.map(
            (step) {
              return Expanded(
                child: Text(
                  step,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 9,
                    color: Color(0xFF6B7280),
                  ),
                ),
              );
            },
          ).toList(),
        ),
      ],
    );
  }
}