import 'package:flutter/material.dart';
import 'admin_dashboard_screen.dart';
import 'user_management_screen.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  int selectedReportType = 0;

  String selectedGrade = 'All';
  String selectedSection = 'All';
  String selectedQuarter = 'All';
  String selectedStatus = 'All';

  bool showPreview = false;

  final List<Map<String, dynamic>> records = [
    {
      'id': '2',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Maria Santos',
      'students': 3,
      'status': 'SUBMITTED',
      'date': '4/8/2026',
    },
    {
      'id': '1',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Maria Santos',
      'students': 0,
      'status': 'DRAFT',
      'date': '-',
    },
  ];

  final List<Map<String, dynamic>> sectionAnalytics = [
    {
      'section': 'Grade 6 - Sampaguita',
      'submitted': 3,
      'total': 3,
      'completion': 1.0,
      'status': 'Complete',
    },
    {
      'section': 'Grade 6 - Rosal',
      'submitted': 2,
      'total': 3,
      'completion': 0.67,
      'status': 'Outstanding',
    },
    {
      'section': 'Grade 5 - Gumamela',
      'submitted': 2,
      'total': 2,
      'completion': 1.0,
      'status': 'Complete',
    },
    {
      'section': 'Grade 5 - Santan',
      'submitted': 1,
      'total': 2,
      'completion': 0.50,
      'status': 'Outstanding',
    },
  ];

  final List<Map<String, dynamic>> outstandingRecords = [
    {
      'quarter': '3rd Quarter',
      'section': 'Grade 6 - Rosal',
      'teacher': 'Ana Reyes',
      'status': 'Needs Revision',
    },
    {
      'quarter': '3rd Quarter',
      'section': 'Grade 5 - Santan',
      'teacher': 'Juan Dela Cruz',
      'status': 'Draft',
    },
    {
      'quarter': '2nd Quarter',
      'section': 'Grade 6 - Rosal',
      'teacher': 'Ana Reyes',
      'status': 'Under Review',
    },
  ];

  List<Map<String, dynamic>> get filteredRecords {
    return records.where((record) {
      final gradeMatch =
          selectedGrade == 'All' || record['grade'] == selectedGrade;

      final sectionMatch =
          selectedSection == 'All' || record['section'] == selectedSection;

      final quarterMatch =
          selectedQuarter == 'All' || record['quarter'] == selectedQuarter;

      final statusMatch =
          selectedStatus == 'All' || record['status'] == selectedStatus;

      return gradeMatch && sectionMatch && quarterMatch && statusMatch;
    }).toList();
  }

  void navigateTo(int index) {
    if (index == 0) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const AdminDashboardScreen(),
        ),
      );
    } else if (index == 2) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const UserManagementScreen(),
        ),
      );
    }
  }

  void generatePreview() {
    setState(() {
      showPreview = true;
    });
  }

  void downloadPdf() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('PDF report is ready to download.'),
      ),
    );
  }

  void downloadExcel() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Excel report is ready to download.'),
      ),
    );
  }

  void printReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Print preview opened.'),
      ),
    );
  }

  Widget buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      color: Colors.white,
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.analytics_outlined,
              color: primaryBlue,
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Reports',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Academic analytics and reports',
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

  Widget buildBottomNavigation() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(
            color: borderColor,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, -2),
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
    final bool selected = index == 1;

    return Expanded(
      child: InkWell(
        onTap: () {
          navigateTo(index);
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 5,
              ),
              decoration: BoxDecoration(
                color: selected
                    ? const Color(0xFFEFF6FF)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                selected ? activeIcon : inactiveIcon,
                size: 21,
                color: selected ? primaryBlue : secondaryTextColor,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 9,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                color: selected ? primaryBlue : secondaryTextColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildPageHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Academic Analytics',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'View submission completion and outstanding records.',
          style: TextStyle(
            fontSize: 12,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget buildAnalyticsSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Submission Overview',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: buildSummaryCard(
                icon: Icons.percent_outlined,
                value: '75%',
                label: 'Completion Rate',
                color: primaryBlue,
                background: const Color(0xFFEFF6FF),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: buildSummaryCard(
                icon: Icons.school_outlined,
                value: '4',
                label: 'Sections',
                color: const Color(0xFF7C3AED),
                background: const Color(0xFFF5F3FF),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: buildSummaryCard(
                icon: Icons.check_circle_outline,
                value: '8',
                label: 'Completed',
                color: const Color(0xFF16A34A),
                background: const Color(0xFFF0FDF4),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: buildSummaryCard(
                icon: Icons.warning_amber_outlined,
                value: '3',
                label: 'Outstanding',
                color: const Color(0xFFD97706),
                background: const Color(0xFFFFF7ED),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget buildSummaryCard({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
    required Color background,
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
              color: background,
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 18,
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
          ),
        ],
      ),
    );
  }

  Widget buildCompletionRate() {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Completion by Section',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Submission completion rate for each section.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 16),
          ...sectionAnalytics.asMap().entries.map((entry) {
            final index = entry.key;
            final section = entry.value;

            return Padding(
              padding: EdgeInsets.only(
                bottom: index == sectionAnalytics.length - 1 ? 0 : 16,
              ),
              child: buildSectionProgress(
                section: section['section'],
                submitted: section['submitted'],
                total: section['total'],
                completion: section['completion'],
                status: section['status'],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget buildSectionProgress({
    required String section,
    required int submitted,
    required int total,
    required double completion,
    required String status,
  }) {
    final bool complete = status == 'Complete';

    final Color progressColor =
        complete ? const Color(0xFF16A34A) : primaryBlue;

    final Color statusColor =
        complete ? const Color(0xFF16A34A) : const Color(0xFFD97706);

    final Color statusBackground =
        complete ? const Color(0xFFF0FDF4) : const Color(0xFFFFF7ED);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                section,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
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
                color: statusBackground,
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
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: completion,
                  minHeight: 7,
                  backgroundColor: const Color(0xFFE2E8F0),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    progressColor,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '${(completion * 100).round()}%',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: progressColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        Text(
          '$submitted of $total records submitted',
          style: const TextStyle(
            fontSize: 9,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget buildOutstandingRecords() {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Outstanding Records',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '3 items',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFD97706),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Records that still need attention.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 14),
          ...outstandingRecords.asMap().entries.map((entry) {
            final index = entry.key;
            final record = entry.value;

            return Padding(
              padding: EdgeInsets.only(
                bottom:
                    index == outstandingRecords.length - 1 ? 0 : 10,
              ),
              child: buildOutstandingCard(
                quarter: record['quarter'],
                section: record['section'],
                teacher: record['teacher'],
                status: record['status'],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget buildOutstandingCard({
    required String quarter,
    required String section,
    required String teacher,
    required String status,
  }) {
    Color statusColor;
    Color statusBackground;

    switch (status) {
      case 'Needs Revision':
        statusColor = const Color(0xFFDC2626);
        statusBackground = const Color(0xFFFFEDED);
        break;
      case 'Under Review':
        statusColor = const Color(0xFFD97706);
        statusBackground = const Color(0xFFFFF7ED);
        break;
      default:
        statusColor = secondaryTextColor;
        statusBackground = const Color(0xFFF1F5F9);
    }

    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFBFC),
        borderRadius: BorderRadius.circular(13),
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
              color: statusBackground,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              Icons.description_outlined,
              size: 21,
              color: statusColor,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  quarter,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  section,
                  style: const TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  teacher,
                  style: const TextStyle(
                    fontSize: 9,
                    color: secondaryTextColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 8,
              vertical: 5,
            ),
            decoration: BoxDecoration(
              color: statusBackground,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status,
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w600,
                color: statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildReportGeneration() {
    final count = filteredRecords.length;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Report Generation',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Generate detailed academic record reports.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 16),
          buildReportTypes(),
          const SizedBox(height: 18),
          buildFilters(),
          const SizedBox(height: 18),
          Text(
            '$count record(s) match the selected filters',
            style: const TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: generatePreview,
              icon: const Icon(
                Icons.preview_outlined,
                size: 19,
              ),
              label: const Text(
                'Generate Preview',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildReportTypes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Report Type',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 10),
        buildReportTypeCard(
          index: 0,
          icon: Icons.assignment_outlined,
          title: 'Validated Academic Records',
          description: 'Complete list of validated and submitted records',
        ),
        const SizedBox(height: 8),
        buildReportTypeCard(
          index: 1,
          icon: Icons.analytics_outlined,
          title: 'Submission Status Summary',
          description: 'Overview of submission statuses across all records',
        ),
        const SizedBox(height: 8),
        buildReportTypeCard(
          index: 2,
          icon: Icons.people_outline,
          title: 'Teacher Submission Reports',
          description: 'Performance summary by teacher',
        ),
      ],
    );
  }

  Widget buildReportTypeCard({
    required int index,
    required IconData icon,
    required String title,
    required String description,
  }) {
    final isSelected = selectedReportType == index;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedReportType = index;
          showPreview = false;
        });
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFEFF6FF)
              : const Color(0xFFFAFBFC),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(
            color: isSelected ? primaryBlue : borderColor,
            width: isSelected ? 1.3 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(
                icon,
                color: primaryBlue,
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
                  const SizedBox(height: 3),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 9,
                      color: secondaryTextColor,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color: isSelected ? primaryBlue : const Color(0xFF94A3B8),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget buildFilters() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFBFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Filters',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
          const SizedBox(height: 14),
          buildDropdown(
            label: 'Grade Level',
            value: selectedGrade,
            items: const [
              'All',
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
                showPreview = false;
              });
            },
          ),
          const SizedBox(height: 12),
          buildDropdown(
            label: 'Section',
            value: selectedSection,
            items: const [
              'All',
              'Sampaguita',
              'Rosal',
              'Gumamela',
              'Dama de Noche',
              'Santan',
            ],
            onChanged: (value) {
              setState(() {
                selectedSection = value!;
                showPreview = false;
              });
            },
          ),
          const SizedBox(height: 12),
          buildDropdown(
            label: 'Quarter',
            value: selectedQuarter,
            items: const [
              'All',
              '1st Quarter',
              '2nd Quarter',
              '3rd Quarter',
              '4th Quarter',
            ],
            onChanged: (value) {
              setState(() {
                selectedQuarter = value!;
                showPreview = false;
              });
            },
          ),
          const SizedBox(height: 12),
          buildDropdown(
            label: 'Status',
            value: selectedStatus,
            items: const [
              'All',
              'DRAFT',
              'SUBMITTED',
              'UNDER REVIEW',
              'APPROVED',
              'RETURNED',
            ],
            onChanged: (value) {
              setState(() {
                selectedStatus = value!;
                showPreview = false;
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 11,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: borderColor,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: borderColor,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: primaryBlue,
                width: 1.3,
              ),
            ),
          ),
          icon: const Icon(
            Icons.keyboard_arrow_down,
            color: secondaryTextColor,
            size: 20,
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 11,
                  color: textColor,
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget buildReportPreview() {
    final previewRecords = filteredRecords;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Report Preview',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Preview the selected academic records.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              buildExportButton(
                icon: Icons.picture_as_pdf_outlined,
                label: 'PDF',
                onPressed: downloadPdf,
              ),
              buildExportButton(
                icon: Icons.table_chart_outlined,
                label: 'Excel',
                onPressed: downloadExcel,
              ),
              buildExportButton(
                icon: Icons.print_outlined,
                label: 'Print',
                onPressed: printReport,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (previewRecords.isEmpty)
            buildEmptyPreview()
          else
            buildPreviewTable(previewRecords),
        ],
      ),
    );
  }

  Widget buildExportButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(
        icon,
        size: 16,
      ),
      label: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryBlue,
        side: const BorderSide(
          color: primaryBlue,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: 9,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(9),
        ),
      ),
    );
  }

  Widget buildEmptyPreview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 32,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.description_outlined,
            size: 40,
            color: Color(0xFF94A3B8),
          ),
          SizedBox(height: 10),
          Text(
            'No records match the selected filters.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildPreviewTable(
    List<Map<String, dynamic>> previewRecords,
  ) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        border: Border.all(
          color: borderColor,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            const Color(0xFFF1F5F9),
          ),
          dataRowMinHeight: 55,
          dataRowMaxHeight: 68,
          columnSpacing: 20,
          headingTextStyle: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
          dataTextStyle: const TextStyle(
            fontSize: 10,
            color: textColor,
          ),
          columns: const [
            DataColumn(
              label: Text('ID'),
            ),
            DataColumn(
              label: Text('Grade'),
            ),
            DataColumn(
              label: Text('Section'),
            ),
            DataColumn(
              label: Text('Quarter'),
            ),
            DataColumn(
              label: Text('School Year'),
            ),
            DataColumn(
              label: Text('Teacher'),
            ),
            DataColumn(
              label: Text('Students'),
            ),
            DataColumn(
              label: Text('Status'),
            ),
            DataColumn(
              label: Text('Date'),
            ),
          ],
          rows: previewRecords.map((record) {
            final status = record['status'] as String;

            return DataRow(
              cells: [
                DataCell(
                  Text(
                    record['id'],
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                DataCell(Text(record['grade'])),
                DataCell(Text(record['section'])),
                DataCell(Text(record['quarter'])),
                DataCell(Text(record['schoolYear'])),
                DataCell(Text(record['teacher'])),
                DataCell(
                  Text(
                    record['students'].toString(),
                  ),
                ),
                DataCell(
                  buildStatusChip(status),
                ),
                DataCell(Text(record['date'])),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget buildStatusChip(String status) {
    Color background;
    Color foreground;

    switch (status) {
      case 'SUBMITTED':
        background = const Color(0xFFEFF6FF);
        foreground = primaryBlue;
        break;

      case 'APPROVED':
        background = const Color(0xFFF0FDF4);
        foreground = const Color(0xFF16A34A);
        break;

      case 'RETURNED':
        background = const Color(0xFFFFEDED);
        foreground = const Color(0xFFDC2626);
        break;

      case 'UNDER REVIEW':
        background = const Color(0xFFFFF7ED);
        foreground = const Color(0xFFD97706);
        break;

      default:
        background = const Color(0xFFF1F5F9);
        foreground = secondaryTextColor;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: foreground,
          fontSize: 9,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            buildHeader(),
            Expanded(
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
                    buildPageHeader(),

                    const SizedBox(height: 20),

                    buildAnalyticsSummary(),

                    const SizedBox(height: 24),

                    buildCompletionRate(),

                    const SizedBox(height: 16),

                    buildOutstandingRecords(),

                    const SizedBox(height: 24),

                    buildReportGeneration(),

                    if (showPreview) ...[
                      const SizedBox(height: 16),
                      buildReportPreview(),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: buildBottomNavigation(),
    );
  }
}