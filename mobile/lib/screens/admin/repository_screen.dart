import 'package:flutter/material.dart';

class RepositoryScreen extends StatefulWidget {
  const RepositoryScreen({super.key});

  @override
  State<RepositoryScreen> createState() => _RepositoryScreenState();
}

class _RepositoryScreenState extends State<RepositoryScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryText = Color(0xFF64748B);
  static const Color greenColor = Color(0xFF16A34A);
  static const Color orangeColor = Color(0xFFF59E0B);
  static const Color redColor = Color(0xFFDC2626);

  final TextEditingController searchController = TextEditingController();

  String selectedGrade = 'All Grades';
  String selectedSection = 'All Sections';
  String selectedQuarter = 'All Quarters';
  String selectedSchoolYear = 'All School Years';
  String selectedStatus = 'All Status';

  final List<Map<String, dynamic>> records = [
    {
      'id': 'REC-2026-0002',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Maria Santos',
      'students': 3,
      'status': 'Approved',
    },
    {
      'id': 'REC-2026-0001',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Maria Santos',
      'students': 0,
      'status': 'Draft',
    },
    {
      'id': 'REC-2026-0003',
      'grade': 'Grade 6',
      'section': 'Rosal',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Ana Reyes',
      'students': 3,
      'status': 'Needs Revision',
    },
    {
      'id': 'REC-2026-0004',
      'grade': 'Grade 5',
      'section': 'Gumamela',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Liza Cruz',
      'students': 2,
      'status': 'Approved',
    },
    {
      'id': 'REC-2026-0005',
      'grade': 'Grade 5',
      'section': 'Santan',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Juan Dela Cruz',
      'students': 2,
      'status': 'Draft',
    },
    {
      'id': 'REC-2026-0006',
      'grade': 'Grade 6',
      'section': 'Rosal',
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'teacher': 'Ana Reyes',
      'students': 3,
      'status': 'Under Review',
    },
  ];

  List<Map<String, dynamic>> get filteredRecords {
    final search = searchController.text.toLowerCase().trim();

    return records.where((record) {
      final matchesSearch =
          search.isEmpty ||
          record['id'].toString().toLowerCase().contains(search) ||
          record['teacher'].toString().toLowerCase().contains(search) ||
          record['grade'].toString().toLowerCase().contains(search) ||
          record['section'].toString().toLowerCase().contains(search) ||
          record['quarter'].toString().toLowerCase().contains(search);

      final matchesGrade =
          selectedGrade == 'All Grades' ||
          record['grade'] == selectedGrade;

      final matchesSection =
          selectedSection == 'All Sections' ||
          record['section'] == selectedSection;

      final matchesQuarter =
          selectedQuarter == 'All Quarters' ||
          record['quarter'] == selectedQuarter;

      final matchesSchoolYear =
          selectedSchoolYear == 'All School Years' ||
          record['schoolYear'] == selectedSchoolYear;

      final matchesStatus =
          selectedStatus == 'All Status' ||
          record['status'] == selectedStatus;

      return matchesSearch &&
          matchesGrade &&
          matchesSection &&
          matchesQuarter &&
          matchesSchoolYear &&
          matchesStatus;
    }).toList();
  }

  int get totalRecords => records.length;

  int get approvedRecords {
    return records.where((record) => record['status'] == 'Approved').length;
  }

  int get needsAction {
    return records.where(
      (record) =>
          record['status'] == 'Needs Revision' ||
          record['status'] == 'Under Review',
    ).length;
  }

  void clearFilters() {
    setState(() {
      searchController.clear();
      selectedGrade = 'All Grades';
      selectedSection = 'All Sections';
      selectedQuarter = 'All Quarters';
      selectedSchoolYear = 'All School Years';
      selectedStatus = 'All Status';
    });
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'Approved':
        return greenColor;
      case 'Needs Revision':
        return redColor;
      case 'Under Review':
        return orangeColor;
      case 'Draft':
        return secondaryText;
      default:
        return primaryBlue;
    }
  }

  Color getStatusBackground(String status) {
    switch (status) {
      case 'Approved':
        return const Color(0xFFEAF7EE);
      case 'Needs Revision':
        return const Color(0xFFFFEEEE);
      case 'Under Review':
        return const Color(0xFFFFF6E5);
      case 'Draft':
        return const Color(0xFFF1F5F9);
      default:
        return const Color(0xFFEAF1FF);
    }
  }

  Widget statusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: getStatusBackground(status),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: getStatusColor(status),
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget summaryCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFE7ECF3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withOpacity(0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: color,
                size: 20,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                color: secondaryText,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget filterDropdown({
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(
          color: const Color(0xFFE1E7EF),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: secondaryText,
          ),
          style: const TextStyle(
            fontSize: 12,
            color: textColor,
            fontWeight: FontWeight.w500,
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                overflow: TextOverflow.ellipsis,
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget recordCard(Map<String, dynamic> record) {
    return GestureDetector(
      onTap: () => showRecordDetails(record),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFE7ECF3),
          ),
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
                        record['id'],
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: primaryBlue,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${record['grade']} - ${record['section']}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                ),
                statusBadge(record['status']),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(
              height: 1,
              color: Color(0xFFE7ECF3),
            ),
            const SizedBox(height: 13),
            Row(
              children: [
                const Icon(
                  Icons.calendar_today_outlined,
                  size: 16,
                  color: secondaryText,
                ),
                const SizedBox(width: 6),
                Text(
                  '${record['quarter']} • ${record['schoolYear']}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: secondaryText,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 9),
            Row(
              children: [
                const Icon(
                  Icons.person_outline,
                  size: 17,
                  color: secondaryText,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    record['teacher'],
                    style: const TextStyle(
                      fontSize: 12,
                      color: secondaryText,
                    ),
                  ),
                ),
                const Icon(
                  Icons.groups_outlined,
                  size: 17,
                  color: secondaryText,
                ),
                const SizedBox(width: 5),
                Text(
                  '${record['students']} students',
                  style: const TextStyle(
                    fontSize: 12,
                    color: secondaryText,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void showRecordDetails(Map<String, dynamic> record) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(24),
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Record Details',
                            style: TextStyle(
                              fontSize: 21,
                              fontWeight: FontWeight.w700,
                              color: textColor,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            record['id'],
                            style: const TextStyle(
                              fontSize: 12,
                              color: primaryBlue,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    statusBadge(record['status']),
                  ],
                ),
                const SizedBox(height: 22),
                detailRow(
                  'Grade & Section',
                  '${record['grade']} - ${record['section']}',
                ),
                detailRow(
                  'Quarter',
                  record['quarter'],
                ),
                detailRow(
                  'School Year',
                  record['schoolYear'],
                ),
                detailRow(
                  'Teacher',
                  record['teacher'],
                ),
                detailRow(
                  'Students',
                  '${record['students']} students',
                ),
                detailRow(
                  'Status',
                  record['status'],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        vertical: 14,
                      ),
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

  Widget detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 105,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: secondaryText,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                color: textColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final displayedRecords = filteredRecords;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          onPressed: () {
            Navigator.pop(context);
          },
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: textColor,
          ),
        ),
        title: const Text(
          'Digital Repository',
          style: TextStyle(
            color: textColor,
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            16,
            4,
            16,
            24,
          ),
          children: [
            const Text(
              'Academic Records',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'Search and view submitted academic records.',
              style: TextStyle(
                fontSize: 13,
                color: secondaryText,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                summaryCard(
                  title: 'Total Records',
                  value: '$totalRecords',
                  icon: Icons.folder_copy_outlined,
                  color: primaryBlue,
                ),
                const SizedBox(width: 10),
                summaryCard(
                  title: 'Approved',
                  value: '$approvedRecords',
                  icon: Icons.check_circle_outline,
                  color: greenColor,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                summaryCard(
                  title: 'Needs Action',
                  value: '$needsAction',
                  icon: Icons.warning_amber_rounded,
                  color: orangeColor,
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: SizedBox(),
                ),
              ],
            ),
            const SizedBox(height: 22),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFE1E7EF),
                ),
              ),
              child: TextField(
                controller: searchController,
                onChanged: (_) {
                  setState(() {});
                },
                decoration: InputDecoration(
                  hintText: 'Search records...',
                  hintStyle: const TextStyle(
                    fontSize: 13,
                    color: secondaryText,
                  ),
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: secondaryText,
                  ),
                  suffixIcon: searchController.text.isNotEmpty
                      ? IconButton(
                          onPressed: () {
                            searchController.clear();
                            setState(() {});
                          },
                          icon: const Icon(
                            Icons.close_rounded,
                            size: 20,
                            color: secondaryText,
                          ),
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(
                  Icons.tune_rounded,
                  size: 18,
                  color: textColor,
                ),
                const SizedBox(width: 7),
                const Text(
                  'Filters',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: clearFilters,
                  child: const Text(
                    'Clear All',
                    style: TextStyle(
                      color: primaryBlue,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            filterDropdown(
              value: selectedGrade,
              items: const [
                'All Grades',
                'Grade 5',
                'Grade 6',
              ],
              onChanged: (value) {
                setState(() {
                  selectedGrade = value!;
                });
              },
            ),
            const SizedBox(height: 9),
            filterDropdown(
              value: selectedSection,
              items: const [
                'All Sections',
                'Sampaguita',
                'Rosal',
                'Gumamela',
                'Santan',
              ],
              onChanged: (value) {
                setState(() {
                  selectedSection = value!;
                });
              },
            ),
            const SizedBox(height: 9),
            filterDropdown(
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
            const SizedBox(height: 9),
            filterDropdown(
              value: selectedSchoolYear,
              items: const [
                'All School Years',
                '2025-2026',
                '2024-2025',
              ],
              onChanged: (value) {
                setState(() {
                  selectedSchoolYear = value!;
                });
              },
            ),
            const SizedBox(height: 9),
            filterDropdown(
              value: selectedStatus,
              items: const [
                'All Status',
                'Approved',
                'Draft',
                'Needs Revision',
                'Under Review',
              ],
              onChanged: (value) {
                setState(() {
                  selectedStatus = value!;
                });
              },
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Text(
                  'Records',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF1FF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${displayedRecords.length}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: primaryBlue,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (displayedRecords.isEmpty)
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFE7ECF3),
                  ),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.folder_off_outlined,
                      size: 42,
                      color: secondaryText,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'No records found',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    SizedBox(height: 5),
                    Text(
                      'Try changing your search or filters.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: secondaryText,
                      ),
                    ),
                  ],
                ),
              )
            else
              ...displayedRecords.map(
                (record) => recordCard(record),
              ),
          ],
        ),
      ),
    );
  }
}