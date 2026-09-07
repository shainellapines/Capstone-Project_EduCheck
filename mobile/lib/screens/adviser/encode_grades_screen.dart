import 'package:flutter/material.dart';

class EncodeGradesScreen extends StatefulWidget {
  const EncodeGradesScreen({super.key});

  @override
  State<EncodeGradesScreen> createState() => _EncodeGradesScreenState();
}

class _EncodeGradesScreenState extends State<EncodeGradesScreen> {
  String selectedGradeLevel = 'Grade 6';
  String selectedSection = 'Sampaguita';
  String selectedQuarter = '1st Quarter';
  String selectedSchoolYear = '2025-2026';

  final List<String> gradeLevels = [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
  ];

  final List<String> sections = [
    'Sampaguita',
    'Rosal',
    'Gumamela',
    'Dama de Noche',
    'Santan',
  ];

  final List<String> quarters = [
    '1st Quarter',
    '2nd Quarter',
    '3rd Quarter',
    '4th Quarter',
  ];

  final List<String> schoolYears = [
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
    '2028-2029',
  ];

  final List<String> subjects = [
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan',
    'MAPEH',
    'Edukasyon sa Pagpapakatao',
    'Technology and Livelihood Education',
  ];

  final List<Map<String, dynamic>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
    },
    {
      'name': 'Maria Clara Santos',
      'lrn': '123456789013',
    },
    {
      'name': 'Jose Rizal Garcia',
      'lrn': '123456789014',
    },
  ];

  final List<List<TextEditingController>> gradeControllers = [];

  @override
  void initState() {
    super.initState();
    initializeControllers();
  }

  void initializeControllers() {
    for (int i = 0; i < students.length; i++) {
      gradeControllers.add(
        List.generate(
          subjects.length,
          (_) => TextEditingController(),
        ),
      );
    }
  }

  @override
  void dispose() {
    for (final row in gradeControllers) {
      for (final controller in row) {
        controller.dispose();
      }
    }
    super.dispose();
  }

  List<String> getValidationErrors(int index) {
    final errors = <String>[];

    final name = students[index]['name'].toString().trim();
    final lrn = students[index]['lrn'].toString().trim();

    if (name.isEmpty) {
      errors.add('Student name is required');
    }

    if (lrn.isEmpty) {
      errors.add('LRN is required');
    } else if (lrn.length != 12) {
      errors.add('LRN must be 12 digits');
    }

    for (final controller in gradeControllers[index]) {
      final value = controller.text.trim();

      if (value.isEmpty) {
        errors.add('Missing grades for some subjects');
        break;
      }

      final grade = double.tryParse(value);

      if (grade == null || grade < 60 || grade > 100) {
        errors.add('Invalid grades for some subjects');
        break;
      }
    }

    return errors;
  }

  bool get hasValidationErrors {
    for (int i = 0; i < students.length; i++) {
      if (getValidationErrors(i).isNotEmpty) {
        return true;
      }
    }

    return false;
  }

  double calculateAverage(int index) {
    double total = 0;
    int count = 0;

    for (final controller in gradeControllers[index]) {
      final value = double.tryParse(controller.text);

      if (value != null && value >= 60 && value <= 100) {
        total += value;
        count++;
      }
    }

    if (count == 0) {
      return 0;
    }

    return total / count;
  }

  bool isInvalidGrade(String value) {
    final grade = double.tryParse(value);

    if (grade == null) {
      return false;
    }

    return grade < 60 || grade > 100;
  }

  void addStudent() {
    setState(() {
      students.add({
        'name': '',
        'lrn': '',
      });

      gradeControllers.add(
        List.generate(
          subjects.length,
          (_) => TextEditingController(),
        ),
      );
    });
  }

  void removeStudent(int index) {
    final studentName = students[index]['name'].toString().trim();

    final displayName =
        studentName.isEmpty ? 'Unnamed Student' : studentName;

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text(
            'Remove Student',
            style: TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Text(
            'Are you sure you want to remove $displayName from this list?',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF475467),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: Color(0xFF667085),
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext);

                setState(() {
                  for (final controller in gradeControllers[index]) {
                    controller.dispose();
                  }

                  gradeControllers.removeAt(index);
                  students.removeAt(index);
                });

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      '$displayName has been removed.',
                    ),
                    backgroundColor: const Color(0xFF16A34A),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Remove'),
            ),
          ],
        );
      },
    );
  }

  void saveDraft() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Grades saved as draft.'),
      ),
    );
  }

  void validateGrades() {
    setState(() {});

    if (hasValidationErrors) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Validation failed. Please correct all errors before submitting.',
          ),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All grades are valid.'),
          backgroundColor: Color(0xFF16A34A),
        ),
      );
    }
  }

  void submitGrades() {
    if (hasValidationErrors) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please correct all validation errors before submitting.',
          ),
          backgroundColor: Color(0xFFDC2626),
        ),
      );

      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Grades submitted successfully.'),
        backgroundColor: Color(0xFF1554D1),
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
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildTitle(),
                    const SizedBox(height: 18),
                    buildSectionSelection(),
                    const SizedBox(height: 18),
                    buildGradingPolicy(),
                    const SizedBox(height: 24),
                    buildStudentGradesHeader(),
                    const SizedBox(height: 12),
                    buildGradesTable(),
                    const SizedBox(height: 20),
                    buildValidationErrors(),
                    const SizedBox(height: 20),
                    buildActionButtons(),
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
      alignment: Alignment.centerLeft,
      child: const Text(
        'Encode Grades',
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget buildTitle() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Encode Grades',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
        SizedBox(height: 5),
        Text(
          'Encode student grades by section',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF667085),
          ),
        ),
      ],
    );
  }

  Widget buildSectionSelection() {
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
            'Section Selection',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF101828),
            ),
          ),
          const SizedBox(height: 18),
          buildDropdownField(
            label: 'Grade Level',
            value: selectedGradeLevel,
            items: gradeLevels,
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  selectedGradeLevel = value;
                });
              }
            },
          ),
          const SizedBox(height: 14),
          buildDropdownField(
            label: 'Section',
            value: selectedSection,
            items: sections,
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  selectedSection = value;
                });
              }
            },
          ),
          const SizedBox(height: 14),
          buildDropdownField(
            label: 'Quarter',
            value: selectedQuarter,
            items: quarters,
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  selectedQuarter = value;
                });
              }
            },
          ),
          const SizedBox(height: 14),
          buildDropdownField(
            label: 'School Year',
            value: selectedSchoolYear,
            items: schoolYears,
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  selectedSchoolYear = value;
                });
              }
            },
          ),
        ],
      ),
    );
  }

  Widget buildDropdownField({
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
            color: Color(0xFF344054),
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 13,
              vertical: 13,
            ),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFFD0D5DD),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFFD0D5DD),
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
            Icons.keyboard_arrow_down_rounded,
            color: Color(0xFF667085),
          ),
          items: items
              .map(
                (item) => DropdownMenuItem<String>(
                  value: item,
                  child: Text(
                    item,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ],
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF3CD),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.info_outline_rounded,
              color: Color(0xFFD89B00),
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
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
                SizedBox(height: 7),
                Text(
                  'All grades must be between 60 and 100 based on the Department of Education grading policy. Grades below 60 or above 100 will be flagged as invalid and must be corrected before submission.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.5,
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

  Widget buildStudentGradesHeader() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Student Grades',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF101828),
                ),
              ),
              const SizedBox(height: 5),
              Text(
                'Total Students: ${students.length}',
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF667085),
                ),
              ),
            ],
          ),
        ),
        OutlinedButton.icon(
          onPressed: addStudent,
          icon: const Icon(
            Icons.add_rounded,
            size: 18,
          ),
          label: const Text('Add Student'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF1554D1),
            side: const BorderSide(
              color: Color(0xFF1554D1),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 10,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ],
    );
  }

  Widget buildGradesTable() {
    const double tableWidth = 1460;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: tableWidth,
            child: Column(
              children: [
                buildTableHeader(),
                ...List.generate(
                  students.length,
                  (index) => buildStudentRow(index),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget buildTableHeader() {
    return Container(
      height: 72,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        border: Border(
          bottom: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          buildHeaderCell('#', 45),
          buildHeaderCell('Name', 160),
          buildHeaderCell('LRN', 140),
          ...subjects.map(
            (subject) => buildHeaderCell(subject, 125),
          ),
          buildHeaderCell('Gen. Avg.', 90),
          buildHeaderCell('Action', 115),
        ],
      ),
    );
  }

  Widget buildHeaderCell(String text, double width) {
    return Container(
      width: width,
      height: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 10,
      ),
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: Color(0xFF344054),
        ),
      ),
    );
  }

  Widget buildStudentRow(int index) {
    return Container(
      height: 82,
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          buildNumberCell('${index + 1}', 45),
          buildNameCell(index, 160),
          buildLrnCell(index, 140),
          ...List.generate(
            subjects.length,
            (subjectIndex) => buildGradeCell(
              index,
              subjectIndex,
              125,
            ),
          ),
          buildAverageCell(index, 90),
          buildActionCell(index, 115),
        ],
      ),
    );
  }

  Widget buildNumberCell(String text, double width) {
    return Container(
      width: width,
      height: double.infinity,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Color(0xFF475467),
        ),
      ),
    );
  }

  Widget buildNameCell(int index, double width) {
    return Container(
      width: width,
      height: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 12,
      ),
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: TextFormField(
        key: ValueKey(
          'name_$index',
        ),
        initialValue: students[index]['name'],
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 11,
          color: Color(0xFF344054),
        ),
        decoration: InputDecoration(
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 6,
            vertical: 9,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(7),
            borderSide: const BorderSide(
              color: Color(0xFFD0D5DD),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(7),
            borderSide: const BorderSide(
              color: Color(0xFFD0D5DD),
            ),
          ),
        ),
        onChanged: (value) {
          students[index]['name'] = value;
          setState(() {});
        },
      ),
    );
  }

  Widget buildLrnCell(int index, double width) {
    return Container(
      width: width,
      height: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 12,
      ),
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: TextFormField(
        key: ValueKey(
          'lrn_$index',
        ),
        initialValue: students[index]['lrn'],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 12,
        style: const TextStyle(
          fontSize: 11,
          color: Color(0xFF344054),
        ),
        decoration: InputDecoration(
          counterText: '',
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 6,
            vertical: 9,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(7),
            borderSide: const BorderSide(
              color: Color(0xFFD0D5DD),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(7),
            borderSide: const BorderSide(
              color: Color(0xFFD0D5DD),
            ),
          ),
        ),
        onChanged: (value) {
          students[index]['lrn'] = value;
          setState(() {});
        },
      ),
    );
  }

  Widget buildGradeCell(
    int studentIndex,
    int subjectIndex,
    double width,
  ) {
    final controller =
        gradeControllers[studentIndex][subjectIndex];

    return Container(
      width: width,
      height: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 16,
      ),
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: ValueListenableBuilder<TextEditingValue>(
        valueListenable: controller,
        builder: (context, value, child) {
          final invalid = isInvalidGrade(value.text);

          return TextField(
            controller: controller,
            keyboardType: const TextInputType.numberWithOptions(
              decimal: true,
            ),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: invalid
                  ? const Color(0xFFDC2626)
                  : const Color(0xFF344054),
            ),
            decoration: InputDecoration(
              hintText: 'Grade',
              hintStyle: const TextStyle(
                fontSize: 10,
                color: Color(0xFF98A2B3),
              ),
              filled: true,
              fillColor: invalid
                  ? const Color(0xFFFEECEC)
                  : const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 6,
                vertical: 9,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(7),
                borderSide: BorderSide(
                  color: invalid
                      ? const Color(0xFFDC2626)
                      : const Color(0xFFD0D5DD),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(7),
                borderSide: BorderSide(
                  color: invalid
                      ? const Color(0xFFDC2626)
                      : const Color(0xFFD0D5DD),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(7),
                borderSide: BorderSide(
                  color: invalid
                      ? const Color(0xFFDC2626)
                      : const Color(0xFF1554D1),
                  width: 1.5,
                ),
              ),
            ),
            onChanged: (_) {
              setState(() {});
            },
          );
        },
      ),
    );
  }

  Widget buildAverageCell(int index, double width) {
    return Container(
      width: width,
      height: double.infinity,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: AnimatedBuilder(
        animation: Listenable.merge(
          gradeControllers[index],
        ),
        builder: (context, child) {
          final average = calculateAverage(index);

          return Text(
            average == 0 ? '-' : average.toStringAsFixed(1),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: average < 60 && average != 0
                  ? const Color(0xFFDC2626)
                  : const Color(0xFF1554D1),
            ),
          );
        },
      ),
    );
  }

  Widget buildActionCell(int index, double width) {
    return Container(
      width: width,
      height: double.infinity,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        border: Border(
          right: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            tooltip: 'Edit Student',
            onPressed: () {
              final name =
                  students[index]['name'].toString().trim();

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Editing ${name.isEmpty ? 'student' : name}',
                  ),
                ),
              );
            },
            icon: const Icon(
              Icons.edit_outlined,
              color: Color(0xFF1554D1),
              size: 20,
            ),
          ),
          IconButton(
            tooltip: 'Remove Student',
            onPressed: () {
              removeStudent(index);
            },
            icon: const Icon(
              Icons.delete_outline_rounded,
              color: Color(0xFFDC2626),
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildValidationErrors() {
    final errors = <Map<String, String>>[];

    for (int i = 0; i < students.length; i++) {
      final studentErrors = getValidationErrors(i);

      if (studentErrors.isNotEmpty) {
        final studentName =
            students[i]['name'].toString().trim();

        errors.add({
          'name': studentName.isEmpty
              ? 'Unnamed Student'
              : studentName,
          'error': studentErrors.first,
        });
      }
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFFECACA),
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
                  color: const Color(0xFFFEECEC),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.error_outline_rounded,
                  color: Color(0xFFDC2626),
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Validation Errors',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF991B1B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (errors.isEmpty)
            const Text(
              'No validation errors found.',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF16A34A),
                fontWeight: FontWeight.w600,
              ),
            )
          else
            ...errors.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: Row(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '• ',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFFDC2626),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        '${item['name']}: ${item['error']}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF7F1D1D),
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
  }

  Widget buildActionButtons() {
    final bool disabled = hasValidationErrors;

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: saveDraft,
            icon: const Icon(
              Icons.save_outlined,
              size: 19,
            ),
            label: const Text(
              'Save Draft',
              style: TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF1554D1),
              side: const BorderSide(
                color: Color(0xFF1554D1),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: validateGrades,
            icon: const Icon(
              Icons.verified_outlined,
              size: 19,
            ),
            label: const Text(
              'Validate',
              style: TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF16A34A),
              side: const BorderSide(
                color: Color(0xFF16A34A),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: disabled ? null : submitGrades,
            icon: const Icon(
              Icons.send_outlined,
              size: 19,
            ),
            label: const Text(
              'Submit',
              style: TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1554D1),
              foregroundColor: Colors.white,
              disabledBackgroundColor:
                  const Color(0xFFE4E7EC),
              disabledForegroundColor:
                  const Color(0xFF98A2B3),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ],
    );
  }
}