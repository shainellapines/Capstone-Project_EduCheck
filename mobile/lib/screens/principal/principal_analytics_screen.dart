import 'package:flutter/material.dart';

import 'principal_approval_screen.dart';
import 'principal_dashboard_screen.dart';

class PrincipalAnalyticsScreen extends StatefulWidget {
  const PrincipalAnalyticsScreen({super.key});

  @override
  State<PrincipalAnalyticsScreen> createState() =>
      _PrincipalAnalyticsScreenState();
}

class _PrincipalAnalyticsScreenState
    extends State<PrincipalAnalyticsScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  int selectedIndex = 2;

  void selectNavigation(int index) {
    if (index == 0) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PrincipalDashboardScreen(),
        ),
      );
      return;
    }

    if (index == 1) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PrincipalApprovalScreen(),
        ),
      );
      return;
    }

    setState(() {
      selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            16,
            12,
            16,
            24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPageHeader(),
              const SizedBox(height: 20),
              _buildSummary(),
              const SizedBox(height: 20),
              _buildApprovalProgress(),
              const SizedBox(height: 20),
              _buildGradePerformance(),
              const SizedBox(height: 20),
              _buildSubmissionStatus(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildPageHeader() {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
            ),
          ),
          child: const Icon(
            Icons.analytics_outlined,
            color: primaryBlue,
            size: 21,
          ),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Analytics',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'View academic record activity.',
                style: TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummary() {
    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            value: '9',
            label: 'Total',
            icon: Icons.description_outlined,
            iconColor: primaryBlue,
            iconBackground: const Color(0xFFEAF1FF),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildSummaryCard(
            value: '6',
            label: 'Approved',
            icon: Icons.check_circle_outline_rounded,
            iconColor: const Color(0xFF16A34A),
            iconBackground: const Color(0xFFF0FDF4),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildSummaryCard(
            value: '2',
            label: 'Pending',
            icon: Icons.pending_actions_rounded,
            iconColor: const Color(0xFFD97706),
            iconBackground: const Color(0xFFFFF7ED),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
    required String value,
    required String label,
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 18,
            ),
          ),
          const SizedBox(height: 9),
          Text(
            value,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 9,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApprovalProgress() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
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
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Overall Approval Progress',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
              ),
              const Text(
                '67%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: const LinearProgressIndicator(
              value: 0.67,
              minHeight: 8,
              backgroundColor: Color(0xFFEAF1FF),
              valueColor: AlwaysStoppedAnimation<Color>(
                primaryBlue,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '6 of 9 submitted records have been approved.',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradePerformance() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
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
            'Records by Grade',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 15),
          _buildGradeRow(
            grade: 'Grade 6',
            total: '5',
            approved: '4',
            progress: 0.80,
          ),
          const SizedBox(height: 15),
          _buildGradeRow(
            grade: 'Grade 5',
            total: '3',
            approved: '2',
            progress: 0.67,
          ),
        ],
      ),
    );
  }

  Widget _buildGradeRow({
    required String grade,
    required String total,
    required String approved,
    required double progress,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                grade,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                ),
              ),
            ),
            Text(
              '$approved/$total approved',
              style: const TextStyle(
                fontSize: 9,
                color: secondaryTextColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 7),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            minHeight: 7,
            backgroundColor: const Color(0xFFEAF1FF),
            valueColor: const AlwaysStoppedAnimation<Color>(
              primaryBlue,
            ),
            value: progress,
          ),
        ),
      ],
    );
  }

  Widget _buildSubmissionStatus() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
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
            'Submission Status',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 14),
          _buildStatusRow(
            icon: Icons.check_circle_outline_rounded,
            title: 'Approved',
            count: '6',
            color: const Color(0xFF16A34A),
            background: const Color(0xFFF0FDF4),
          ),
          const SizedBox(height: 9),
          _buildStatusRow(
            icon: Icons.pending_actions_rounded,
            title: 'Pending Approval',
            count: '2',
            color: const Color(0xFFD97706),
            background: const Color(0xFFFFF7ED),
          ),
          const SizedBox(height: 9),
          _buildStatusRow(
            icon: Icons.assignment_return_outlined,
            title: 'Returned',
            count: '1',
            color: const Color(0xFFDC2626),
            background: const Color(0xFFFEF2F2),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusRow({
    required IconData icon,
    required String title,
    required String count,
    required Color color,
    required Color background,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 11,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(11),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: color,
            size: 18,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
          Text(
            count,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    const labels = [
      'Home',
      'Approvals',
      'Analytics',
    ];

    const icons = [
      Icons.home_outlined,
      Icons.fact_check_outlined,
      Icons.bar_chart_outlined,
    ];

    return Container(
      height: 60,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          10,
          5,
          10,
          5,
        ),
        child: Row(
          children: List.generate(
            labels.length,
            (index) {
              final isSelected = selectedIndex == index;

              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    selectNavigation(index);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(
                      milliseconds: 180,
                    ),
                    padding: const EdgeInsets.symmetric(
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFEAF2FF)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          icons[index],
                          size: 19,
                          color: isSelected
                              ? primaryBlue
                              : secondaryTextColor,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          labels[index],
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.w500,
                            color: isSelected
                                ? primaryBlue
                                : secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}