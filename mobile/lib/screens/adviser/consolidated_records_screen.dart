import 'package:flutter/material.dart';

class ConsolidatedRecordsScreen extends StatefulWidget {
  const ConsolidatedRecordsScreen({super.key});

  @override
  State<ConsolidatedRecordsScreen> createState() =>
      _ConsolidatedRecordsScreenState();
}

class _ConsolidatedRecordsScreenState
    extends State<ConsolidatedRecordsScreen> {
  static const Color primaryBlue = Color(0xFF1E5AA8);
  static const Color backgroundColor = Color(0xFFF5F7FB);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  String? selectedRecord;
  String selectedStatus = 'All Students';

  String? sortBy;
  bool sortAscending = true;

  final List<String> records = [
    'Grade 6 - Sampaguita (2nd Quarter, 2025-2026)',
  ];

  final List<StudentRecord> allStudents = [
    StudentRecord(
      number: 1,
      name: 'Juan Dela Cruz',
      lrn: '123456789012',
      filipino: 88,
      english: 90,
      math: 85,
      science: 87,
      ap: 89,
      mapeh: 92,
      esp: 91,
      tle: 86,
      average: 88.50,
      status: 'On Track',
    ),
    StudentRecord(
      number: 2,
      name: 'Maria Santos',
      lrn: '123456789013',
      filipino: 72,
      english: 68,
      math: 65,
      science: 70,
      ap: 73,
      mapeh: 80,
      esp: 75,
      tle: 71,
      average: 71.75,
      status: 'At Risk',
    ),
    StudentRecord(
      number: 3,
      name: 'Pedro Garcia',
      lrn: '123456789014',
      filipino: 62,
      english: 60,
      math: 61,
      science: 63,
      ap: 64,
      mapeh: 75,
      esp: 70,
      tle: 65,
      average: 65.00,
      status: 'Needs Intervention',
    ),
  ];

  List<StudentRecord> get filteredStudents {
    List<StudentRecord> students = List.from(allStudents);

    if (selectedStatus != 'All Students') {
      students = students
          .where((student) => student.status == selectedStatus)
          .toList();
    }

    if (sortBy == 'Name') {
      students.sort(
        (a, b) => sortAscending
            ? a.name.toLowerCase().compareTo(b.name.toLowerCase())
            : b.name.toLowerCase().compareTo(a.name.toLowerCase()),
      );
    } else if (sortBy == 'Average') {
      students.sort(
        (a, b) => sortAscending
            ? a.average.compareTo(b.average)
            : b.average.compareTo(a.average),
      );
    } else if (sortBy == 'Status') {
      students.sort(
        (a, b) => sortAscending
            ? a.status.compareTo(b.status)
            : b.status.compareTo(a.status),
      );
    }

    return students;
  }

  int get totalStudents => allStudents.length;

  int get onTrackCount =>
      allStudents.where((student) => student.status == 'On Track').length;

  int get atRiskCount =>
      allStudents.where((student) => student.status == 'At Risk').length;

  int get interventionCount => allStudents
      .where((student) => student.status == 'Needs Intervention')
      .length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Consolidated Student Records',
          style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPageHeader(),
                const SizedBox(height: 18),
                _buildFilters(),
                const SizedBox(height: 18),
                if (selectedRecord == null)
                  _buildEmptyState()
                else
                  _buildSelectedRecordContent(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPageHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Consolidated Student Records',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'View merged academic data with performance indicators',
          style: TextStyle(
            fontSize: 13,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildFilters() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildRecordDropdown(),
          if (selectedRecord != null) ...[
            const SizedBox(height: 16),
            _buildStatusDropdown(),
            const SizedBox(height: 16),
            _buildSortButtons(),
          ],
        ],
      ),
    );
  }

  Widget _buildRecordDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Record',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<String?>(
          value: selectedRecord,
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD1D5DB),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD1D5DB),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFF60A5FA),
                width: 1.5,
              ),
            ),
          ),
          hint: const Text(
            'Choose a record...',
            style: TextStyle(
              fontSize: 13,
              color: secondaryTextColor,
            ),
          ),
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text(
                'Choose a record...',
                style: TextStyle(
                  fontSize: 13,
                  color: secondaryTextColor,
                ),
              ),
            ),
            ...records.map(
              (record) => DropdownMenuItem<String?>(
                value: record,
                child: Text(
                  record,
                  style: const TextStyle(
                    fontSize: 13,
                    color: textColor,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
          onChanged: (value) {
            setState(() {
              selectedRecord = value;
              selectedStatus = 'All Students';
              sortBy = null;
              sortAscending = true;
            });
          },
        ),
      ],
    );
  }

  Widget _buildStatusDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Filter by Status',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<String>(
          value: selectedStatus,
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD1D5DB),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD1D5DB),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFF60A5FA),
                width: 1.5,
              ),
            ),
          ),
          items: const [
            DropdownMenuItem(
              value: 'All Students',
              child: Text(
                'All Students',
                style: TextStyle(fontSize: 13),
              ),
            ),
            DropdownMenuItem(
              value: 'On Track',
              child: Text(
                'On Track',
                style: TextStyle(fontSize: 13),
              ),
            ),
            DropdownMenuItem(
              value: 'At Risk',
              child: Text(
                'At Risk',
                style: TextStyle(fontSize: 13),
              ),
            ),
            DropdownMenuItem(
              value: 'Needs Intervention',
              child: Text(
                'Needs Intervention',
                style: TextStyle(fontSize: 13),
              ),
            ),
          ],
          onChanged: (value) {
            if (value == null) return;

            setState(() {
              selectedStatus = value;
            });
          },
        ),
      ],
    );
  }

  Widget _buildSortButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sort By',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 7),
        Row(
          children: [
            Expanded(
              child: _buildSortButton(
                label: 'Name',
                icon: Icons.swap_vert,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildSortButton(
                label: 'Average',
                icon: Icons.swap_vert,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildSortButton(
                label: 'Status',
                icon: Icons.swap_vert,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSortButton({
    required String label,
    required IconData icon,
  }) {
    final bool isSelected = sortBy == label;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () {
          setState(() {
            if (sortBy == label) {
              sortAscending = !sortAscending;
            } else {
              sortBy = label;
              sortAscending = true;
            }
          });
        },
        child: Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFFEFF6FF)
                : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF93C5FD)
                  : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight:
                        isSelected ? FontWeight.bold : FontWeight.w500,
                    color: textColor,
                  ),
                ),
              ),
              const SizedBox(width: 3),
              Icon(
                isSelected
                    ? (sortAscending
                        ? Icons.arrow_upward
                        : Icons.arrow_downward)
                    : icon,
                size: 14,
                color: secondaryTextColor,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(
        minHeight: 250,
      ),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.description_outlined,
              size: 34,
              color: Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Record Selected',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            'Please select a record from the dropdown above to view consolidated student data.',
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

  Widget _buildSelectedRecordContent() {
    final students = filteredStudents;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSummaryCards(),
        const SizedBox(height: 18),
        _buildStudentRecordsTable(students),
      ],
    );
  }

  Widget _buildSummaryCards() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildSummaryCard(
                title: 'Total Students',
                value: totalStudents.toString(),
                icon: Icons.description_outlined,
                iconColor: const Color(0xFF2563EB),
                backgroundColor: const Color(0xFFEFF6FF),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildSummaryCard(
                title: 'On Track',
                value: onTrackCount.toString(),
                icon: Icons.check_circle_outline,
                iconColor: const Color(0xFF16A34A),
                backgroundColor: const Color(0xFFF0FDF4),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildSummaryCard(
                title: 'At Risk',
                value: atRiskCount.toString(),
                icon: Icons.warning_amber_rounded,
                iconColor: const Color(0xFFF59E0B),
                backgroundColor: const Color(0xFFFFFBEB),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildSummaryCard(
                title: 'Needs Intervention',
                value: interventionCount.toString(),
                icon: Icons.cancel_outlined,
                iconColor: const Color(0xFFEF4444),
                backgroundColor: const Color(0xFFFEF2F2),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
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
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: iconColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentRecordsTable(List<StudentRecord> students) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTableHeader(students.length),
          const Divider(
            height: 1,
            color: Color(0xFFE2E8F0),
          ),
          if (students.isEmpty)
            _buildNoStudentsFound()
          else
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: _buildStudentTable(students),
            ),
        ],
      ),
    );
  }

  Widget _buildTableHeader(int count) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      child: Row(
        children: [
          const Text(
            'Student Records',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '($count total)',
            style: const TextStyle(
              fontSize: 13,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentTable(List<StudentRecord> students) {
    const double numberWidth = 45;
    const double studentWidth = 170;
    const double subjectWidth = 75;
    const double averageWidth = 80;
    const double statusWidth = 160;

    return Table(
      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
      columnWidths: const {
        0: FixedColumnWidth(numberWidth),
        1: FixedColumnWidth(studentWidth),
        2: FixedColumnWidth(subjectWidth),
        3: FixedColumnWidth(subjectWidth),
        4: FixedColumnWidth(subjectWidth),
        5: FixedColumnWidth(subjectWidth),
        6: FixedColumnWidth(subjectWidth),
        7: FixedColumnWidth(subjectWidth),
        8: FixedColumnWidth(subjectWidth),
        9: FixedColumnWidth(subjectWidth),
        10: FixedColumnWidth(averageWidth),
        11: FixedColumnWidth(statusWidth),
      },
      border: const TableBorder(
        horizontalInside: BorderSide(
          color: Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      children: [
        _buildTableHeaderRow(),
        ...students.map(
          (student) => _buildStudentRow(student),
        ),
      ],
    );
  }

  TableRow _buildTableHeaderRow() {
    return const TableRow(
      decoration: BoxDecoration(
        color: Color(0xFFF8FAFC),
      ),
      children: [
        _HeaderCell('#'),
        _HeaderCell('Student'),
        _HeaderCell('Filipino'),
        _HeaderCell('English'),
        _HeaderCell('Math'),
        _HeaderCell('Science'),
        _HeaderCell('AP'),
        _HeaderCell('MAPEH'),
        _HeaderCell('ESP'),
        _HeaderCell('TLE'),
        _HeaderCell('Average'),
        _HeaderCell('Status'),
      ],
    );
  }

  TableRow _buildStudentRow(StudentRecord student) {
    return TableRow(
      children: [
        _BodyCell(
          child: Text(
            student.number.toString(),
            style: const TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
        ),
        _BodyCell(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                student.name,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'LRN: ${student.lrn}',
                style: const TextStyle(
                  fontSize: 9,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
        _gradeCell(student.filipino),
        _gradeCell(student.english),
        _gradeCell(student.math),
        _gradeCell(student.science),
        _gradeCell(student.ap),
        _gradeCell(student.mapeh),
        _gradeCell(student.esp),
        _gradeCell(student.tle),
        _BodyCell(
          child: Text(
            student.average.toStringAsFixed(2),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ),
        _BodyCell(
          child: _buildStatusChip(student.status),
        ),
      ],
    );
  }

  _BodyCell _gradeCell(int grade) {
    return _BodyCell(
      child: Text(
        grade.toString(),
        style: const TextStyle(
          fontSize: 11,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color textColorValue;
    Color backgroundColorValue;
    IconData icon;

    switch (status) {
      case 'On Track':
        textColorValue = const Color(0xFF16A34A);
        backgroundColorValue = const Color(0xFFDCFCE7);
        icon = Icons.check_circle_outline;
        break;

      case 'At Risk':
        textColorValue = const Color(0xFFD97706);
        backgroundColorValue = const Color(0xFFFEF3C7);
        icon = Icons.warning_amber_rounded;
        break;

      default:
        textColorValue = const Color(0xFFDC2626);
        backgroundColorValue = const Color(0xFFFEE2E2);
        icon = Icons.cancel_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: backgroundColorValue,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: textColorValue,
          ),
          const SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: textColorValue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoStudentsFound() {
    return Padding(
      padding: const EdgeInsets.all(35),
      child: Column(
        children: const [
          Icon(
            Icons.people_outline,
            size: 40,
            color: Color(0xFF94A3B8),
          ),
          SizedBox(height: 10),
          Text(
            'No students found',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'No students match the selected status.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }
}

class StudentRecord {
  final int number;
  final String name;
  final String lrn;
  final int filipino;
  final int english;
  final int math;
  final int science;
  final int ap;
  final int mapeh;
  final int esp;
  final int tle;
  final double average;
  final String status;

  const StudentRecord({
    required this.number,
    required this.name,
    required this.lrn,
    required this.filipino,
    required this.english,
    required this.math,
    required this.science,
    required this.ap,
    required this.mapeh,
    required this.esp,
    required this.tle,
    required this.average,
    required this.status,
  });
}

class _HeaderCell extends StatelessWidget {
  final String text;

  const _HeaderCell(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 12,
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Color(0xFF334155),
        ),
      ),
    );
  }
}

class _BodyCell extends StatelessWidget {
  final Widget child;

  const _BodyCell({
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 12,
      ),
      child: child,
    );
  }
}