import 'package:flutter/material.dart';

import 'sf10_preview_screen.dart';

class SubmissionStatusScreen extends StatelessWidget {
  final String quarter;
  final String gradeLevel;
  final String schoolYear;
  final String status;
  final double progress;

  const SubmissionStatusScreen({
    super.key,
    required this.quarter,
    required this.gradeLevel,
    required this.schoolYear,
    required this.status,
    required this.progress,
  });

  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Submission Status',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(
          color: textColor,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildRecordHeader(),
            const SizedBox(height: 16),
            _buildStatusCard(),
            const SizedBox(height: 24),
            const Text(
              'Submission Workflow',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 12),
            _buildStep(
              'Uploaded',
              'Record was uploaded.',
              progress >= 0.15,
            ),
            _buildStep(
              'Consolidating',
              'Records are being consolidated.',
              progress >= 0.30,
            ),
            _buildStep(
              'Validating',
              'Record is being validated.',
              progress >= 0.45,
            ),
            _buildStep(
              'Needs Revision',
              'Corrections may be required.',
              false,
            ),
            _buildStep(
              'Ready',
              'Record is ready for submission.',
              progress >= 0.70,
            ),
            _buildStep(
              'Submitted',
              'Record has been submitted.',
              progress >= 0.85,
            ),
            _buildStep(
              'Approved',
              'Record has been approved.',
              progress >= 1.0,
              isLast: true,
            ),
            const SizedBox(height: 10),
            _buildSf10Button(context),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordHeader() {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            quarter,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Mathematics',
            style: TextStyle(
              fontSize: 12,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            gradeLevel,
            style: const TextStyle(
              fontSize: 12,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            schoolYear,
            style: const TextStyle(
              fontSize: 12,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    final Color statusColor;
    final Color statusBackgroundColor;

    if (status == 'Approved') {
      statusColor = const Color(0xFF16A34A);
      statusBackgroundColor = const Color(0xFFF0FDF4);
    } else if (status == 'Submitted') {
      statusColor = primaryBlue;
      statusBackgroundColor = const Color(0xFFEFF6FF);
    } else {
      statusColor = const Color(0xFFD97706);
      statusBackgroundColor = const Color(0xFFFFF7ED);
    }

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Current Status',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: statusBackgroundColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '${(progress * 100).round()}%',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 7,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation<Color>(
                statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep(
    String title,
    String description,
    bool completed, {
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: completed
                    ? primaryBlue
                    : const Color(0xFFE2E8F0),
                shape: BoxShape.circle,
              ),
              child: Icon(
                completed ? Icons.check : Icons.circle,
                size: completed ? 16 : 7,
                color: completed
                    ? Colors.white
                    : secondaryTextColor,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 42,
                color: completed
                    ? primaryBlue
                    : const Color(0xFFE2E8F0),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: completed
                        ? textColor
                        : secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 14),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSf10Button(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.description_outlined,
                color: primaryBlue,
                size: 20,
              ),
              SizedBox(width: 8),
              Text(
                'SF10 Permanent Record',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          const Text(
            'View the generated permanent record before formal submission.',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 38,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const Sf10PreviewScreen(),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              icon: const Icon(
                Icons.visibility_outlined,
                size: 17,
              ),
              label: const Text(
                'Preview SF10',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}