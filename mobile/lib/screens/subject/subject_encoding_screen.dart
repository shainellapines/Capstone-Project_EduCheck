import 'package:flutter/material.dart';
import 'subject_dashboard_screen.dart';
import 'validation_result_screen.dart';

class SubjectEncodingScreen extends StatefulWidget {
  const SubjectEncodingScreen({super.key});

  @override
  State<SubjectEncodingScreen> createState() =>
      _SubjectEncodingScreenState();
}

class _SubjectEncodingScreenState
    extends State<SubjectEncodingScreen> {
  final List<Map<String, dynamic>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
    },
    {
      'name': 'Maria Santos',
      'lrn': '123456789013',
    },
    {
      'name': 'Pedro Garcia',
      'lrn': '123456789014',
    },
    {
      'name': 'Ana Lopez',
      'lrn': '123456789015',
    },
    {
      'name': 'Rosa Martinez',
      'lrn': '123456789016',
    },
  ];

  late List<TextEditingController> gradeControllers;
  late List<String?> errors;

  bool hasValidated = false;
  bool gradesSaved = false;

  @override
  void initState() {
    super.initState();

    gradeControllers = List.generate(
      students.length,
      (index) => TextEditingController(),
    );

    errors = List.generate(
      students.length,
      (index) => null,
    );

    for (int i = 0; i < gradeControllers.length; i++) {
      gradeControllers[i].addListener(() {
        if (hasValidated) {
          validateSingleGrade(i);
        }

        setState(() {
          gradesSaved = false;
        });
      });
    }
  }

  @override
  void dispose() {
    for (final controller in gradeControllers) {
      controller.dispose();
    }

    super.dispose();
  }

  bool isValidGrade(String value) {
    final grade = double.tryParse(value);

    if (grade == null) {
      return false;
    }

    return grade >= 60 && grade <= 100;
  }

  void validateSingleGrade(int index) {
    final value = gradeControllers[index].text.trim();

    setState(() {
      if (value.isEmpty) {
        errors[index] = 'Grades is required';
      } else if (!isValidGrade(value)) {
        errors[index] = 'Invalid grade';
      } else {
        errors[index] = null;
      }
    });
  }

  void validateGrades() {
    setState(() {
      hasValidated = true;

      for (int i = 0; i < gradeControllers.length; i++) {
        final value = gradeControllers[i].text.trim();

        if (value.isEmpty) {
          errors[i] = 'Grades is required';
        } else if (!isValidGrade(value)) {
          errors[i] = 'Invalid grade';
        } else {
          errors[i] = null;
        }
      }
    });

    if (errorCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please fix validation errors before saving.',
          ),
          backgroundColor: Color(0xFFDC2626),
        ),
      );

      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'All grades are valid.',
        ),
        backgroundColor: Color(0xFF16A34A),
      ),
    );
  }

  void saveGrades() {
    if (!hasValidated) {
      validateGrades();

      if (errorCount > 0) {
        return;
      }
    }

    if (errorCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please fix validation errors before saving.',
          ),
          backgroundColor: Color(0xFFDC2626),
        ),
      );

      return;
    }

    setState(() {
      gradesSaved = true;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Grades saved successfully.',
        ),
        backgroundColor: Color(0xFF1554D1),
      ),
    );
  }

  int get completedCount {
    int count = 0;

    for (int i = 0; i < gradeControllers.length; i++) {
      final value = gradeControllers[i].text.trim();

      if (isValidGrade(value)) {
        count++;
      }
    }

    return count;
  }

  int get errorCount {
    if (!hasValidated) {
      return 0;
    }

    return errors.where((error) => error != null).length;
  }

  String getStudentStatus(int index) {
    final value = gradeControllers[index].text.trim();

    if (!hasValidated) {
      if (value.isEmpty) {
        return 'Not entered';
      }

      if (isValidGrade(value)) {
        return 'Valid';
      }

      return 'Invalid';
    }

    if (errors[index] == 'Grades is required') {
      return 'Grades is required';
    }

    if (errors[index] == 'Invalid grade') {
      return 'Invalid';
    }

    return 'Valid';
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'Valid':
        return const Color(0xFF16A34A);
      case 'Invalid':
      case 'Grades is required':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF64748B);
    }
  }

  Color getStatusBackground(String status) {
    switch (status) {
      case 'Valid':
        return const Color(0xFFEAF8EF);
      case 'Invalid':
      case 'Grades is required':
        return const Color(0xFFFEECEC);
      default:
        return const Color(0xFFF1F5F9);
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
                    buildAssignmentCard(),
                    const SizedBox(height: 18),
                    buildSummaryCards(),
                    const SizedBox(height: 20),
                    buildGradingPolicy(),
                    const SizedBox(height: 20),
                    buildGradeEncodingSection(),
                    const SizedBox(height: 22),
                    buildActionButtons(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: buildBottomNavigationBar(),
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
        'Subject Encoding',
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(
            color: Color(0xFFE4E7EC),
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const SubjectDashboardScreen(),
                      ),
                    );
                  },
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.home_outlined,
                        size: 23,
                        color: Color(0xFF667085),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Home',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF667085),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () {},
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.edit_note,
                        size: 23,
                        color: Color(0xFF1554D1),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Subject Encoding',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF1554D1),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const ValidationResultScreen(),
                      ),
                    );
                  },
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.verified_outlined,
                        size: 23,
                        color: Color(0xFF667085),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Validation Result',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF667085),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildTitleSection() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Subject Encoding - Mathematics',
          style: TextStyle(
            fontSize: 23,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
        SizedBox(height: 6),
        Text(
          'Enter grades for your assigned subject only',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF667085),
          ),
        ),
      ],
    );
  }

  Widget buildAssignmentCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Assignment',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF101828),
            ),
          ),
          const SizedBox(height: 16),
          buildAssignmentRow(
            label: 'Subject:',
            value: 'Mathematics',
          ),
          const SizedBox(height: 12),
          buildAssignmentRow(
            label: 'Class:',
            value: 'Grade 6 - Sampaguita',
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  color: Color(0xFF1554D1),
                  size: 20,
                ),
                SizedBox(width: 9),
                Expanded(
                  child: Text(
                    'You can only view and edit the Mathematics column. Other subject grades are managed by their respective subject teachers.',
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.45,
                      color: Color(0xFF475467),
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

  Widget buildAssignmentRow({
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 75,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF667085),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF101828),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget buildSummaryCards() {
    return Row(
      children: [
        Expanded(
          child: buildSummaryCard(
            title: 'Total Students',
            value: '${students.length}',
            icon: Icons.people_outline_rounded,
            color: const Color(0xFF1554D1),
            background: const Color(0xFFEAF2FF),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: buildSummaryCard(
            title: 'Completed',
            value: '$completedCount/${students.length}',
            icon: Icons.check_circle_outline,
            color: const Color(0xFF16A34A),
            background: const Color(0xFFEAF8EF),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: buildSummaryCard(
            title: 'Errors',
            value: '$errorCount',
            icon: Icons.error_outline_rounded,
            color: const Color(0xFFDC2626),
            background: const Color(0xFFFEECEC),
          ),
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
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: color.withOpacity(0.18),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildGradingPolicy() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFFDE68A),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.policy_outlined,
            color: Color(0xFFD97706),
            size: 24,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DepEd Grading Policy',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF92400E),
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'All grades must be between 60 and 100. Invalid grades will be flagged and must be corrected before submission.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.45,
                    color: Color(0xFF92400E),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildGradeEncodingSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Mathematics - Grade Encoding',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF101828),
            ),
          ),
          const SizedBox(height: 15),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: buildGradeTable(),
          ),
        ],
      ),
    );
  }

  Widget buildGradeTable() {
    return Column(
      children: [
        Container(
          width: 760,
          padding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          decoration: const BoxDecoration(
            color: Color(0xFFF2F4F7),
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(10),
              topRight: Radius.circular(10),
            ),
          ),
          child: const Row(
            children: [
              SizedBox(
                width: 35,
                child: Text(
                  '#',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF344054),
                  ),
                ),
              ),
              SizedBox(
                width: 160,
                child: Text(
                  'Student Name',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF344054),
                  ),
                ),
              ),
              SizedBox(
                width: 125,
                child: Text(
                  'LRN',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF344054),
                  ),
                ),
              ),
              SizedBox(
                width: 130,
                child: Text(
                  'Mathematics',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF344054),
                  ),
                ),
              ),
              SizedBox(
                width: 170,
                child: Text(
                  'Status',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF344054),
                  ),
                ),
              ),
            ],
          ),
        ),
        Column(
          children: List.generate(
            students.length,
            (index) => buildStudentRow(index),
          ),
        ),
      ],
    );
  }

  Widget buildStudentRow(int index) {
    final student = students[index];
    final status = getStudentStatus(index);
    final statusColor = getStatusColor(status);
    final statusBackground = getStatusBackground(status);
    final hasError = hasValidated && errors[index] != null;

    return Container(
      width: 760,
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: index.isEven
            ? Colors.white
            : const Color(0xFFFAFBFC),
        border: const Border(
          bottom: BorderSide(
            color: Color(0xFFE4E7EC),
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 35,
            child: Text(
              '${index + 1}',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF475467),
              ),
            ),
          ),
          SizedBox(
            width: 160,
            child: Text(
              student['name'],
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF101828),
              ),
            ),
          ),
          SizedBox(
            width: 125,
            child: Text(
              student['lrn'],
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF667085),
              ),
            ),
          ),
          SizedBox(
            width: 130,
            child: SizedBox(
              width: 95,
              height: 40,
              child: TextField(
                controller: gradeControllers[index],
                keyboardType:
                    const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF101828),
                ),
                decoration: InputDecoration(
                  hintText: 'Enter grade',
                  hintStyle: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF98A2B3),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 8,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(
                      color: hasError
                          ? const Color(0xFFDC2626)
                          : const Color(0xFFD0D5DD),
                      width: hasError ? 1.5 : 1,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(
                      color: hasError
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF1554D1),
                      width: 1.5,
                    ),
                  ),
                ),
              ),
            ),
          ),
          SizedBox(
            width: 170,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: statusBackground,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      status == 'Valid'
                          ? Icons.check_circle_outline
                          : status == 'Invalid' ||
                                  status == 'Grades is required'
                              ? Icons.error_outline_rounded
                              : Icons.remove_circle_outline,
                      color: statusColor,
                      size: 15,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      status,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 50,
            child: OutlinedButton.icon(
              onPressed: saveGrades,
              icon: Icon(
                gradesSaved
                    ? Icons.check_circle_outline
                    : Icons.save_outlined,
                size: 21,
              ),
              label: Text(
                gradesSaved ? 'Grades Saved' : 'Save Grades',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1554D1),
                side: const BorderSide(
                  color: Color(0xFF1554D1),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: validateGrades,
              icon: const Icon(
                Icons.verified_outlined,
                size: 21,
              ),
              label: const Text(
                'Validate Grades',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1554D1),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}