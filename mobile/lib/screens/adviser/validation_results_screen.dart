import 'package:flutter/material.dart';

class ValidationResultsScreen extends StatelessWidget {
  const ValidationResultsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: Column(
          children: [
            buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildTitle(),
                    const SizedBox(height: 20),
                    buildRecordCard(
                      context: context,
                      gradeLevel: 'Grade 6',
                      section: 'Sampaguita',
                      quarter: '3rd Quarter',
                      schoolYear: '2025-2026',
                      status: 'Draft',
                      completed: '0/0',
                      missing: '0',
                      invalid: '0',
                      duplicates: '0',
                      crossFile: '0',
                      ready: false,
                      submitted: false,
                    ),
                    const SizedBox(height: 18),
                    buildRecordCard(
                      context: context,
                      gradeLevel: 'Grade 6',
                      section: 'Sampaguita',
                      quarter: '2nd Quarter',
                      schoolYear: '2025-2026',
                      status: 'Submitted',
                      completed: '30/30',
                      missing: '0',
                      invalid: '0',
                      duplicates: '0',
                      crossFile: '0',
                      ready: true,
                      submitted: true,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildHeader() {
    return Container(
      height: 56,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      color: const Color(0xFF1554D1),
      alignment: Alignment.centerLeft,
      child: const Text(
        'Validation Results',
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget buildTitle() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Validation Results',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
        SizedBox(height: 5),
        Text(
          'Review validation status of your academic records',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF667085),
          ),
        ),
      ],
    );
  }

  Widget buildRecordCard({
    required BuildContext context,
    required String gradeLevel,
    required String section,
    required String quarter,
    required String schoolYear,
    required String status,
    required String completed,
    required String missing,
    required String invalid,
    required String duplicates,
    required String crossFile,
    required bool ready,
    required bool submitted,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
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
                      '$gradeLevel - $section',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF101828),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '$quarter • $schoolYear',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF667085),
                      ),
                    ),
                  ],
                ),
              ),
              buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: 20),
          buildValidationItem(
            icon: Icons.check_circle_rounded,
            iconColor: const Color(0xFF16A34A),
            iconBackground: const Color(0xFFEAF8EF),
            label: 'Completed',
            value: completed,
          ),
          const SizedBox(height: 10),
          buildValidationItem(
            icon: Icons.warning_amber_rounded,
            iconColor: const Color(0xFFD97706),
            iconBackground: const Color(0xFFFFF7E6),
            label: 'Missing',
            value: missing,
          ),
          const SizedBox(height: 10),
          buildValidationItem(
            icon: Icons.cancel_rounded,
            iconColor: const Color(0xFFDC2626),
            iconBackground: const Color(0xFFFEECEC),
            label: 'Invalid',
            value: invalid,
          ),
          const SizedBox(height: 10),
          buildValidationItem(
            icon: Icons.copy_rounded,
            iconColor: const Color(0xFFD97706),
            iconBackground: const Color(0xFFFFF7E6),
            label: 'Duplicates',
            value: duplicates,
          ),
          const SizedBox(height: 10),
          buildValidationItem(
            icon: Icons.sync_problem_rounded,
            iconColor: const Color(0xFFD97706),
            iconBackground: const Color(0xFFFFF7E6),
            label: 'Cross-File',
            value: crossFile,
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: ready
                  ? const Color(0xFFEAF8EF)
                  : const Color(0xFFFEECEC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: ready
                    ? const Color(0xFFBBF7D0)
                    : const Color(0xFFFECACA),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  ready
                      ? Icons.check_circle_rounded
                      : Icons.error_outline_rounded,
                  color: ready
                      ? const Color(0xFF16A34A)
                      : const Color(0xFFDC2626),
                  size: 23,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    submitted
                        ? 'Record Submitted'
                        : 'Submission Ready',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: ready
                          ? const Color(0xFF166534)
                          : const Color(0xFF991B1B),
                    ),
                  ),
                ),
                Text(
                  ready ? 'Ready' : 'Not Ready',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: ready
                        ? const Color(0xFF16A34A)
                        : const Color(0xFFDC2626),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (submitted)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.access_time_rounded,
                    color: Color(0xFF667085),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Submitted on',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF667085),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          '4/8/2026, 10:30:00 AM',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF344054),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          if (!submitted) ...[
            const SizedBox(height: 2),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Revise Record selected.',
                      ),
                    ),
                  );
                },
                icon: const Icon(
                  Icons.edit_outlined,
                  size: 18,
                ),
                label: const Text(
                  'Revise Record',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF1554D1),
                  side: const BorderSide(
                    color: Color(0xFF1554D1),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget buildStatusBadge(String status) {
    final bool isSubmitted = status == 'Submitted';

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 7,
      ),
      decoration: BoxDecoration(
        color: isSubmitted
            ? const Color(0xFFEAF8EF)
            : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: isSubmitted
              ? const Color(0xFF16A34A)
              : const Color(0xFF475467),
        ),
      ),
    );
  }

  Widget buildValidationItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
    required String label,
    required String value,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 11,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(11),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF344054),
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: value == '0'
                  ? const Color(0xFF667085)
                  : iconColor,
            ),
          ),
        ],
      ),
    );
  }
}