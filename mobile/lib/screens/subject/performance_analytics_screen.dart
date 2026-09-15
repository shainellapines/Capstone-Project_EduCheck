import 'package:flutter/material.dart';

class PerformanceAnalyticsScreen extends StatefulWidget {
  const PerformanceAnalyticsScreen({super.key});

  @override
  State<PerformanceAnalyticsScreen> createState() =>
      _PerformanceAnalyticsScreenState();
}

class _PerformanceAnalyticsScreenState
    extends State<PerformanceAnalyticsScreen> {
  String? selectedRecord;

  final List<String> records = [
    'Grade 6 - Sampaguita (2nd Quarter, 2025-2026)',
  ];

  final List<Map<String, dynamic>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
      'average': 88.50,
      'mathematics': 85,
      'status': 'On Track',
    },
    {
      'name': 'Maria Santos',
      'lrn': '123456789013',
      'average': 71.75,
      'mathematics': 65,
      'status': 'At Risk',
      'intervention':
          'Additional reading exercises and vocabulary building activities',
    },
    {
      'name': 'Pedro Garcia',
      'lrn': '123456789014',
      'average': 65.00,
      'mathematics': 61,
      'status': 'Needs Intervention',
      'intervention':
          'Remedial sessions for English and Mathematics, parent consultation scheduled',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              height: 56,
              width: double.infinity,
              color: const Color(0xFF1554D1),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(
                      minWidth: 40,
                      minHeight: 40,
                    ),
                    icon: const Icon(
                      Icons.arrow_back,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'Performance Analytics',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildPageHeader(),
                    const SizedBox(height: 18),
                    buildSubjectLevelAnalytics(),
                    const SizedBox(height: 16),
                    if (selectedRecord == null)
                      buildEmptyState()
                    else
                      buildStudentPerformance(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildPageHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Student Performance & Intervention Dashboard',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          'View student performance in your assigned subject only',
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget buildSubjectLevelAnalytics() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Subject-Level Analytics',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            'Showing performance data for Mathematics only. For full class analytics, please contact your class adviser.',
            style: TextStyle(
              fontSize: 12,
              height: 1.4,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Select Record',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: selectedRecord,
            decoration: InputDecoration(
              hintText: 'Choose a record...',
              hintStyle: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFFD9E0EA),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFFD9E0EA),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFF1554D1),
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
            items: records.map((record) {
              return DropdownMenuItem<String>(
                value: record,
                child: Text(
                  record,
                  style: const TextStyle(
                    fontSize: 12,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                selectedRecord = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget buildEmptyState() {
    return Container(
      width: double.infinity,
      height: 330,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.description_outlined,
            size: 60,
            color: Colors.blueGrey.shade200,
          ),
          const SizedBox(height: 18),
          const Text(
            'No Record Selected',
            style: TextStyle(
              fontSize: 18,
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 30),
            child: Text(
              'Please select a record from the dropdown above to view performance analytics.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildStudentPerformance() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Individual Student Performance (${students.length} students)',
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Column(
          children: students.map((student) {
            return buildStudentCard(student);
          }).toList(),
        ),
      ],
    );
  }

  Widget buildStudentCard(Map<String, dynamic> student) {
    final String status = student['status'];

    final Color statusColor = status == 'On Track'
        ? const Color(0xFF16A34A)
        : status == 'At Risk'
            ? const Color(0xFFD89B00)
            : const Color(0xFFDC2626);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student['name'],
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'LRN: ${student['lrn']}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'General Average',
                    style: TextStyle(
                      fontSize: 9,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    student['average'].toStringAsFixed(2),
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1554D1),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: const Color(0xFFFAFBFD),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Mathematics',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ),
                Text(
                  '${student['mathematics']}',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1554D1),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 9,
              vertical: 5,
            ),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  status == 'On Track'
                      ? Icons.check_circle_outline
                      : status == 'At Risk'
                          ? Icons.warning_amber_outlined
                          : Icons.error_outline,
                  size: 14,
                  color: statusColor,
                ),
                const SizedBox(width: 5),
                Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          if (student['intervention'] != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFFFED7AA),
                ),
              ),
              child: Text(
                'Intervention: ${student['intervention']}',
                style: const TextStyle(
                  color: Color(0xFFC2410C),
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}