import 'package:flutter/material.dart';

class ConsolidatedRecordsScreen extends StatefulWidget {
  const ConsolidatedRecordsScreen({super.key});

  @override
  State<ConsolidatedRecordsScreen> createState() =>
      _ConsolidatedRecordsScreenState();
}

class _ConsolidatedRecordsScreenState
    extends State<ConsolidatedRecordsScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  String? selectedRecord;
  String selectedStatus = 'All Students';

  String? sortBy;
  bool sortAscending = true;

  String recordStatus = 'Pending Review';
  String returnReason = '';

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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTopHeader(context),
              const SizedBox(height: 20),
              _buildRecordOverview(),
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
    );
  }

  Widget _buildTopHeader(BuildContext context) {
    return Row(
      children: [
        Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(11),
          child: InkWell(
            borderRadius: BorderRadius.circular(11),
            onTap: () {
              Navigator.pop(context);
            },
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(11),
                border: Border.all(
                  color: const Color(0xFFE2E8F0),
                ),
              ),
              child: const Icon(
                Icons.arrow_back,
                color: textColor,
                size: 20,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Student Records',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'Consolidated academic records for your class.',
                style: TextStyle(
                  fontSize: 11,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecordOverview() {
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
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.school_outlined,
              color: primaryBlue,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Grade 6 - Sampaguita',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Consolidated student academic records',
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

  Widget _buildFilters() {
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
            'Record Selection',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 12),
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
    return DropdownButtonFormField<String>(
      value: selectedRecord,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: 'Select Record',
        labelStyle: const TextStyle(
          fontSize: 12,
          color: secondaryTextColor,
        ),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 13,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: primaryBlue,
            width: 1.4,
          ),
        ),
      ),
      hint: const Text(
        'Choose a record...',
        style: TextStyle(
          fontSize: 12,
          color: secondaryTextColor,
        ),
      ),
      items: records.map((record) {
        return DropdownMenuItem<String>(
          value: record,
          child: Text(
            record,
            style: const TextStyle(
              fontSize: 12,
              color: textColor,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          selectedRecord = value;
          selectedStatus = 'All Students';
          sortBy = null;
          sortAscending = true;
          recordStatus = 'Pending Review';
          returnReason = '';
        });
      },
    );
  }

  Widget _buildStatusDropdown() {
    return DropdownButtonFormField<String>(
      value: selectedStatus,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: 'Filter Students',
        labelStyle: const TextStyle(
          fontSize: 12,
          color: secondaryTextColor,
        ),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 13,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: primaryBlue,
            width: 1.4,
          ),
        ),
      ),
      items: const [
        DropdownMenuItem(
          value: 'All Students',
          child: Text(
            'All Students',
            style: TextStyle(fontSize: 12),
          ),
        ),
        DropdownMenuItem(
          value: 'On Track',
          child: Text(
            'On Track',
            style: TextStyle(fontSize: 12),
          ),
        ),
        DropdownMenuItem(
          value: 'At Risk',
          child: Text(
            'At Risk',
            style: TextStyle(fontSize: 12),
          ),
        ),
        DropdownMenuItem(
          value: 'Needs Intervention',
          child: Text(
            'Needs Intervention',
            style: TextStyle(fontSize: 12),
          ),
        ),
      ],
      onChanged: (value) {
        if (value == null) return;

        setState(() {
          selectedStatus = value;
        });
      },
    );
  }

  Widget _buildSortButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sort Students',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildSortButton(
                label: 'Name',
                icon: Icons.sort_by_alpha,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildSortButton(
                label: 'Average',
                icon: Icons.bar_chart_outlined,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildSortButton(
                label: 'Status',
                icon: Icons.filter_list,
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
        borderRadius: BorderRadius.circular(10),
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
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 7),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFFEFF6FF)
                : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF93C5FD)
                  : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 14,
                color: isSelected ? primaryBlue : secondaryTextColor,
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight:
                        isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? primaryBlue : textColor,
                  ),
                ),
              ),
              if (isSelected) ...[
                const SizedBox(width: 2),
                Icon(
                  sortAscending
                      ? Icons.arrow_upward
                      : Icons.arrow_downward,
                  size: 11,
                  color: primaryBlue,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
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
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.description_outlined,
              size: 32,
              color: Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Record Selected',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Select a record above to view the consolidated student data.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
              height: 1.4,
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
        const SizedBox(height: 18),
        _buildRecordReviewCard(),
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
                title: 'Students',
                value: totalStudents.toString(),
                icon: Icons.people_outline,
                iconColor: primaryBlue,
                cardColor: const Color(0xFFEFF6FF),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildSummaryCard(
                title: 'On Track',
                value: onTrackCount.toString(),
                icon: Icons.check_circle_outline,
                iconColor: const Color(0xFF16A34A),
                cardColor: const Color(0xFFF0FDF4),
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
                iconColor: const Color(0xFFD97706),
                cardColor: const Color(0xFFFFF7ED),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildSummaryCard(
                title: 'Intervention',
                value: interventionCount.toString(),
                icon: Icons.priority_high_rounded,
                iconColor: const Color(0xFFDC2626),
                cardColor: const Color(0xFFFEF2F2),
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
    required Color cardColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
              color: cardColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 19,
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
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(15, 15, 15, 12),
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Student Records',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Academic performance overview',
                        style: TextStyle(
                          fontSize: 10,
                          color: secondaryTextColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${students.length} students',
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: secondaryTextColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
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

  Widget _buildStudentTable(List<StudentRecord> students) {
    return Table(
      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
      columnWidths: const {
        0: FixedColumnWidth(45),
        1: FixedColumnWidth(170),
        2: FixedColumnWidth(75),
        3: FixedColumnWidth(75),
        4: FixedColumnWidth(75),
        5: FixedColumnWidth(75),
        6: FixedColumnWidth(75),
        7: FixedColumnWidth(75),
        8: FixedColumnWidth(75),
        9: FixedColumnWidth(75),
        10: FixedColumnWidth(80),
        11: FixedColumnWidth(160),
      },
      border: const TableBorder(
        horizontalInside: BorderSide(
          color: Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      children: [
        const TableRow(
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
        ),
        ...students.map(
          (student) => _buildStudentRow(student),
        ),
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
    Color statusTextColor;
    Color statusBackgroundColor;
    IconData icon;

    switch (status) {
      case 'On Track':
        statusTextColor = const Color(0xFF16A34A);
        statusBackgroundColor = const Color(0xFFDCFCE7);
        icon = Icons.check_circle_outline;
        break;

      case 'At Risk':
        statusTextColor = const Color(0xFFD97706);
        statusBackgroundColor = const Color(0xFFFEF3C7);
        icon = Icons.warning_amber_rounded;
        break;

      default:
        statusTextColor = const Color(0xFFDC2626);
        statusBackgroundColor = const Color(0xFFFEE2E2);
        icon = Icons.priority_high_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: statusBackgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: statusTextColor,
          ),
          const SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: statusTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordReviewCard() {
    final bool canReview = recordStatus == 'Pending Review' ||
        recordStatus == 'Under Adviser Review';

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
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.fact_check_outlined,
                  color: primaryBlue,
                  size: 21,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Record Review',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Verify or return this academic record.',
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
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  'Current Status',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(width: 10),
                _buildRecordStatusChip(recordStatus),
              ],
            ),
          ),
          if (returnReason.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: const Color(0xFFFED7AA),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Return Reason',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF9A3412),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    returnReason,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF7C2D12),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (canReview) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showReturnDialog,
                    icon: const Icon(
                      Icons.undo_outlined,
                      size: 17,
                    ),
                    label: const Text(
                      'Return',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                      side: const BorderSide(
                        color: Color(0xFFFCA5A5),
                      ),
                      minimumSize: const Size(
                        double.infinity,
                        44,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _showVerifyDialog,
                    icon: const Icon(
                      Icons.check_circle_outline,
                      size: 17,
                    ),
                    label: const Text(
                      'Verify Record',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      minimumSize: const Size(
                        double.infinity,
                        44,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ] else if (recordStatus == 'Verified by Adviser') ...[
            const SizedBox(height: 14),
            _buildReviewMessage(
              icon: Icons.check_circle,
              iconColor: const Color(0xFF16A34A),
              backgroundColor: const Color(0xFFF0FDF4),
              borderColor: const Color(0xFFBBF7D0),
              textColorValue: const Color(0xFF166534),
              text:
                  'This record has been verified by the adviser and is ready for the next workflow step.',
            ),
          ] else if (recordStatus == 'Returned for Revision') ...[
            const SizedBox(height: 14),
            _buildReviewMessage(
              icon: Icons.error_outline,
              iconColor: const Color(0xFFDC2626),
              backgroundColor: const Color(0xFFFEF2F2),
              borderColor: const Color(0xFFFECACA),
              textColorValue: const Color(0xFF991B1B),
              text:
                  'This record was returned for revision and needs to be corrected before it can be reviewed again.',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildReviewMessage({
    required IconData icon,
    required Color iconColor,
    required Color backgroundColor,
    required Color borderColor,
    required Color textColorValue,
    required String text,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            color: iconColor,
            size: 20,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 11,
                color: textColorValue,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordStatusChip(String status) {
    Color statusTextColor;
    Color statusBackgroundColor;
    IconData icon;

    switch (status) {
      case 'Verified by Adviser':
        statusTextColor = const Color(0xFF15803D);
        statusBackgroundColor = const Color(0xFFDCFCE7);
        icon = Icons.check_circle_outline;
        break;

      case 'Returned for Revision':
        statusTextColor = const Color(0xFFDC2626);
        statusBackgroundColor = const Color(0xFFFEE2E2);
        icon = Icons.undo_outlined;
        break;

      default:
        statusTextColor = const Color(0xFFD97706);
        statusBackgroundColor = const Color(0xFFFEF3C7);
        icon = Icons.pending_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 9,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: statusBackgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: statusTextColor,
          ),
          const SizedBox(width: 5),
          Text(
            status,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: statusTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showVerifyDialog() async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text(
            'Confirm Verification',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          content: const Text(
            'Are you sure you want to verify this academic record?',
            style: TextStyle(
              fontSize: 14,
              color: secondaryTextColor,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, false);
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext, true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Verify'),
            ),
          ],
        );
      },
    );

    if (confirmed == true && mounted) {
      setState(() {
        recordStatus = 'Verified by Adviser';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Record verified successfully.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _showReturnDialog() async {
    final TextEditingController reasonController =
        TextEditingController();

    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text(
            'Return Record',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Please provide a reason for returning this record for revision.',
                style: TextStyle(
                  fontSize: 14,
                  color: secondaryTextColor,
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: reasonController,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText: 'Enter return reason...',
                  hintStyle: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF94A3B8),
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.all(12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                      color: primaryBlue,
                      width: 1.4,
                    ),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, false);
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (reasonController.text.trim().isEmpty) {
                  return;
                }

                Navigator.pop(dialogContext, true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Return Record'),
            ),
          ],
        );
      },
    );

    final String reason = reasonController.text.trim();
    reasonController.dispose();

    if (confirmed == true && reason.isNotEmpty && mounted) {
      setState(() {
        recordStatus = 'Returned for Revision';
        returnReason = reason;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Record returned for revision.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Widget _buildNoStudentsFound() {
    return const Padding(
      padding: EdgeInsets.all(35),
      child: Column(
        children: [
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