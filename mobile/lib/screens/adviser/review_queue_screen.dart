import 'package:flutter/material.dart';

import 'consolidated_records_screen.dart';

class ReviewQueueScreen extends StatelessWidget {
  const ReviewQueueScreen({super.key});

  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

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

            _buildSummaryCard(),

            const SizedBox(height: 24),

            const Text(
              'Records for Review',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),

            const SizedBox(height: 12),

            _buildRecordCard(
              context: context,
              gradeLevel: 'Grade 6 - Sampaguita',
              quarter: '3rd Quarter',
              schoolYear: 'SY 2025-2026',
              status: 'Pending Review',
              statusColor: const Color(0xFFD97706),
              statusBackgroundColor: const Color(0xFFFFF7ED),
              showReviewButton: true,
            ),

            const SizedBox(height: 10),

            _buildRecordCard(
              context: context,
              gradeLevel: 'Grade 6 - Sampaguita',
              quarter: '2nd Quarter',
              schoolYear: 'SY 2025-2026',
              status: 'Submitted',
              statusColor: const Color(0xFF16A34A),
              statusBackgroundColor: const Color(0xFFF0FDF4),
              showReviewButton: false,
            ),

            const SizedBox(height: 10),

            _buildRecordCard(
              context: context,
              gradeLevel: 'Grade 6 - Sampaguita',
              quarter: '1st Quarter',
              schoolYear: 'SY 2025-2026',
              status: 'Submitted',
              statusColor: const Color(0xFF16A34A),
              statusBackgroundColor: const Color(0xFFF0FDF4),
              showReviewButton: false,
            ),
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
          'Records',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'Review and manage academic records for your class.',
          style: TextStyle(
            fontSize: 12,
            color: secondaryTextColor,
          ),
        ),
      ],
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
          color: const Color(0xFFE2E8F0),
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
              Icons.fact_check_outlined,
              color: Color(0xFFD97706),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '1 record needs review',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Review submitted academic records before proceeding.',
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

  Widget _buildRecordCard({
    required BuildContext context,
    required String gradeLevel,
    required String quarter,
    required String schoolYear,
    required String status,
    required Color statusColor,
    required Color statusBackgroundColor,
    required bool showReviewButton,
  }) {
    final bool isPending = status == 'Pending Review';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPending
              ? const Color(0xFFFDE68A)
              : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: statusBackgroundColor,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  Icons.description_outlined,
                  color: statusColor,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      quarter,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      gradeLevel,
                      style: const TextStyle(
                        fontSize: 10,
                        color: secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: statusBackgroundColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Text(
            schoolYear,
            style: const TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),

          const SizedBox(height: 12),

          const Divider(
            height: 1,
            color: Color(0xFFE2E8F0),
          ),

          const SizedBox(height: 10),

          Row(
            children: [
              const Icon(
                Icons.people_outline_rounded,
                size: 17,
                color: secondaryTextColor,
              ),
              const SizedBox(width: 6),
              const Text(
                '3 Students',
                style: TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
              const Spacer(),
              if (showReviewButton)
                SizedBox(
                  height: 34,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              const ConsolidatedRecordsScreen(),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: primaryBlue,
                      side: const BorderSide(
                        color: primaryBlue,
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(9),
                      ),
                    ),
                    child: const Text(
                      'Review',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}