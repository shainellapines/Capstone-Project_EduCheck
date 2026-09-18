import 'package:flutter/material.dart';

class ValidationResultScreen extends StatelessWidget {
  const ValidationResultScreen({super.key});

  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);
  static const Color errorColor = Color(0xFFDC2626);
  static const Color warningColor = Color(0xFFD97706);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: backgroundColor,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildPageHeader(),
            const SizedBox(height: 20),
            _buildRecordCard(),
            const SizedBox(height: 20),
            _buildSummaryCard(),
            const SizedBox(height: 24),
            const Text(
              'Validation Issues',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 12),
            _buildIssueCard(
              icon: Icons.grade_outlined,
              title: 'Missing Grade',
              student: 'Juan Dela Cruz',
              field: 'Mathematics',
              value: 'No grade entered',
              reason:
                  'A grade is missing for this student in the submitted record.',
              color: errorColor,
              backgroundColor: const Color(0xFFFFF2F2),
            ),
            const SizedBox(height: 10),
            _buildIssueCard(
              icon: Icons.rule_outlined,
              title: 'Invalid Grade Value',
              student: 'Maria Santos',
              field: 'Mathematics',
              value: '105',
              reason:
                  'The entered grade is outside the allowed range of 0 to 100.',
              color: errorColor,
              backgroundColor: const Color(0xFFFFF2F2),
            ),
            const SizedBox(height: 10),
            _buildIssueCard(
              icon: Icons.person_off_outlined,
              title: 'Incomplete Student Information',
              student: 'Pedro Reyes',
              field: 'Student Information',
              value: 'Missing LRN',
              reason:
                  'The student record does not contain the required LRN information.',
              color: warningColor,
              backgroundColor: const Color(0xFFFFF8E8),
            ),
            const SizedBox(height: 10),
            _buildIssueCard(
              icon: Icons.content_copy_outlined,
              title: 'Duplicate Student Record',
              student: 'Ana Garcia',
              field: 'Student Record',
              value: 'Duplicate entry detected',
              reason:
                  'Another record with matching student information was found.',
              color: warningColor,
              backgroundColor: const Color(0xFFFFF8E8),
            ),
            const SizedBox(height: 20),
            _buildReadOnlyNotice(),
          ],
        ),
      ),
    );
  }

  Widget _buildPageHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Validation',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'View validation issues detected by the rule-based engine.',
          style: TextStyle(
            fontSize: 12,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildRecordCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.description_outlined,
              color: primaryBlue,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '3rd Quarter',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Mathematics • Grade 6 - Sampaguita',
                  style: TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'SY 2025-2026',
                  style: TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFFDE68A),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.warning_amber_rounded,
              color: warningColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '4 issues found',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'The rule-based validation engine flagged issues that need to be reviewed.',
                  style: TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIssueCard({
    required IconData icon,
    required String title,
    required String student,
    required String field,
    required String value,
    required String reason,
    required Color color,
    required Color backgroundColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 21,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildIssueDetail(
            label: 'Student',
            value: student,
          ),
          const SizedBox(height: 7),
          _buildIssueDetail(
            label: 'Field',
            value: field,
          ),
          const SizedBox(height: 7),
          _buildIssueDetail(
            label: 'Value',
            value: value,
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  color: color,
                  size: 16,
                ),
                const SizedBox(width: 7),
                Expanded(
                  child: Text(
                    reason,
                    style: const TextStyle(
                      fontSize: 10.5,
                      color: secondaryTextColor,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIssueDetail({
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 52,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReadOnlyNotice() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFD9E7FF),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.lock_outline_rounded,
            color: primaryBlue,
            size: 19,
          ),
          SizedBox(width: 9),
          Expanded(
            child: Text(
              'This screen is read-only. Fix the flagged issues through the EduCheck web platform.',
              style: TextStyle(
                fontSize: 11,
                color: textColor,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}