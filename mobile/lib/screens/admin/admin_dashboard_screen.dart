import 'package:flutter/material.dart';
import 'reports_screen.dart';
import 'user_management_screen.dart';
import '../shared/notification_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int selectedIndex = 0;

  String selectedGrade = 'All Grades';
  String selectedQuarter = 'All Quarters';
  String selectedStatus = 'All Status';
  String searchQuery = '';

  final List<Map<String, dynamic>> records = [
    {
      'section': 'Grade 6 - Sampaguita',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Maria Santos',
      'students': 0,
      'status': 'Draft',
      'submitted': '',
    },
    {
      'section': 'Grade 6 - Sampaguita',
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Maria Santos',
      'students': 3,
      'status': 'Submitted',
      'submitted': 'Submitted: 4/8/2026, 10:30:00 AM',
    },
  ];

  void openReports() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ReportsScreen(),
      ),
    );
  }

  void openUserManagement() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const UserManagementScreen(),
      ),
    );
  }

  void openNotifications() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          constraints: const BoxConstraints(
            maxHeight: 600,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 12, 12),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Notifications',
                        style: TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF101828),
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(
                        Icons.close_rounded,
                        color: Color(0xFF667085),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(
                height: 1,
                color: Color(0xFFE4E7EC),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  child: Column(
                    children: [
                      buildNotificationItem(
                        icon: Icons.check_circle_outline,
                        iconColor: const Color(0xFF16A34A),
                        iconBackground: const Color(0xFFEAF8EF),
                        title: 'Validation Complete',
                        message:
                            'Grade 6 - Sampaguita (2nd Quarter) has been validated successfully.',
                        date: '4/9/2026',
                        unread: true,
                      ),
                      const SizedBox(height: 10),
                      buildNotificationItem(
                        icon: Icons.access_time_rounded,
                        iconColor: const Color(0xFFD97706),
                        iconBackground: const Color(0xFFFFF7E6),
                        title: 'Submission Deadline Reminder',
                        message:
                            '3rd Quarter records are due on April 15, 2026.',
                        date: '4/10/2026',
                        unread: true,
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    const NotificationScreen(),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF1554D1),
                            side: const BorderSide(
                              color: Color(0xFF1554D1),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'View All Notifications',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget buildNotificationItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
    required String title,
    required String message,
    required String date,
    required bool unread,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: unread ? const Color(0xFFF8FAFC) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE4E7EC),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF101828),
                        ),
                      ),
                    ),
                    if (unread)
                      Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.only(
                          top: 5,
                          left: 6,
                        ),
                        decoration: const BoxDecoration(
                          color: Color(0xFF1554D1),
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    color: Color(0xFF667085),
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  date,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF98A2B3),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void openNotificationFromDrawer() {
    Navigator.pop(context);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NotificationScreen(),
      ),
    );
  }

  void showRecordDetails(Map<String, dynamic> record) {
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
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Record Details',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF202124),
                  ),
                ),
                const SizedBox(height: 20),
                _detailRow('Section', record['section']),
                _detailRow('Quarter', record['quarter']),
                _detailRow('School Year', record['schoolYear']),
                _detailRow('Teacher', record['teacher']),
                _detailRow(
                  'Students',
                  '${record['students']} students',
                ),
                _detailRow('Status', record['status']),
                if (record['submitted'].toString().isNotEmpty)
                  _detailRow('Submitted', record['submitted']),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1554D1),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Close',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
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

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 105,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF202124),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void approveRecord(int index) {
    setState(() {
      records[index]['status'] = 'Approved';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Record approved successfully.'),
        backgroundColor: Color(0xFF1554D1),
      ),
    );
  }

  void returnRecord(int index) {
    setState(() {
      records[index]['status'] = 'Returned';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Record returned for revision.'),
        backgroundColor: Color(0xFF1554D1),
      ),
    );
  }

  void handleNavigation(int index) {
    if (index == 0) {
      setState(() {
        selectedIndex = 0;
      });
      return;
    }

    if (index == 1) {
      openReports();
      return;
    }

    if (index == 2) {
      openUserManagement();
      return;
    }
  }

  Widget buildHeader() {
    return Builder(
      builder: (context) {
        return Container(
          height: 100,
          width: double.infinity,
          decoration: const BoxDecoration(
            color: Color(0xFF1554D1),
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      Scaffold.of(context).openDrawer();
                    },
                    icon: const Icon(
                      Icons.menu,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'EduCheck',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Academic Records',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      IconButton(
                        onPressed: openNotifications,
                        icon: const Icon(
                          Icons.notifications_none,
                          color: Colors.white,
                          size: 27,
                        ),
                      ),
                      Positioned(
                        right: 4,
                        top: 5,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF1554D1),
                              width: 2,
                            ),
                          ),
                          child: const Center(
                            child: Text(
                              '2',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget buildWelcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, Admin User',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF202124),
            ),
          ),
          SizedBox(height: 5),
          Text(
            'Administrator',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF666666),
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'School Year: 2025-2026',
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF777777),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF202124),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF777777),
          ),
        ),
      ],
    );
  }

  Widget buildSummaryCard(
    String title,
    String value,
    IconData icon,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 15,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: const Color(0xFF1554D1),
                size: 20,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF202124),
              ),
            ),
            const SizedBox(height: 3),
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF777777),
              ),
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }

  Widget buildFilters() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.filter_alt_outlined,
                color: Color(0xFF1554D1),
                size: 21,
              ),
              SizedBox(width: 8),
              Text(
                'Filters',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF202124),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            onChanged: (value) {
              setState(() {
                searchQuery = value;
              });
            },
            decoration: InputDecoration(
              labelText: 'Search Section',
              hintText: 'Search section...',
              prefixIcon: const Icon(
                Icons.search,
                color: Color(0xFF1554D1),
              ),
              filled: true,
              fillColor: const Color(0xFFF7F9FC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: Color(0xFF1554D1),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          buildDropdown(
            label: 'Grade Level',
            value: selectedGrade,
            items: const [
              'All Grades',
              'Grade 1',
              'Grade 2',
              'Grade 3',
              'Grade 4',
              'Grade 5',
              'Grade 6',
            ],
            onChanged: (value) {
              setState(() {
                selectedGrade = value!;
              });
            },
          ),
          const SizedBox(height: 14),
          buildDropdown(
            label: 'Quarter',
            value: selectedQuarter,
            items: const [
              'All Quarters',
              '1st Quarter',
              '2nd Quarter',
              '3rd Quarter',
              '4th Quarter',
            ],
            onChanged: (value) {
              setState(() {
                selectedQuarter = value!;
              });
            },
          ),
          const SizedBox(height: 14),
          buildDropdown(
            label: 'Status',
            value: selectedStatus,
            items: const [
              'All Status',
              'Submitted',
              'Under Review',
              'Approved',
              'Returned',
            ],
            onChanged: (value) {
              setState(() {
                selectedStatus = value!;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: const Color(0xFFF7F9FC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: Color(0xFF1554D1),
          ),
        ),
      ),
      icon: const Icon(
        Icons.keyboard_arrow_down,
        color: Color(0xFF1554D1),
      ),
      items: items.map((item) {
        return DropdownMenuItem<String>(
          value: item,
          child: Text(
            item,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF202124),
            ),
          ),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  Widget buildRecordCard(
    Map<String, dynamic> record,
    int index,
  ) {
    final String section = record['section'];
    final String quarter = record['quarter'];
    final String schoolYear = record['schoolYear'];
    final String teacher = record['teacher'];
    final int students = record['students'];
    final String status = record['status'];
    final String submitted = record['submitted'];

    final bool isSubmitted = status == 'Submitted';
    final bool isApproved = status == 'Approved';
    final bool isReturned = status == 'Returned';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.025),
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
                child: Text(
                  section,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF202124),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              buildStatusChip(status),
            ],
          ),
          const SizedBox(height: 7),
          Text(
            '$quarter • $schoolYear',
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF666666),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Teacher: $teacher • $students students',
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF666666),
            ),
          ),
          if (submitted.isNotEmpty) ...[
            const SizedBox(height: 7),
            Text(
              submitted,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF777777),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              if (isSubmitted) ...[
                Expanded(
                  child: SizedBox(
                    height: 42,
                    child: ElevatedButton(
                      onPressed: () {
                        approveRecord(index);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1554D1),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'Approve',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SizedBox(
                    height: 42,
                    child: OutlinedButton(
                      onPressed: () {
                        returnRecord(index);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF1554D1),
                        side: const BorderSide(
                          color: Color(0xFF1554D1),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'Return for Revision',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ] else if (isApproved) ...[
                Expanded(
                  child: Container(
                    height: 42,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF2FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Approved',
                      style: TextStyle(
                        color: Color(0xFF1554D1),
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ] else if (isReturned) ...[
                Expanded(
                  child: Container(
                    height: 42,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Color(0xFFFFF3F3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Returned for Revision',
                      style: TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ] else ...[
                Expanded(
                  child: Container(
                    height: 42,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Draft',
                      style: TextStyle(
                        color: Color(0xFF666666),
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(width: 8),
              SizedBox(
                height: 42,
                child: OutlinedButton(
                  onPressed: () {
                    showRecordDetails(record);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1554D1),
                    side: const BorderSide(
                      color: Color(0xFFD5DCE8),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'View Details',
                    style: TextStyle(
                      fontSize: 12,
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

  Widget buildStatusChip(String status) {
    Color backgroundColor;
    Color textColor;

    if (status == 'Submitted') {
      backgroundColor = const Color(0xFFEAF2FF);
      textColor = const Color(0xFF1554D1);
    } else if (status == 'Approved') {
      backgroundColor = const Color(0xFFEAF7EF);
      textColor = const Color(0xFF20844A);
    } else if (status == 'Returned') {
      backgroundColor = const Color(0xFFFFEEEE);
      textColor = Colors.red;
    } else {
      backgroundColor = const Color(0xFFF1F3F5);
      textColor = const Color(0xFF666666);
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
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget buildHome() {
    final filteredRecords = records.where((record) {
      final String section = record['section'];
      final String quarter = record['quarter'];
      final String status = record['status'];

      final bool matchesSearch = section
          .toLowerCase()
          .contains(searchQuery.toLowerCase());

      final bool matchesGrade =
          selectedGrade == 'All Grades' ||
          section.startsWith(selectedGrade);

      final bool matchesQuarter =
          selectedQuarter == 'All Quarters' ||
          quarter == selectedQuarter;

      final bool matchesStatus =
          selectedStatus == 'All Status' ||
          status == selectedStatus;

      return matchesSearch &&
          matchesGrade &&
          matchesQuarter &&
          matchesStatus;
    }).toList();

    return Column(
      children: [
        buildHeader(),
        Expanded(
          child: RefreshIndicator(
            color: const Color(0xFF1554D1),
            onRefresh: () async {
              await Future.delayed(
                const Duration(milliseconds: 500),
              );
              setState(() {});
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(
                16,
                18,
                16,
                24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  buildWelcomeCard(),
                  const SizedBox(height: 22),
                  buildSectionTitle(
                    'Administrator Dashboard',
                    'Review and approve academic records',
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      buildSummaryCard(
                        'Total Records',
                        '2',
                        Icons.folder_copy_outlined,
                      ),
                      const SizedBox(width: 10),
                      buildSummaryCard(
                        'Pending Review',
                        '1',
                        Icons.pending_actions_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      buildSummaryCard(
                        'Approved',
                        '0',
                        Icons.check_circle_outline,
                      ),
                      const SizedBox(width: 10),
                      buildSummaryCard(
                        'Returned',
                        '0',
                        Icons.assignment_return_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  buildFilters(),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Submitted Records (2)',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF202124),
                          ),
                        ),
                      ),
                      if (filteredRecords.length != records.length)
                        Text(
                          '${filteredRecords.length} result${filteredRecords.length == 1 ? '' : 's'}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF777777),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (filteredRecords.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        vertical: 40,
                        horizontal: 20,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: const Column(
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 42,
                            color: Color(0xFF9CA3AF),
                          ),
                          SizedBox(height: 12),
                          Text(
                            'No records found',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF202124),
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Try changing your filters or search.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF777777),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ...filteredRecords.map((record) {
                      final int index = records.indexOf(record);
                      return buildRecordCard(
                        record,
                        index,
                      );
                    }),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget buildBottomNavigation() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(
            children: [
              buildNavItem(
                0,
                Icons.home_outlined,
                Icons.home,
                'Home',
              ),
              buildNavItem(
                1,
                Icons.bar_chart_outlined,
                Icons.bar_chart,
                'Reports',
              ),
              buildNavItem(
                2,
                Icons.people_outline,
                Icons.people,
                'User Management',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildNavItem(
    int index,
    IconData inactiveIcon,
    IconData activeIcon,
    String label,
  ) {
    final bool selected = selectedIndex == index;

    return Expanded(
      child: InkWell(
        onTap: () {
          handleNavigation(index);
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              selected ? activeIcon : inactiveIcon,
              size: 23,
              color: selected
                  ? const Color(0xFF1554D1)
                  : const Color(0xFF777777),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.w500,
                color: selected
                    ? const Color(0xFF1554D1)
                    : const Color(0xFF777777),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildDrawer() {
    return Drawer(
      backgroundColor: const Color(0xFFF7F9FC),
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
              decoration: const BoxDecoration(
                color: Color(0xFF1554D1),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.admin_panel_settings_outlined,
                      color: Color(0xFF1554D1),
                      size: 34,
                    ),
                  ),
                  SizedBox(height: 14),
                  Text(
                    'Admin User',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Administrator',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'School Year: 2025-2026',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            buildDrawerItem(
              icon: Icons.home_outlined,
              title: 'Dashboard',
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  selectedIndex = 0;
                });
              },
            ),
            buildDrawerItem(
              icon: Icons.bar_chart_outlined,
              title: 'Reports',
              onTap: () {
                Navigator.pop(context);
                openReports();
              },
            ),
            buildDrawerItem(
              icon: Icons.people_outline,
              title: 'User Management',
              onTap: () {
                Navigator.pop(context);
                openUserManagement();
              },
            ),
            buildDrawerItem(
              icon: Icons.notifications_none,
              title: 'Notification',
              onTap: openNotificationFromDrawer,
            ),
            const Spacer(),
            const Divider(
              height: 1,
              color: Color(0xFFE0E0E0),
            ),
            buildDrawerItem(
              icon: Icons.logout,
              title: 'Log out',
              color: Colors.red,
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacementNamed(
                  context,
                  '/login',
                );
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color color = const Color(0xFF333333),
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 20,
      ),
      leading: Icon(
        icon,
        color: color,
        size: 22,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: color,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      drawer: buildDrawer(),
      body: buildHome(),
      bottomNavigationBar: buildBottomNavigation(),
    );
  }
}