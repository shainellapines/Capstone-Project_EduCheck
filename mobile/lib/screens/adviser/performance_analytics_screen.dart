import 'package:flutter/material.dart';

class PerformanceAnalyticsScreen extends StatefulWidget {
  const PerformanceAnalyticsScreen({super.key});

  @override
  State<PerformanceAnalyticsScreen> createState() =>
      _PerformanceAnalyticsScreenState();
}

class _PerformanceAnalyticsScreenState
    extends State<PerformanceAnalyticsScreen> {
  String? selectedRecord;
  bool classView = true;

  final List<String> records = [
    'Grade 6 - Sampaguita (2nd Quarter, 2025-2026)',
  ];

  final List<Map<String, dynamic>> students = [
    {
      'name': 'Juan Dela Cruz',
      'lrn': '123456789012',
      'filipino': 88,
      'english': 90,
      'mathematics': 85,
      'science': 87,
      'araling': 89,
      'mapeh': 92,
      'esp': 91,
      'tle': 86,
      'average': 88.50,
      'status': 'On Track',
    },
    {
      'name': 'Maria Santos',
      'lrn': '123456789013',
      'filipino': 72,
      'english': 68,
      'mathematics': 65,
      'science': 70,
      'araling': 73,
      'mapeh': 80,
      'esp': 75,
      'tle': 71,
      'average': 71.75,
      'status': 'At Risk',
      'intervention':
          'Additional reading exercises and vocabulary building activities',
    },
    {
      'name': 'Pedro Garcia',
      'lrn': '123456789014',
      'filipino': 62,
      'english': 60,
      'mathematics': 61,
      'science': 63,
      'araling': 64,
      'mapeh': 75,
      'esp': 70,
      'tle': 65,
      'average': 65.00,
      'status': 'Needs Intervention',
      'intervention':
          'Remedial sessions for English and Mathematics, parent consultation scheduled',
    },
  ];

  final List<Map<String, dynamic>> subjects = [
    {
      'name': 'Filipino',
      'average': 74.0,
      'status': 'Needs Attention',
    },
    {
      'name': 'English',
      'average': 72.7,
      'status': 'Needs Attention',
    },
    {
      'name': 'Mathematics',
      'average': 70.3,
      'status': 'Needs Attention',
    },
    {
      'name': 'Science',
      'average': 73.3,
      'status': 'Needs Attention',
    },
    {
      'name': 'Araling Panlipunan',
      'average': 75.3,
      'status': 'Needs Attention',
    },
    {
      'name': 'MAPEH',
      'average': 82.3,
      'status': 'Satisfactory',
    },
    {
      'name': 'ESP',
      'average': 78.7,
      'status': 'Needs Attention',
    },
    {
      'name': 'TLE',
      'average': 74.0,
      'status': 'Needs Attention',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1554D1),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Performance Analytics',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              buildPageHeader(),
              const SizedBox(height: 18),
              buildRecordSelector(),
              const SizedBox(height: 16),
              if (selectedRecord == null)
                buildEmptyState()
              else
                classView ? buildClassView() : buildStudentView(),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildPageHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Student Performance & Intervention Dashboard',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          'Analytics and intervention tracking for student performance',
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget buildRecordSelector() {
    return Container(
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
          const Text(
            'Select Record',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),

          DropdownButtonFormField<String>(
            value: selectedRecord,
            decoration: InputDecoration(
              hintText: 'Choose a record...',
              hintStyle: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFFD9E0EA),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFFD9E0EA),
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),

            // "Choose a record..." is now an actual dropdown option.
            // Selecting it resets the page back to the default state.
            items: [
              const DropdownMenuItem<String>(
                value: null,
                child: Text(
                  'Choose a record...',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),

              ...records.map((record) {
                return DropdownMenuItem<String>(
                  value: record,
                  child: Text(
                    record,
                    style: const TextStyle(
                      fontSize: 12,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }),
            ],

            onChanged: (value) {
              setState(() {
                selectedRecord = value;

                // When returning to "Choose a record...",
                // reset to Class View as the default view.
                if (value == null) {
                  classView = true;
                }
              });
            },
          ),

          const SizedBox(height: 16),

          const Text(
            'View Mode',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),

          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: buildViewModeButton(
                  title: 'Class View',
                  selected: classView,
                  onTap: () {
                    setState(() {
                      classView = true;
                    });
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: buildViewModeButton(
                  title: 'Student View',
                  selected: !classView,
                  onTap: () {
                    setState(() {
                      classView = false;
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildViewModeButton({
    required String title,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF2864E6) : Colors.white,
          borderRadius: BorderRadius.circular(9),
          border: Border.all(
            color: selected
                ? const Color(0xFF2864E6)
                : const Color(0xFFD9E0EA),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: selected
                ? Colors.white
                : const Color(0xFF111827),
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget buildEmptyState() {
    return Container(
      width: double.infinity,
      height: 330,
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
          Icon(
            Icons.description_outlined,
            size: 60,
            color: Colors.blueGrey.shade200,
          ),
          const SizedBox(height: 18),
          const Text(
            'No Record Selected',
            style: TextStyle(
              fontSize: 18,
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 30),
            child: Text(
              'Please select a record from the dropdown above to view performance analytics.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildClassView() {
    return Column(
      children: [
        buildOverviewStats(),
        const SizedBox(height: 16),
        buildSubjectPerformance(),
        const SizedBox(height: 16),
        buildGradeDistribution(),
        const SizedBox(height: 16),
        buildInterventionList(),
      ],
    );
  }

  Widget buildOverviewStats() {
    return Column(
      children: [
        buildStatCard(
          title: 'Class Average',
          value: '75.08',
          icon: Icons.groups_outlined,
          iconColor: const Color(0xFF2864E6),
          backgroundColor: const Color(0xFFEAF2FF),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: buildSmallStatCard(
                title: 'On Track',
                value: '1',
                icon: Icons.check_circle_outline,
                color: const Color(0xFF16A34A),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: buildSmallStatCard(
                title: 'At Risk',
                value: '1',
                icon: Icons.warning_amber_outlined,
                color: const Color(0xFFD89B00),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: buildSmallStatCard(
                title: 'Needs Intervention',
                value: '1',
                icon: Icons.error_outline,
                color: const Color(0xFFDC2626),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color backgroundColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
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
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 22,
                  color: Color(0xFF1554D1),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildSmallStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
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
          Icon(
            icon,
            color: color,
            size: 20,
          ),
          const SizedBox(height: 6),
          Text(
            title,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 19,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSubjectPerformance() {
    return buildSectionCard(
      title: 'Subject-wise Performance',
      child: Column(
        children: subjects.map((subject) {
          final double average = subject['average'];

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFAFBFD),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject['name'],
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      average.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    Icon(
                      Icons.trending_down_rounded,
                      size: 16,
                      color: average >= 80
                          ? const Color(0xFFD89B00)
                          : const Color(0xFFDC2626),
                    ),
                  ],
                ),
                const SizedBox(height: 7),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: average / 100,
                    minHeight: 7,
                    backgroundColor: const Color(0xFFE5E7EB),
                    valueColor:
                        AlwaysStoppedAnimation<Color>(
                      average >= 80
                          ? const Color(0xFFD89B00)
                          : const Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget buildGradeDistribution() {
    return buildSectionCard(
      title: 'Grade Distribution',
      child: Column(
        children: [
          buildDistributionItem(
            'Outstanding',
            '(90-100)',
            '0',
            const Color(0xFF16A34A),
          ),
          buildDistributionItem(
            'Very Satisfactory',
            '(85-89)',
            '1',
            const Color(0xFF2864E6),
          ),
          buildDistributionItem(
            'Satisfactory',
            '(80-84)',
            '0',
            const Color(0xFFD89B00),
          ),
          buildDistributionItem(
            'Fairly Satisfactory',
            '(75-79)',
            '0',
            const Color(0xFFEA8C2B),
          ),
          buildDistributionItem(
            'Did Not Meet',
            '(Below 75)',
            '2',
            const Color(0xFFDC2626),
          ),
        ],
      ),
    );
  }

  Widget buildDistributionItem(
    String title,
    String range,
    String count,
    Color color,
  ) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: color.withOpacity(0.25),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Text(
              count,
              style: TextStyle(
                color: color,
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  range,
                  style: TextStyle(
                    color: color,
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildInterventionList() {
    final interventionStudents = students
        .where(
          (student) => student['status'] != 'On Track',
        )
        .toList();

    return buildSectionCard(
      title:
          'Intervention List (${interventionStudents.length} students)',
      child: Column(
        children: interventionStudents.map((student) {
          final bool atRisk =
              student['status'] == 'At Risk';

          final Color statusColor = atRisk
              ? const Color(0xFFD89B00)
              : const Color(0xFFDC2626);

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(11),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['name'],
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'LRN: ${student['lrn']}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Text(
                      'Average',
                      style: TextStyle(
                        fontSize: 10,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      student['average'].toStringAsFixed(2),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 7),
                Row(
                  children: [
                    const Text(
                      'Weak Subject',
                      style: TextStyle(
                        fontSize: 10,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      atRisk ? 'English' : 'English & Math',
                      style: TextStyle(
                        fontSize: 10,
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    student['status'],
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (student['intervention'] != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFFED7AA),
                      ),
                    ),
                    child: Text(
                      'Intervention: ${student['intervention']}',
                      style: const TextStyle(
                        color: Color(0xFFC2410C),
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget buildStudentView() {
    return buildSectionCard(
      title: 'Individual Student Performance (3 students)',
      child: Column(
        children: students.map((student) {
          return buildStudentCard(student);
        }).toList(),
      ),
    );
  }

  Widget buildStudentCard(Map<String, dynamic> student) {
    final String status = student['status'];

    final Color statusColor = status == 'On Track'
        ? const Color(0xFF16A34A)
        : status == 'At Risk'
            ? const Color(0xFFD89B00)
            : const Color(0xFFDC2626);

    final List<Map<String, dynamic>> grades = [
      {
        'name': 'Filipino',
        'value': student['filipino'],
      },
      {
        'name': 'English',
        'value': student['english'],
      },
      {
        'name': 'Mathematics',
        'value': student['mathematics'],
      },
      {
        'name': 'Science',
        'value': student['science'],
      },
      {
        'name': 'Araling Panlipunan',
        'value': student['araling'],
      },
      {
        'name': 'MAPEH',
        'value': student['mapeh'],
      },
      {
        'name': 'ESP',
        'value': student['esp'],
      },
      {
        'name': 'TLE',
        'value': student['tle'],
      },
    ];

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
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
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      student['name'],
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'LRN: ${student['lrn']}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'General Average',
                    style: TextStyle(
                      fontSize: 9,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    student['average'].toStringAsFixed(2),
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1554D1),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 2.7,
            ),
            itemCount: grades.length,
            itemBuilder: (context, index) {
              final grade = grades[index];

              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFAFBFD),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFFE2E8F0),
                  ),
                ),
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  mainAxisAlignment:
                      MainAxisAlignment.center,
                  children: [
                    Text(
                      grade['name'],
                      style: const TextStyle(
                        fontSize: 8,
                        color: Color(0xFF64748B),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${grade['value']}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 9,
              vertical: 5,
            ),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: statusColor,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          if (student['intervention'] != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFFFED7AA),
                ),
              ),
              child: Text(
                'Intervention: ${student['intervention']}',
                style: const TextStyle(
                  color: Color(0xFFC2410C),
                  fontSize: 9,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget buildSectionCard({
    required String title,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
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
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}