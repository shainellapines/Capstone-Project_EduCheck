import 'package:flutter/material.dart';

class Sf10PreviewScreen extends StatefulWidget {
  const Sf10PreviewScreen({super.key});

  @override
  State<Sf10PreviewScreen> createState() => _Sf10PreviewScreenState();
}

class _Sf10PreviewScreenState extends State<Sf10PreviewScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  String? selectedStudent;

  final List<Map<String, String>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
    },
    {
      'name': 'Maria Santos',
      'lrn': '123456789013',
    },
    {
      'name': 'Pedro Reyes',
      'lrn': '123456789014',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text(
          selectedStudent == null ? 'SF10 Preview' : 'Student SF10',
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: selectedStudent != null
            ? IconButton(
                onPressed: () {
                  setState(() {
                    selectedStudent = null;
                  });
                },
                icon: const Icon(
                  Icons.arrow_back,
                  color: textColor,
                ),
              )
            : null,
        iconTheme: const IconThemeData(
          color: textColor,
        ),
      ),
      body: selectedStudent == null
          ? _buildStudentList()
          : _buildStudentSf10(),
    );
  }

  Widget _buildStudentList() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeaderCard(),
          const SizedBox(height: 24),
          const Text(
            'Students',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Select a student to preview the generated SF10 permanent record.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          ...students.map(
            (student) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildStudentCard(student),
            ),
          ),
          const SizedBox(height: 10),
          _buildReadOnlyNotice(),
        ],
      ),
    );
  }

  Widget _buildHeaderCard() {
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
              Icons.description_outlined,
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
                  'Generated Permanent Records',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Grade 6 - Sampaguita',
                  style: TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'SY 2025-2026',
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

  Widget _buildStudentCard(Map<String, String> student) {
    return InkWell(
      onTap: () {
        setState(() {
          selectedStudent = student['name'];
        });
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
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
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: primaryBlue,
                size: 23,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    student['name']!,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'LRN: ${student['lrn']}',
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
              color: secondaryTextColor,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentSf10() {
    final student = students.firstWhere(
      (student) => student['name'] == selectedStudent,
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSelectedStudentHeader(student),
          const SizedBox(height: 16),
          _buildStudentInformation(student),
          const SizedBox(height: 16),
          _buildAcademicRecords(),
          const SizedBox(height: 16),
          _buildAttendance(),
          const SizedBox(height: 16),
          _buildGeneralAverage(),
          const SizedBox(height: 16),
          _buildReadOnlyNotice(),
        ],
      ),
    );
  }

  Widget _buildSelectedStudentHeader(Map<String, String> student) {
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
              Icons.person_outline_rounded,
              color: primaryBlue,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['name']!,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'LRN: ${student['lrn']}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Grade 6 - Sampaguita • SY 2025-2026',
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

  Widget _buildStudentInformation(Map<String, String> student) {
    return _buildSectionCard(
      title: 'Student Information',
      icon: Icons.person_outline_rounded,
      child: Column(
        children: [
          _buildInfoRow(
            'Student Name',
            student['name']!,
          ),
          _buildInfoRow(
            'LRN',
            student['lrn']!,
          ),
          _buildInfoRow(
            'Grade Level',
            'Grade 6',
          ),
          _buildInfoRow(
            'Section',
            'Sampaguita',
          ),
          _buildInfoRow(
            'School Year',
            '2025-2026',
          ),
          _buildInfoRow(
            'Adviser',
            'Maria Santos',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildAcademicRecords() {
    return _buildSectionCard(
      title: 'Academic Records',
      icon: Icons.menu_book_outlined,
      child: Column(
        children: [
          _buildTableHeader(),
          _buildSubjectRow('Filipino', '88', '90', '89', '90'),
          _buildSubjectRow('English', '91', '92', '90', '93'),
          _buildSubjectRow('Mathematics', '89', '91', '92', '90'),
          _buildSubjectRow('Science', '90', '89', '91', '92'),
          _buildSubjectRow(
            'Araling Panlipunan',
            '87',
            '89',
            '90',
            '91',
          ),
          _buildSubjectRow('EPP / TLE', '92', '91', '93', '92'),
          _buildSubjectRow(
            'MAPEH',
            '90',
            '92',
            '91',
            '93',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Expanded(
            flex: 3,
            child: Text(
              'Learning Area',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: secondaryTextColor,
              ),
            ),
          ),
          _buildHeaderCell('Q1'),
          _buildHeaderCell('Q2'),
          _buildHeaderCell('Q3'),
          _buildHeaderCell('Q4'),
        ],
      ),
    );
  }

  Widget _buildHeaderCell(String value) {
    return SizedBox(
      width: 28,
      child: Text(
        value,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color: secondaryTextColor,
        ),
      ),
    );
  }

  Widget _buildSubjectRow(
    String subject,
    String q1,
    String q2,
    String q3,
    String q4, {
    bool isLast = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(
                  color: borderColor,
                ),
              ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              subject,
              style: const TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
          _buildGradeCell(q1),
          _buildGradeCell(q2),
          _buildGradeCell(q3),
          _buildGradeCell(q4),
        ],
      ),
    );
  }

  Widget _buildGradeCell(String grade) {
    return SizedBox(
      width: 28,
      child: Text(
        grade,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 9,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildAttendance() {
    return _buildSectionCard(
      title: 'Attendance Summary',
      icon: Icons.calendar_month_outlined,
      child: Column(
        children: [
          _buildAttendanceRow('School Days', '60'),
          _buildAttendanceRow('Days Present', '57'),
          _buildAttendanceRow('Days Absent', '3'),
          _buildAttendanceRow(
            'Times Tardy',
            '1',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildGeneralAverage() {
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
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.assessment_outlined,
              color: Color(0xFF16A34A),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'General Average',
                  style: TextStyle(
                    fontSize: 11,
                    color: secondaryTextColor,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  '91.1',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textColor,
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
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Passed',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Color(0xFF16A34A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReadOnlyNotice() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.lock_outline_rounded,
            color: secondaryTextColor,
            size: 19,
          ),
          SizedBox(width: 9),
          Expanded(
            child: Text(
              'This preview is read-only. The SF10 is generated from validated academic records and cannot be edited from the mobile app.',
              style: TextStyle(
                fontSize: 10.5,
                color: secondaryTextColor,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
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
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: primaryBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value, {
    bool isLast = false,
  }) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: isLast ? 0 : 10,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: secondaryTextColor,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceRow(
    String label,
    String value, {
    bool isLast = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(
                  color: borderColor,
                ),
              ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10.5,
                color: secondaryTextColor,
              ),
            ),
          ),
          Text(
            value,
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
}