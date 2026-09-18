import 'package:flutter/material.dart';

import '../shared/notification_screen.dart';
import 'consolidated_records_screen.dart';
import 'submission_status_screen.dart';
import 'validation_result_screen.dart';

class SubjectDashboardScreen extends StatefulWidget {
  const SubjectDashboardScreen({super.key});

  @override
  State<SubjectDashboardScreen> createState() =>
      _SubjectDashboardScreenState();
}

class _SubjectDashboardScreenState extends State<SubjectDashboardScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  int selectedIndex = 0;

  final List<String> navigationLabels = [
    'Home',
    'Records',
    'Validation',
  ];

  final List<IconData> navigationIcons = [
    Icons.home_rounded,
    Icons.description_outlined,
    Icons.verified_outlined,
  ];

  static const List<Map<String, dynamic>> recentRecords = [
    {
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'section': 'Grade 6 - Sampaguita',
      'subject': 'Mathematics',
      'status': 'Validating',
      'date': 'Today, 10:32 AM',
      'progress': 0.60,
      'currentStep': 3,
    },
    {
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'section': 'Grade 6 - Sampaguita',
      'subject': 'Mathematics',
      'status': 'Submitted',
      'date': 'Sep 14, 2026',
      'progress': 0.85,
      'currentStep': 6,
    },
  ];

  void selectNavigation(int index) {
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
        return _buildNotificationBottomSheet();
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

  void openRecords() {
    setState(() {
      selectedIndex = 1;
    });
  }

  void openRecord(Map<String, dynamic> record) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SubmissionStatusScreen(
          quarter: record['quarter'] as String,
          gradeLevel: record['section'] as String,
          schoolYear: 'SY ${record['schoolYear']}',
          status: record['status'] as String,
          progress: record['progress'] as double,
        ),
      ),
    );
  }

  void openValidationResults() {
    setState(() {
      selectedIndex = 2;
    });
  }

  void openSubmissionStatus() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SubmissionStatusScreen(
          quarter: '3rd Quarter',
          gradeLevel: 'Grade 6 - Sampaguita',
          schoolYear: 'SY 2025-2026',
          status: 'Validating',
          progress: 0.60,
        ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      drawer: _buildDrawer(),
      body: SafeArea(
        child: selectedIndex == 0
            ? _buildDashboard()
            : selectedIndex == 1
                ? const ConsolidatedRecordsScreen()
                : const ValidationResultScreen(),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildDashboard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 18),
          _buildWelcomeCard(),
          const SizedBox(height: 22),
          _buildSectionTitle('Overview'),
          const SizedBox(height: 12),
          _buildOverview(),
          const SizedBox(height: 24),
          _buildRecentRecordsHeader(),
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
                  color: borderColor,
                ),
              ),
              child: IconButton(
                onPressed: () {
                  Scaffold.of(context).openDrawer();
                },
                padding: EdgeInsets.zero,
                icon: const Icon(
                  Icons.menu_rounded,
                  color: textColor,
                  size: 23,
                ),
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
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Subject Teacher Dashboard',
                style: TextStyle(
                  fontSize: 12,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: borderColor,
            ),
          ),
          child: Stack(
            children: [
              IconButton(
                onPressed: openNotifications,
                padding: EdgeInsets.zero,
                icon: const Icon(
                  Icons.notifications_none_rounded,
                  color: textColor,
                  size: 23,
                ),
              ),
              Positioned(
                right: 9,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFFEF4444),
                    shape: BoxShape.circle,
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: primaryBlue,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.16),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.menu_book_rounded,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Good day, Juan!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Subject Teacher • Mathematics',
                  style: TextStyle(
                    color: Color(0xFFDCE8FF),
                    fontSize: 12,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Grade 6 - Sampaguita',
                  style: TextStyle(
                    color: Color(0xFFDCE8FF),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
    );
  }

  Widget _buildOverview() {
    return Row(
      children: [
        Expanded(
          child: _buildOverviewCard(
            title: 'In Progress',
            value: '1',
            icon: Icons.sync_rounded,
            iconColor: const Color(0xFFD97706),
            backgroundColor: const Color(0xFFFFF7ED),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildOverviewCard(
            title: 'Needs Revision',
            value: '0',
            icon: Icons.warning_amber_rounded,
            iconColor: const Color(0xFFDC2626),
            backgroundColor: const Color(0xFFFFEEEE),
          ),
        ),
      ],
    );
  }

  Widget _buildOverviewCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color backgroundColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
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
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 21,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: iconColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
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

  Widget _buildRecentRecordsHeader() {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'Recent Records',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ),
        TextButton(
          onPressed: openRecords,
          style: TextButton.styleFrom(
            foregroundColor: primaryBlue,
            padding: const EdgeInsets.symmetric(
              horizontal: 4,
              vertical: 4,
            ),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'View All',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(width: 2),
              Icon(
                Icons.chevron_right_rounded,
                size: 17,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecentRecords() {
    return Column(
      children: recentRecords.map((record) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _buildRecentRecordItem(record),
        );
      }).toList(),
    );
  }

  Widget _buildRecentRecordItem(
    Map<String, dynamic> record,
  ) {
    final String status = record['status'] as String;
    final Color statusColor = _statusColor(status);
    final Color statusBackground = _statusLightColor(status);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          openRecord(record);
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: borderColor,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusBackground,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _statusIcon(status),
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
                      record['quarter'] as String,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${record['subject']} • ${record['section']}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: secondaryTextColor,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusBackground,
                            borderRadius: BorderRadius.circular(8),
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
                        const SizedBox(width: 8),
                        Text(
                          '${((record['progress'] as double) * 100).round()}%',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF94A3B8),
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Uploaded':
        return const Color(0xFF1554D1);
      case 'Consolidating':
        return const Color(0xFF7C3AED);
      case 'Validating':
        return const Color(0xFFF59E0B);
      case 'Needs Revision':
        return const Color(0xFFDC2626);
      case 'Ready':
        return const Color(0xFF0D9488);
      case 'Submitted':
        return const Color(0xFF4F46E5);
      case 'Approved':
        return const Color(0xFF16A34A);
      default:
        return secondaryTextColor;
    }
  }

  Color _statusLightColor(String status) {
    switch (status) {
      case 'Uploaded':
        return const Color(0xFFE8F0FF);
      case 'Consolidating':
        return const Color(0xFFF0E9FF);
      case 'Validating':
        return const Color(0xFFFFF5DD);
      case 'Needs Revision':
        return const Color(0xFFFFE9E9);
      case 'Ready':
        return const Color(0xFFE5F8F6);
      case 'Submitted':
        return const Color(0xFFEDEBFF);
      case 'Approved':
        return const Color(0xFFE8F8EC);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'Uploaded':
        return Icons.upload_file_rounded;
      case 'Consolidating':
        return Icons.merge_type_rounded;
      case 'Validating':
        return Icons.fact_check_rounded;
      case 'Needs Revision':
        return Icons.edit_note_rounded;
      case 'Ready':
        return Icons.task_alt_rounded;
      case 'Submitted':
        return Icons.send_rounded;
      case 'Approved':
        return Icons.verified_rounded;
      default:
        return Icons.circle_outlined;
    }
  }

  Widget _buildNotificationBottomSheet() {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
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
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF2FF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '2 unread',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: primaryBlue,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildNotificationPreview(
              icon: Icons.check_circle_outline_rounded,
              iconColor: const Color(0xFF16A34A),
              iconBackground: const Color(0xFFF0FDF4),
              title: 'Validation Complete',
              message:
                  'Grade 6 - Sampaguita 2nd Quarter records have been validated successfully.',
              time: '1 hour ago',
            ),
            const SizedBox(height: 10),
            _buildNotificationPreview(
              icon: Icons.sync_rounded,
              iconColor: const Color(0xFFD97706),
              iconBackground: const Color(0xFFFFF7ED),
              title: 'Submission Status Update',
              message:
                  '3rd Quarter Mathematics records are currently being validated.',
              time: '3 hours ago',
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(context);
                  openNotificationHistory();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: primaryBlue,
                  side: const BorderSide(
                    color: primaryBlue,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  'View All Notifications',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationPreview({
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
    required String title,
    required String message,
    required String time,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 21,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    height: 1.35,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  time,
                  style: const TextStyle(
                    fontSize: 9,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 7,
            height: 7,
            margin: const EdgeInsets.only(top: 4),
            decoration: const BoxDecoration(
              color: primaryBlue,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
              decoration: const BoxDecoration(
                color: primaryBlue,
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.person_rounded,
                      color: primaryBlue,
                      size: 30,
                    ),
                  ),
                  SizedBox(height: 14),
                  Text(
                    'Juan Dela Cruz',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Subject Teacher • Mathematics',
                    style: TextStyle(
                      color: Color(0xFFDCE8FF),
                      fontSize: 11,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Grade 6 - Sampaguita',
                    style: TextStyle(
                      color: Color(0xFFDCE8FF),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            _buildDrawerItem(
              icon: Icons.home_outlined,
              title: 'Home',
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  selectedIndex = 0;
                });
              },
            ),
            _buildDrawerItem(
              icon: Icons.description_outlined,
              title: 'Records',
              onTap: () {
                Navigator.pop(context);
                openRecords();
              },
            ),
            _buildDrawerItem(
              icon: Icons.notifications_none_rounded,
              title: 'Notification History',
              onTap: () {
                Navigator.pop(context);
                openNotificationHistory();
              },
            ),
            const Spacer(),
            const Divider(
              height: 1,
              color: borderColor,
            ),
            _buildDrawerItem(
              icon: Icons.logout_rounded,
              title: 'Log Out',
              iconColor: const Color(0xFFDC2626),
              textColor: const Color(0xFFDC2626),
              onTap: logOut,
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color iconColor = secondaryTextColor,
    Color textColor = _SubjectDashboardScreenState.textColor,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(
        icon,
        color: iconColor,
        size: 22,
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textColor,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 20,
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(
            color: borderColor,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 4,
            vertical: 6,
          ),
          child: Row(
            children: List.generate(
              navigationLabels.length,
              (index) {
                return Expanded(
                  child: _buildNavigationItem(
                    index: index,
                    label: navigationLabels[index],
                    icon: navigationIcons[index],
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavigationItem({
    required int index,
    required String label,
    required IconData icon,
  }) {
    final bool isSelected = selectedIndex == index;

    return GestureDetector(
      onTap: () {
        selectNavigation(index);
      },
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: 4,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 42,
              height: 30,
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0xFFEAF2FF)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                size: 21,
                color: isSelected
                    ? primaryBlue
                    : const Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 9,
                fontWeight:
                    isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected
                    ? primaryBlue
                    : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}