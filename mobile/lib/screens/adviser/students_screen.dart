import 'package:flutter/material.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  final TextEditingController searchController = TextEditingController();

  String searchQuery = '';
  String selectedFilter = 'All';

  final List<Map<String, dynamic>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'schoolYear': '2025-2026',
      'average': 88.50,
      'status': 'On Track',
      'recordStatus': 'Complete',
      'statusColor': Color(0xFF16A34A),
      'statusBackground': Color(0xFFF0FDF4),
      'grades': [88, 90, 85, 87, 89, 92, 91, 86],
      'previousSchoolYear': '2024-2025',
      'previousGrade': 'Grade 5',
      'previousSection': 'Rizal',
      'previousAverage': 86.75,
      'previousStatus': 'Complete',
    },
    {
      'name': 'Maria Santos',
      'lrn': '123456789013',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'schoolYear': '2025-2026',
      'average': 71.75,
      'status': 'At Risk',
      'recordStatus': 'Complete',
      'statusColor': Color(0xFFD97706),
      'statusBackground': Color(0xFFFFF7ED),
      'grades': [72, 68, 65, 70, 73, 80, 75, 71],
      'previousSchoolYear': '2024-2025',
      'previousGrade': 'Grade 5',
      'previousSection': 'Rizal',
      'previousAverage': 74.50,
      'previousStatus': 'Complete',
    },
    {
      'name': 'Pedro Garcia',
      'lrn': '123456789014',
      'grade': 'Grade 6',
      'section': 'Sampaguita',
      'schoolYear': '2025-2026',
      'average': 65.00,
      'status': 'Needs Intervention',
      'recordStatus': 'For Review',
      'statusColor': Color(0xFFDC2626),
      'statusBackground': Color(0xFFFEF2F2),
      'grades': [62, 60, 61, 63, 64, 75, 70, 65],
      'previousSchoolYear': '2024-2025',
      'previousGrade': 'Grade 5',
      'previousSection': 'Rizal',
      'previousAverage': 70.25,
      'previousStatus': 'Complete',
    },
  ];

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get filteredStudents {
    return students.where((student) {
      final name = student['name'].toString().toLowerCase();
      final lrn = student['lrn'].toString().toLowerCase();
      final status = student['status'].toString();

      final matchesSearch =
          name.contains(searchQuery.toLowerCase()) ||
          lrn.contains(searchQuery.toLowerCase());

      final matchesFilter =
          selectedFilter == 'All' || status == selectedFilter;

      return matchesSearch && matchesFilter;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: backgroundColor,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildPageHeader(),
            const SizedBox(height: 20),
            _buildClassSummary(),
            const SizedBox(height: 16),
            _buildSearchField(),
            const SizedBox(height: 12),
            _buildFilterSection(),
            const SizedBox(height: 20),
            _buildStudentCount(),
            const SizedBox(height: 10),
            _buildStudentList(),
          ],
        ),
      ),
    );
  }

  Widget _buildPageHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Students',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'View students and their permanent academic records.',
          style: TextStyle(
            fontSize: 12,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildClassSummary() {
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
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.groups_rounded,
              color: primaryBlue,
              size: 25,
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
                  'Advisory Class • SY 2025-2026',
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
              horizontal: 10,
              vertical: 7,
            ),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              '3 Students',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: primaryBlue,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: TextField(
        controller: searchController,
        onChanged: (value) {
          setState(() {
            searchQuery = value;
          });
        },
        style: const TextStyle(
          fontSize: 12,
          color: textColor,
        ),
        decoration: InputDecoration(
          hintText: 'Search by name or LRN',
          hintStyle: const TextStyle(
            fontSize: 12,
            color: Color(0xFF94A3B8),
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: secondaryTextColor,
            size: 21,
          ),
          suffixIcon: searchQuery.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    searchController.clear();
                    setState(() {
                      searchQuery = '';
                    });
                  },
                  icon: const Icon(
                    Icons.close_rounded,
                    color: secondaryTextColor,
                    size: 19,
                  ),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildFilterSection() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildFilterChip('All'),
          const SizedBox(width: 8),
          _buildFilterChip('On Track'),
          const SizedBox(width: 8),
          _buildFilterChip('At Risk'),
          const SizedBox(width: 8),
          _buildFilterChip('Needs Intervention'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final bool isSelected = selectedFilter == label;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedFilter = label;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 13,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isSelected ? primaryBlue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? primaryBlue
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: isSelected
                ? Colors.white
                : secondaryTextColor,
          ),
        ),
      ),
    );
  }

  Widget _buildStudentCount() {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'Class List',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ),
        Text(
          '${filteredStudents.length} student${filteredStudents.length == 1 ? '' : 's'}',
          style: const TextStyle(
            fontSize: 10,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildStudentList() {
    if (filteredStudents.isEmpty) {
      return _buildEmptyState();
    }

    return Column(
      children: List.generate(
        filteredStudents.length,
        (index) {
          final student = filteredStudents[index];

          return Padding(
            padding: EdgeInsets.only(
              bottom: index == filteredStudents.length - 1 ? 0 : 10,
            ),
            child: _buildStudentCard(student),
          );
        },
      ),
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> student) {
    final String name = student['name'];
    final String lrn = student['lrn'];
    final double average = student['average'];
    final String status = student['status'];
    final Color statusColor = student['statusColor'];
    final Color statusBackground = student['statusBackground'];

    final String initials = name
        .split(' ')
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0])
        .join()
        .toUpperCase();

    return GestureDetector(
      onTap: () {
        _showStudentRecord(student);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: status == 'Needs Intervention'
                ? const Color(0xFFFECACA)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF2FF),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      initials,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: primaryBlue,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'LRN: $lrn',
                        style: const TextStyle(
                          fontSize: 10,
                          color: secondaryTextColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF94A3B8),
                  size: 22,
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
                  Icons.analytics_outlined,
                  size: 17,
                  color: secondaryTextColor,
                ),
                const SizedBox(width: 6),
                const Text(
                  'Average',
                  style: TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  average.toStringAsFixed(2),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 6,
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
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 35,
      ),
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
            'Try searching with a different name or LRN.',
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

  void _showStudentRecord(Map<String, dynamic> student) {
    final String name = student['name'];
    final String lrn = student['lrn'];
    final String grade = student['grade'];
    final String section = student['section'];
    final String schoolYear = student['schoolYear'];
    final double average = student['average'];
    final String status = student['status'];
    final String recordStatus = student['recordStatus'];
    final Color statusColor = student['statusColor'];
    final Color statusBackground = student['statusBackground'];
    final List<int> grades = List<int>.from(student['grades']);

    final String previousSchoolYear = student['previousSchoolYear'];
    final String previousGrade = student['previousGrade'];
    final String previousSection = student['previousSection'];
    final double previousAverage = student['previousAverage'];
    final String previousStatus = student['previousStatus'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.92,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(24),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Column(
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(
                        minWidth: 32,
                        minHeight: 32,
                      ),
                      icon: const Icon(
                        Icons.close_rounded,
                        color: secondaryTextColor,
                        size: 21,
                      ),
                    ),
                    const Expanded(
                      child: Text(
                        'Permanent Academic Record',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 32),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildReadOnlyBadge(),
                        const SizedBox(height: 14),
                        _buildRecordHeader(
                          name: name,
                          lrn: lrn,
                          status: status,
                          statusColor: statusColor,
                          statusBackground: statusBackground,
                        ),
                        const SizedBox(height: 16),
                        _buildStudentInformation(
                          grade: grade,
                          section: section,
                          schoolYear: schoolYear,
                        ),
                        const SizedBox(height: 16),
                        _buildCurrentAcademicRecord(
                          average: average,
                          grades: grades,
                        ),
                        const SizedBox(height: 16),
                        _buildPreviousSchoolYearRecord(
                          schoolYear: previousSchoolYear,
                          grade: previousGrade,
                          section: previousSection,
                          average: previousAverage,
                          status: previousStatus,
                        ),
                        const SizedBox(height: 16),
                        _buildRecordStatus(
                          recordStatus: recordStatus,
                          status: status,
                          statusColor: statusColor,
                          statusBackground: statusBackground,
                        ),
                      ],
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

  Widget _buildReadOnlyBadge() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 9,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: const Row(
        children: [
          Icon(
            Icons.lock_outline_rounded,
            size: 16,
            color: secondaryTextColor,
          ),
          SizedBox(width: 7),
          Expanded(
            child: Text(
              'Read-only permanent record. Editing is not available on mobile.',
              style: TextStyle(
                fontSize: 10,
                color: secondaryTextColor,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordHeader({
    required String name,
    required String lrn,
    required String status,
    required Color statusColor,
    required Color statusBackground,
  }) {
    final String initials = name
        .split(' ')
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0])
        .join()
        .toUpperCase();

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
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'LRN: $lrn',
                  style: const TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 7),
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
          ),
        ],
      ),
    );
  }

  Widget _buildStudentInformation({
    required String grade,
    required String section,
    required String schoolYear,
  }) {
    return _buildRecordSection(
      title: 'Student Information',
      icon: Icons.person_outline_rounded,
      children: [
        _buildInformationRow(
          icon: Icons.school_outlined,
          label: 'Grade Level',
          value: grade,
        ),
        _buildInformationDivider(),
        _buildInformationRow(
          icon: Icons.class_outlined,
          label: 'Section',
          value: section,
        ),
        _buildInformationDivider(),
        _buildInformationRow(
          icon: Icons.calendar_today_outlined,
          label: 'School Year',
          value: schoolYear,
        ),
      ],
    );
  }

  Widget _buildCurrentAcademicRecord({
    required double average,
    required List<int> grades,
  }) {
    return _buildRecordSection(
      title: 'Current Academic Record',
      icon: Icons.menu_book_outlined,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF2FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.analytics_outlined,
                color: primaryBlue,
                size: 20,
              ),
              const SizedBox(width: 9),
              const Expanded(
                child: Text(
                  'General Average',
                  style: TextStyle(
                    fontSize: 11,
                    color: secondaryTextColor,
                  ),
                ),
              ),
              Text(
                average.toStringAsFixed(2),
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _buildGradeRow('English', grades[0]),
        _buildGradeRow('Mathematics', grades[1]),
        _buildGradeRow('Science', grades[2]),
        _buildGradeRow('Filipino', grades[3]),
        _buildGradeRow('Araling Panlipunan', grades[4]),
        _buildGradeRow('ESP', grades[5]),
        _buildGradeRow('MAPEH', grades[6]),
        _buildGradeRow('TLE', grades[7]),
      ],
    );
  }

  Widget _buildPreviousSchoolYearRecord({
    required String schoolYear,
    required String grade,
    required String section,
    required double average,
    required String status,
  }) {
    return _buildRecordSection(
      title: 'Previous School Year',
      icon: Icons.history_rounded,
      children: [
        _buildInformationRow(
          icon: Icons.calendar_today_outlined,
          label: 'School Year',
          value: schoolYear,
        ),
        _buildInformationDivider(),
        _buildInformationRow(
          icon: Icons.school_outlined,
          label: 'Grade Level',
          value: grade,
        ),
        _buildInformationDivider(),
        _buildInformationRow(
          icon: Icons.class_outlined,
          label: 'Section',
          value: section,
        ),
        _buildInformationDivider(),
        _buildInformationRow(
          icon: Icons.analytics_outlined,
          label: 'General Average',
          value: average.toStringAsFixed(2),
        ),
        _buildInformationDivider(),
        _buildInformationRow(
          icon: Icons.check_circle_outline_rounded,
          label: 'Record Status',
          value: status,
        ),
      ],
    );
  }

  Widget _buildRecordStatus({
    required String recordStatus,
    required String status,
    required Color statusColor,
    required Color statusBackground,
  }) {
    return _buildRecordSection(
      title: 'Record Status',
      icon: Icons.verified_outlined,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            color: statusBackground,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                status == 'Needs Intervention'
                    ? Icons.warning_amber_rounded
                    : Icons.check_circle_outline_rounded,
                color: statusColor,
                size: 21,
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      recordStatus,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'Permanent record is available for viewing.',
                      style: TextStyle(
                        fontSize: 9,
                        color: secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecordSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
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
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2FF),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(
                  icon,
                  color: primaryBlue,
                  size: 17,
                ),
              ),
              const SizedBox(width: 9),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInformationRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            icon,
            size: 17,
            color: secondaryTextColor,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: secondaryTextColor,
              ),
            ),
          ),
          Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInformationDivider() {
    return const Divider(
      height: 1,
      thickness: 1,
      color: Color(0xFFF1F5F9),
    );
  }

  Widget _buildGradeRow(String subject, int grade) {
    Color gradeColor;
    Color gradeBackground;

    if (grade >= 75) {
      gradeColor = const Color(0xFF16A34A);
      gradeBackground = const Color(0xFFF0FDF4);
    } else if (grade >= 70) {
      gradeColor = const Color(0xFFD97706);
      gradeBackground = const Color(0xFFFFF7ED);
    } else {
      gradeColor = const Color(0xFFDC2626);
      gradeBackground = const Color(0xFFFEF2F2);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              subject,
              style: const TextStyle(
                fontSize: 10,
                color: secondaryTextColor,
              ),
            ),
          ),
          Container(
            width: 42,
            padding: const EdgeInsets.symmetric(
              vertical: 5,
            ),
            decoration: BoxDecoration(
              color: gradeBackground,
              borderRadius: BorderRadius.circular(7),
            ),
            child: Text(
              '$grade',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: gradeColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}