import 'package:flutter/material.dart';

class ConsolidatedRecordsScreen extends StatefulWidget {
  const ConsolidatedRecordsScreen({super.key});

  @override
  State<ConsolidatedRecordsScreen> createState() =>
      _ConsolidatedRecordsScreenState();
}

class _ConsolidatedRecordsScreenState
    extends State<ConsolidatedRecordsScreen> {
  String? selectedRecord;
  String selectedFilter = 'All Students';
  String selectedSort = 'Name';

  final List<Map<String, dynamic>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
      'math': 85,
      'average': 88.50,
      'status': 'On Track',
    },
    {
      'name': 'Maria Santos',
      'lrn': '123456789013',
      'math': 65,
      'average': 71.75,
      'status': 'At Risk',
    },
    {
      'name': 'Pedro Garcia',
      'lrn': '123456789014',
      'math': 61,
      'average': 65.00,
      'status': 'Needs Intervention',
    },
  ];

  List<Map<String, dynamic>> get filteredStudents {
    List<Map<String, dynamic>> result = List.from(students);

    if (selectedFilter != 'All Students') {
      result = result
          .where((student) => student['status'] == selectedFilter)
          .toList();
    }

    if (selectedSort == 'Name') {
      result.sort(
        (a, b) => a['name'].toString().compareTo(
              b['name'].toString(),
            ),
      );
    } else if (selectedSort == 'Average') {
      result.sort(
        (a, b) => (b['average'] as double).compareTo(
              a['average'] as double,
            ),
      );
    } else if (selectedSort == 'Status') {
      result.sort(
        (a, b) => a['status'].toString().compareTo(
              b['status'].toString(),
            ),
      );
    }

    return result;
  }

  void selectRecord(String? value) {
    setState(() {
      selectedRecord = value;
    });
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'On Track':
        return const Color(0xFF16A34A);
      case 'At Risk':
        return const Color(0xFFD97706);
      case 'Needs Intervention':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF64748B);
    }
  }

  Color getStatusBackground(String status) {
    switch (status) {
      case 'On Track':
        return const Color(0xFFEAF8EF);
      case 'At Risk':
        return const Color(0xFFFFF3CD);
      case 'Needs Intervention':
        return const Color(0xFFFEECEC);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  IconData getStatusIcon(String status) {
    switch (status) {
      case 'On Track':
        return Icons.check_circle_outline;
      case 'At Risk':
        return Icons.warning_amber_rounded;
      case 'Needs Intervention':
        return Icons.error_outline_rounded;
      default:
        return Icons.info_outline;
    }
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
                padding: const EdgeInsets.fromLTRB(
                  16,
                  18,
                  16,
                  30,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildTitleSection(),
                    const SizedBox(height: 22),
                    buildSubjectTeacherView(),
                    const SizedBox(height: 20),
                    buildRecordSelection(),
                    if (selectedRecord != null) ...[
                      const SizedBox(height: 20),
                      buildFilterSection(),
                      const SizedBox(height: 20),
                      buildSummaryCards(),
                      const SizedBox(height: 22),
                      buildStudentRecords(),
                    ],
                    if (selectedRecord == null) ...[
                      const SizedBox(height: 24),
                      buildNoRecordSelected(),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildHeader() {
    return Container(
      height: 56,
      width: double.infinity,
      color: const Color(0xFF1554D1),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 40,
            ),
            icon: const Icon(
              Icons.arrow_back,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 4),
          const Text(
            'Consolidated Student Records',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildTitleSection() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Consolidated Student Records',
          style: TextStyle(
            fontSize: 23,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
        SizedBox(height: 6),
        Text(
          'View merged academic data with performance indicators',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF667085),
          ),
        ),
      ],
    );
  }

  Widget buildSubjectTeacherView() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF2FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFC9DCFF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.visibility_outlined,
                color: Color(0xFF1554D1),
                size: 21,
              ),
              SizedBox(width: 8),
              Text(
                'Subject Teacher View',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1554D1),
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          const Text(
            'You are viewing only the Mathematics column(s). Other subject grades are managed by their respective subject teachers and are not visible in your view.',
            style: TextStyle(
              fontSize: 13,
              height: 1.45,
              color: Color(0xFF475467),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildRecordSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Record',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Color(0xFF344054),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFD0D5DD),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selectedRecord,
              isExpanded: true,
              hint: const Text(
                'Choose a record...',
                style: TextStyle(
                  color: Color(0xFF98A2B3),
                  fontSize: 14,
                ),
              ),
              icon: const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Color(0xFF667085),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'Grade 6 - Sampaguita (2nd Quarter, 2025-2026)',
                  child: Text(
                    'Grade 6 - Sampaguita (2nd Quarter, 2025-2026)',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF344054),
                    ),
                  ),
                ),
              ],
              onChanged: selectRecord,
            ),
          ),
        ),
      ],
    );
  }

  Widget buildFilterSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Filter by Status',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Color(0xFF344054),
          ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              buildFilterChip('All Students'),
              const SizedBox(width: 8),
              buildFilterChip('On Track'),
              const SizedBox(width: 8),
              buildFilterChip('At Risk'),
              const SizedBox(width: 8),
              buildFilterChip('Needs Intervention'),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const Text(
          'Sort By',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Color(0xFF344054),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            buildSortButton(
              'Name',
              Icons.sort_by_alpha_rounded,
            ),
            const SizedBox(width: 8),
            buildSortButton(
              'Average',
              Icons.bar_chart_rounded,
            ),
            const SizedBox(width: 8),
            buildSortButton(
              'Status',
              Icons.filter_list_rounded,
            ),
          ],
        ),
      ],
    );
  }

  Widget buildFilterChip(String label) {
    final bool selected = selectedFilter == label;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedFilter = label;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 13,
          vertical: 9,
        ),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF1554D1)
              : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? const Color(0xFF1554D1)
                : const Color(0xFFD0D5DD),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected
                ? FontWeight.w600
                : FontWeight.w400,
            color: selected
                ? Colors.white
                : const Color(0xFF475467),
          ),
        ),
      ),
    );
  }

  Widget buildSortButton(
    String label,
    IconData icon,
  ) {
    final bool selected = selectedSort == label;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            selectedSort = label;
          });
        },
        child: Container(
          height: 42,
          decoration: BoxDecoration(
            color: selected
                ? const Color(0xFFEAF2FF)
                : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected
                  ? const Color(0xFF1554D1)
                  : const Color(0xFFD0D5DD),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 17,
                color: selected
                    ? const Color(0xFF1554D1)
                    : const Color(0xFF667085),
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected
                      ? FontWeight.w600
                      : FontWeight.w400,
                  color: selected
                      ? const Color(0xFF1554D1)
                      : const Color(0xFF475467),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildSummaryCards() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Performance Summary',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: buildSummaryCard(
                title: 'Total Students',
                value: '3',
                icon: Icons.people_outline_rounded,
                color: const Color(0xFF1554D1),
                background: const Color(0xFFEAF2FF),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: buildSummaryCard(
                title: 'On Track',
                value: '1',
                icon: Icons.check_circle_outline,
                color: const Color(0xFF16A34A),
                background: const Color(0xFFEAF8EF),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: buildSummaryCard(
                title: 'At Risk',
                value: '1',
                icon: Icons.warning_amber_rounded,
                color: const Color(0xFFD97706),
                background: const Color(0xFFFFF3CD),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: buildSummaryCard(
                title: 'Needs Intervention',
                value: '1',
                icon: Icons.error_outline_rounded,
                color: const Color(0xFFDC2626),
                background: const Color(0xFFFEECEC),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget buildSummaryCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color background,
  }) {
    return Container(
      height: 105,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: color.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: color,
                size: 21,
              ),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildNoRecordSelected() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 45,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.description_outlined,
            size: 58,
            color: Color(0xFF98A2B3),
          ),
          SizedBox(height: 16),
          Text(
            'No Record Selected',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF344054),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Please select a record from the dropdown above to view consolidated student data.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              height: 1.5,
              color: Color(0xFF667085),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildStudentRecords() {
    final records = filteredStudents;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Student Records (${records.length} total)',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF101828),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 6,
              ),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Showing all',
                style: TextStyle(
                  color: Color(0xFF1554D1),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (records.isEmpty)
          buildEmptyFilteredState()
        else
          Column(
            children: List.generate(
              records.length,
              (index) {
                return Padding(
                  padding: const EdgeInsets.only(
                    bottom: 12,
                  ),
                  child: buildStudentCard(
                    records[index],
                    index + 1,
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget buildStudentCard(
    Map<String, dynamic> student,
    int number,
  ) {
    final String status = student['status'];
    final Color statusColor = getStatusColor(status);
    final Color statusBackground =
        getStatusBackground(status);

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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2FF),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Text(
                  '$number',
                  style: const TextStyle(
                    color: Color(0xFF1554D1),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      student['name'],
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF101828),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'LRN: ${student['lrn']}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF667085),
                      ),
                    ),
                  ],
                ),
              ),
              buildStatusChip(status),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 12,
            ),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: buildGradeColumn(
                    label: 'Math',
                    value: '${student['math']}',
                  ),
                ),
                Container(
                  width: 1,
                  height: 38,
                  color: const Color(0xFFE2E8F0),
                ),
                Expanded(
                  child: buildGradeColumn(
                    label: 'Average',
                    value:
                        (student['average'] as double)
                            .toStringAsFixed(2),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: statusBackground,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  getStatusIcon(status),
                  color: statusColor,
                  size: 16,
                ),
                const SizedBox(width: 5),
                Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildGradeColumn({
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF667085),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
      ],
    );
  }

  Widget buildStatusChip(String status) {
    final Color color = getStatusColor(status);
    final Color background = getStatusBackground(status);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            getStatusIcon(status),
            color: color,
            size: 14,
          ),
          const SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildEmptyFilteredState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(30),
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
            Icons.search_off_rounded,
            size: 45,
            color: Color(0xFF98A2B3),
          ),
          SizedBox(height: 12),
          Text(
            'No students found',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF344054),
            ),
          ),
          SizedBox(height: 5),
          Text(
            'No students match the selected status.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF667085),
            ),
          ),
        ],
      ),
    );
  }
}