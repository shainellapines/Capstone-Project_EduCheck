import 'package:flutter/material.dart';

import 'principal_approval_screen.dart';
import 'principal_analytics_screen.dart';
import 'principal_sf10_preview_screen.dart';
import '../shared/notification_screen.dart';

class PrincipalDashboardScreen extends StatefulWidget {
  const PrincipalDashboardScreen({super.key});

  @override
  State<PrincipalDashboardScreen> createState() =>
      _PrincipalDashboardScreenState();
}

class _PrincipalDashboardScreenState
    extends State<PrincipalDashboardScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  int selectedIndex = 0;

  final List<Map<String, dynamic>> records = [
    {
      'section': 'Grade 6 - Sampaguita',
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'adviser': 'Maria Santos',
      'students': 3,
      'status': 'Pending Approval',
      'submitted': 'April 8, 2026 at 10:30 AM',
    },
    {
      'section': 'Grade 5 - Gumamela',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'adviser': 'Liza Cruz',
      'students': 2,
      'status': 'Approved',
      'submitted': 'April 7, 2026 at 2:15 PM',
    },
    {
      'section': 'Grade 6 - Rosal',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'adviser': 'Ana Reyes',
      'students': 3,
      'status': 'Returned',
      'submitted': 'April 6, 2026 at 9:20 AM',
    },
  ];

  void selectNavigation(int index) {
    if (index == 1) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PrincipalApprovalScreen(),
        ),
      );
      return;
    }

    if (index == 2) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PrincipalAnalyticsScreen(),
        ),
      );
      return;
    }

    setState(() {
      selectedIndex = index;
    });
  }

  void openNotifications() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return _buildNotificationPreview();
      },
    );
  }

  void openNotificationHistory() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NotificationScreen(),
      ),
    );
  }

  void logOut() {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/login',
      (route) => false,
    );
  }

  void showRecordDetails(
    Map<String, dynamic> record,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              20,
              12,
              20,
              24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1D5DB),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Record Details',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 18),
                _buildDetailRow(
                  'Section',
                  record['section'],
                ),
                _buildDetailRow(
                  'Quarter',
                  record['quarter'],
                ),
                _buildDetailRow(
                  'School Year',
                  record['schoolYear'],
                ),
                _buildDetailRow(
                  'Adviser',
                  record['adviser'],
                ),
                _buildDetailRow(
                  'Students',
                  '${record['students']} students',
                ),
                _buildDetailRow(
                  'Status',
                  record['status'],
                ),
                _buildDetailRow(
                  'Submitted',
                  record['submitted'],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              PrincipalSf10PreviewScreen(
                            record: record,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(
                      Icons.description_outlined,
                      size: 17,
                    ),
                    label: const Text(
                      'View SF10 Preview',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: secondaryTextColor,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void approveRecord(
    Map<String, dynamic> record,
  ) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          title: const Text(
            'Approve Record',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          content: Text(
            'Are you sure you want to approve the ${record['quarter']} record for ${record['section']}?',
            style: const TextStyle(
              fontSize: 13,
              color: secondaryTextColor,
              height: 1.4,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: secondaryTextColor,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  record['status'] = 'Approved';
                });

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Record approved successfully.',
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Approve'),
            ),
          ],
        );
      },
    );
  }

  void returnRecord(
    Map<String, dynamic> record,
  ) {
    final TextEditingController reasonController =
        TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          title: const Text(
            'Return Record',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter a reason for returning this record.',
                style: TextStyle(
                  fontSize: 12,
                  color: secondaryTextColor,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Reason',
                  hintStyle: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF94A3B8),
                  ),
                  filled: true,
                  fillColor: backgroundColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: primaryBlue,
                    ),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: secondaryTextColor,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  record['status'] = 'Returned';
                });

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Record returned for revision.',
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Return'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      drawer: _buildDrawer(),
      body: SafeArea(
        child: _buildDashboard(),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildDashboard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        16,
        12,
        16,
        24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          _buildWelcomeCard(),
          const SizedBox(height: 24),
          _buildSectionTitle(
            'Principal Dashboard',
            'Overview of school records and approvals.',
          ),
          const SizedBox(height: 12),
          _buildOverviewCards(),
          const SizedBox(height: 24),
          _buildSectionTitle(
            'Pending Approval',
            'Records waiting for your review.',
          ),
          const SizedBox(height: 12),
          _buildPendingApproval(),
          const SizedBox(height: 24),
          _buildSectionTitle(
            'Academic Snapshot',
            'Current record submission progress.',
          ),
          const SizedBox(height: 12),
          _buildAcademicSnapshot(),
          const SizedBox(height: 24),
          _buildSectionTitle(
            'Recent Records',
            'Latest submitted school records.',
          ),
          const SizedBox(height: 12),
          _buildRecentRecords(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Builder(
          builder: (context) {
            return Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                ),
              ),
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: const Icon(
                  Icons.menu_rounded,
                  color: textColor,
                  size: 21,
                ),
                onPressed: () {
                  Scaffold.of(context).openDrawer();
                },
              ),
            );
          },
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'EduCheck',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Principal',
                style: TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
        GestureDetector(
          onTap: openNotifications,
          child: Stack(
            clipBehavior: Clip.none,
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
                  Icons.notifications_none_rounded,
                  color: textColor,
                  size: 21,
                ),
              ),
              Positioned(
                right: -1,
                top: -1,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDC2626),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      '3',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: primaryBlue,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.school_outlined,
              color: Colors.white,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Good day, Principal!',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Review school records and monitor submission progress.',
                  style: TextStyle(
                    fontSize: 10,
                    height: 1.4,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(
    String title,
    String subtitle,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 11,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildOverviewCards() {
    return Row(
      children: [
        Expanded(
          child: _buildOverviewCard(
            icon: Icons.pending_actions_rounded,
            title: 'Pending',
            value: '1',
            iconColor: const Color(0xFFD97706),
            iconBackground: const Color(0xFFFFF7ED),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildOverviewCard(
            icon: Icons.check_circle_outline_rounded,
            title: 'Approved',
            value: '6',
            iconColor: const Color(0xFF16A34A),
            iconBackground: const Color(0xFFF0FDF4),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildOverviewCard(
            icon: Icons.assignment_return_outlined,
            title: 'Returned',
            value: '1',
            iconColor: const Color(0xFFDC2626),
            iconBackground: const Color(0xFFFEF2F2),
          ),
        ),
      ],
    );
  }

  Widget _buildOverviewCard({
    required IconData icon,
    required String title,
    required String value,
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
        crossAxisAlignment: CrossAxisAlignment.start,
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
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(
              fontSize: 9,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingApproval() {
    final pendingRecords = records
        .where(
          (record) =>
              record['status'] == 'Pending Approval',
        )
        .toList();

    if (pendingRecords.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFE2E8F0),
          ),
        ),
        child: const Column(
          children: [
            Icon(
              Icons.check_circle_outline_rounded,
              color: Color(0xFF16A34A),
              size: 34,
            ),
            SizedBox(height: 8),
            Text(
              'No pending approvals',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
            SizedBox(height: 3),
            Text(
              'All submitted records have been reviewed.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                color: secondaryTextColor,
              ),
            ),
          ],
        ),
      );
    }

    final record = pendingRecords.first;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFFDE68A),
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
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(
                  Icons.fact_check_outlined,
                  color: Color(0xFFD97706),
                  size: 21,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record['section'],
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${record['quarter']} • ${record['schoolYear']}',
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
                  horizontal: 8,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(7),
                ),
                child: const Text(
                  'Pending',
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFD97706),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(
            height: 1,
            color: Color(0xFFE2E8F0),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.person_outline_rounded,
                size: 15,
                color: secondaryTextColor,
              ),
              const SizedBox(width: 5),
              Text(
                record['adviser'],
                style: const TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
              const SizedBox(width: 14),
              const Icon(
                Icons.groups_outlined,
                size: 15,
                color: secondaryTextColor,
              ),
              const SizedBox(width: 5),
              Text(
                '${record['students']} students',
                style: const TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    returnRecord(record);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFDC2626),
                    side: const BorderSide(
                      color: Color(0xFFFCA5A5),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(
                      vertical: 11,
                    ),
                  ),
                  child: const Text(
                    'Return',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    approveRecord(record);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(
                      vertical: 11,
                    ),
                  ),
                  child: const Text(
                    'Approve',
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

  Widget _buildAcademicSnapshot() {
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
        children: [
          const Row(
            children: [
              Expanded(
                child: _SnapshotItem(
                  label: 'Submitted',
                  value: '8',
                ),
              ),
              Expanded(
                child: _SnapshotItem(
                  label: 'Approved',
                  value: '6',
                ),
              ),
              Expanded(
                child: _SnapshotItem(
                  label: 'Pending',
                  value: '2',
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Row(
            children: [
              Expanded(
                child: Text(
                  'Approval Progress',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),
              ),
              Text(
                '80%',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const ClipRRect(
            borderRadius: BorderRadius.all(
              Radius.circular(10),
            ),
            child: LinearProgressIndicator(
              value: 0.8,
              minHeight: 7,
              backgroundColor: Color(0xFFEAF1FF),
              valueColor: AlwaysStoppedAnimation<Color>(
                primaryBlue,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                selectNavigation(2);
              },
              style: TextButton.styleFrom(
                foregroundColor: primaryBlue,
                padding: EdgeInsets.zero,
              ),
              child: const Text(
                'View Analytics',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentRecords() {
    return Column(
      children: records.map((record) {
        return Padding(
          padding: const EdgeInsets.only(
            bottom: 10,
          ),
          child: _buildRecordCard(record),
        );
      }).toList(),
    );
  }

  Widget _buildRecordCard(
    Map<String, dynamic> record,
  ) {
    final String status = record['status'];

    Color statusColor;
    Color statusBackground;
    IconData statusIcon;

    if (status == 'Approved') {
      statusColor = const Color(0xFF16A34A);
      statusBackground = const Color(0xFFF0FDF4);
      statusIcon = Icons.check_circle_outline_rounded;
    } else if (status == 'Returned') {
      statusColor = const Color(0xFFDC2626);
      statusBackground = const Color(0xFFFEF2F2);
      statusIcon = Icons.assignment_return_outlined;
    } else {
      statusColor = const Color(0xFFD97706);
      statusBackground = const Color(0xFFFFF7ED);
      statusIcon = Icons.pending_actions_rounded;
    }

    return GestureDetector(
      onTap: () {
        showRecordDetails(record);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
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
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF1FF),
                borderRadius: BorderRadius.circular(11),
              ),
              child: const Icon(
                Icons.description_outlined,
                color: primaryBlue,
                size: 20,
              ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    record['section'],
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${record['quarter']} • ${record['schoolYear']}',
                    style: const TextStyle(
                      fontSize: 9,
                      color: secondaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    record['adviser'],
                    style: const TextStyle(
                      fontSize: 9,
                      color: secondaryTextColor,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: statusBackground,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        statusIcon,
                        size: 12,
                        color: statusColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        status,
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: Color(0xFF94A3B8),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationPreview() {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        20,
        12,
        20,
        24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFD1D5DB),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Notifications',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    openNotificationHistory();
                  },
                  child: const Text(
                    'View all',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: primaryBlue,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _buildPreviewNotification(
              icon: Icons.fact_check_outlined,
              iconColor: const Color(0xFFD97706),
              iconBackground: const Color(0xFFFFF7ED),
              title: 'Record Ready for Review',
              message:
                  'Grade 6 - Sampaguita is ready for your review.',
              time: '10 min ago',
            ),
            const SizedBox(height: 10),
            _buildPreviewNotification(
              icon: Icons.warning_amber_rounded,
              iconColor: const Color(0xFFDC2626),
              iconBackground: const Color(0xFFFEF2F2),
              title: 'Student Needs Attention',
              message:
                  'A student has been identified as needing intervention.',
              time: '1 hour ago',
            ),
            const SizedBox(height: 10),
            _buildPreviewNotification(
              icon: Icons.check_circle_outline_rounded,
              iconColor: const Color(0xFF16A34A),
              iconBackground: const Color(0xFFF0FDF4),
              title: 'Validation Completed',
              message:
                  'Grade 6 - Sampaguita passed validation.',
              time: '3 hours ago',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewNotification({
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
    required String title,
    required String message,
    required String time,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 19,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 9,
                    color: secondaryTextColor,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  time,
                  style: const TextStyle(
                    fontSize: 8,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(
                20,
                24,
                20,
                22,
              ),
              color: primaryBlue,
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 27,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.school_rounded,
                      color: primaryBlue,
                      size: 28,
                    ),
                  ),
                  SizedBox(height: 13),
                  Text(
                    'EduCheck',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Principal',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(
                Icons.home_outlined,
                color: textColor,
              ),
              title: const Text(
                'Dashboard',
                style: TextStyle(
                  fontSize: 13,
                  color: textColor,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  selectedIndex = 0;
                });
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.fact_check_outlined,
                color: textColor,
              ),
              title: const Text(
                'Approvals',
                style: TextStyle(
                  fontSize: 13,
                  color: textColor,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                selectNavigation(1);
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.notifications_none_rounded,
                color: textColor,
              ),
              title: const Text(
                'Notification History',
                style: TextStyle(
                  fontSize: 13,
                  color: textColor,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                openNotificationHistory();
              },
            ),
            const Spacer(),
            const Divider(
              color: Color(0xFFE2E8F0),
            ),
            ListTile(
              leading: const Icon(
                Icons.logout_rounded,
                color: Color(0xFFDC2626),
              ),
              title: const Text(
                'Log Out',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFFDC2626),
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: logOut,
            ),
            const SizedBox(height: 8),
          ],
        ),
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
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            10,
            8,
            10,
            8,
          ),
          child: Row(
            children: List.generate(
              labels.length,
              (index) {
                final bool isSelected =
                    selectedIndex == index;

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
                        vertical: 8,
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
                            size: 20,
                            color: isSelected
                                ? primaryBlue
                                : secondaryTextColor,
                          ),
                          const SizedBox(height: 4),
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
      ),
    );
  }
}

class _SnapshotItem extends StatelessWidget {
  final String label;
  final String value;

  const _SnapshotItem({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}