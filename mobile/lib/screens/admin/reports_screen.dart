import 'package:flutter/material.dart';
import 'admin_dashboard_screen.dart';
import 'user_management_screen.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
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
      height: 56,
      width: double.infinity,
      color: const Color(0xFF1554D1),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      alignment: Alignment.centerLeft,
      child: const Text(
        'Reports',
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
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
    final bool selected = index == 1;

    return Expanded(
      child: InkWell(
        onTap: () {
          navigateTo(index);
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

  Widget buildPageTitle() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Report Generation',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: Color(0xFF172033),
          ),
        ),
        SizedBox(height: 6),
        Text(
          'Generate and export academic record reports',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }

  Widget buildReportTypes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Report Type',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF172033),
          ),
        ),
        const SizedBox(height: 12),
        buildReportTypeCard(
          index: 0,
          icon: Icons.assignment_outlined,
          title: 'Validated Academic Records',
          description: 'Complete list of validated and submitted records',
        ),
        const SizedBox(height: 10),
        buildReportTypeCard(
          index: 1,
          icon: Icons.analytics_outlined,
          title: 'Submission Status Summary',
          description: 'Overview of submission statuses across all records',
        ),
        const SizedBox(height: 10),
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
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF1554D1)
                : const Color(0xFFE3E7EF),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: const Color(0xFF1554D1),
                size: 25,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF172033),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color: isSelected
                  ? const Color(0xFF1554D1)
                  : const Color(0xFF9CA3AF),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildFilters() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE3E7EF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Filter Options',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF172033),
            ),
          ),
          const SizedBox(height: 18),
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
          const SizedBox(height: 14),
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
          const SizedBox(height: 14),
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
          const SizedBox(height: 14),
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
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 13,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFFDDE3EC),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFFDDE3EC),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFF1554D1),
                width: 1.5,
              ),
            ),
          ),
          icon: const Icon(
            Icons.keyboard_arrow_down,
            color: Color(0xFF6B7280),
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF172033),
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget buildGenerateReport() {
    final count = filteredRecords.length;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE3E7EF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Generate Report',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF172033),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$count record(s) match the selected filters',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: generatePreview,
              icon: const Icon(
                Icons.preview_outlined,
                size: 21,
              ),
              label: const Text(
                'Generate Preview',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1554D1),
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

  Widget buildReportPreview() {
    final previewRecords = filteredRecords;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE3E7EF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Report Preview',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF172033),
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              buildExportButton(
                icon: Icons.picture_as_pdf_outlined,
                label: 'Download PDF',
                onPressed: downloadPdf,
              ),
              buildExportButton(
                icon: Icons.table_chart_outlined,
                label: 'Download Excel',
                onPressed: downloadExcel,
              ),
              buildExportButton(
                icon: Icons.print_outlined,
                label: 'Print',
                onPressed: printReport,
              ),
            ],
          ),
          const SizedBox(height: 18),
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
        size: 18,
      ),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF1554D1),
        side: const BorderSide(
          color: Color(0xFF1554D1),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 11,
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
        vertical: 35,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.description_outlined,
            size: 42,
            color: Color(0xFF9CA3AF),
          ),
          SizedBox(height: 10),
          Text(
            'No records match the selected filters.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildPreviewTable(List<Map<String, dynamic>> previewRecords) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        border: Border.all(
          color: const Color(0xFFDDE3EC),
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            const Color(0xFFF1F5F9),
          ),
          dataRowMinHeight: 58,
          dataRowMaxHeight: 70,
          columnSpacing: 22,
          headingTextStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF374151),
          ),
          dataTextStyle: const TextStyle(
            fontSize: 12,
            color: Color(0xFF374151),
          ),
          columns: const [
            DataColumn(
              label: Text('Record ID'),
            ),
            DataColumn(
              label: Text('Grade Level'),
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
                DataCell(Text(record['students'].toString())),
                DataCell(buildStatusChip(status)),
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
        background = const Color(0xFFE8F1FF);
        foreground = const Color(0xFF1554D1);
        break;
      case 'APPROVED':
        background = const Color(0xFFE8F7EE);
        foreground = const Color(0xFF15803D);
        break;
      case 'RETURNED':
        background = const Color(0xFFFFEDED);
        foreground = const Color(0xFFDC2626);
        break;
      case 'UNDER REVIEW':
        background = const Color(0xFFFFF7E6);
        foreground = const Color(0xFFB45309);
        break;
      default:
        background = const Color(0xFFF1F5F9);
        foreground = const Color(0xFF64748B);
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 9,
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
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

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
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildPageTitle(),
                    const SizedBox(height: 20),
                    buildReportTypes(),
                    const SizedBox(height: 24),
                    buildFilters(),
                    const SizedBox(height: 24),
                    buildGenerateReport(),
                    if (showPreview) ...[
                      const SizedBox(height: 28),
                      buildReportPreview(),
                    ],
                    const SizedBox(height: 30),
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