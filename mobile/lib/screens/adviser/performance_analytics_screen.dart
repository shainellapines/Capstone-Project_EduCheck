import 'package:flutter/material.dart';

class PerformanceAnalyticsScreen extends StatefulWidget {
  const PerformanceAnalyticsScreen({super.key});

  @override
  State<PerformanceAnalyticsScreen> createState() =>
      _PerformanceAnalyticsScreenState();
}

class _PerformanceAnalyticsScreenState
    extends State<PerformanceAnalyticsScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

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
    },
    {
      'name': 'English',
      'average': 72.7,
    },
    {
      'name': 'Mathematics',
      'average': 70.3,
    },
    {
      'name': 'Science',
      'average': 73.3,
    },
    {
      'name': 'Araling Panlipunan',
      'average': 75.3,
    },
    {
      'name': 'MAPEH',
      'average': 82.3,
    },
    {
      'name': 'ESP',
      'average': 78.7,
    },
    {
      'name': 'TLE',
      'average': 74.0,
    },
  ];

  int get onTrackCount =>
      students.where((student) => student['status'] == 'On Track').length;

  int get atRiskCount =>
      students.where((student) => student['status'] == 'At Risk').length;

  int get interventionCount => students
      .where((student) => student['status'] == 'Needs Intervention')
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
              _buildClassOverview(),
              const SizedBox(height: 18),
              _buildAnalyticsControls(),
              const SizedBox(height: 18),
              if (selectedRecord == null)
                _buildEmptyState()
              else if (classView)
                _buildClassAnalytics()
              else
                _buildStudentAnalytics(),
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
                'Performance Analytics',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'Monitor student performance and intervention needs.',
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

  Widget _buildClassOverview() {
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
              Icons.analytics_outlined,
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
                  'Student Performance',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Class performance and intervention overview',
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

  Widget _buildAnalyticsControls() {
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
            'Analytics Selection',
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
            _buildViewSelector(),
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
        });
      },
    );
  }

  Widget _buildViewSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'View',
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
              child: _buildViewButton(
                label: 'Class Overview',
                icon: Icons.bar_chart_outlined,
                selected: classView,
                onTap: () {
                  setState(() {
                    classView = true;
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildViewButton(
                label: 'Students',
                icon: Icons.people_outline,
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
    );
  }

  Widget _buildViewButton({
    required String label,
    required IconData icon,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          height: 42,
          decoration: BoxDecoration(
            color: selected
                ? const Color(0xFFEFF6FF)
                : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected
                  ? const Color(0xFF93C5FD)
                  : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: selected ? primaryBlue : secondaryTextColor,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight:
                      selected ? FontWeight.bold : FontWeight.w500,
                  color: selected ? primaryBlue : textColor,
                ),
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
              Icons.analytics_outlined,
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
            'Select a record above to view performance analytics and intervention information.',
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

  Widget _buildClassAnalytics() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPerformanceSummary(),
        const SizedBox(height: 18),
        _buildSectionTitle(
          'Subject Performance',
          'Average performance by learning area',
        ),
        const SizedBox(height: 10),
        _buildSubjectPerformance(),
        const SizedBox(height: 18),
        _buildSectionTitle(
          'Grade Distribution',
          'Students grouped according to their general average',
        ),
        const SizedBox(height: 10),
        _buildGradeDistribution(),
        const SizedBox(height: 18),
        _buildSectionTitle(
          'Students Needing Attention',
          'Students requiring monitoring or intervention',
        ),
        const SizedBox(height: 10),
        _buildInterventionList(),
      ],
    );
  }

  Widget _buildPerformanceSummary() {
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
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Class Performance',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Grade 6 - Sampaguita • 2nd Quarter',
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
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '3 Students',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: primaryBlue,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Container(
                width: 82,
                height: 82,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFFBFDBFE),
                    width: 6,
                  ),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '75.08',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                        color: primaryBlue,
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Average',
                      style: TextStyle(
                        fontSize: 8,
                        color: secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  children: [
                    _buildPerformanceStat(
                      label: 'On Track',
                      value: onTrackCount.toString(),
                      color: const Color(0xFF16A34A),
                    ),
                    const SizedBox(height: 7),
                    _buildPerformanceStat(
                      label: 'At Risk',
                      value: atRiskCount.toString(),
                      color: const Color(0xFFD97706),
                    ),
                    const SizedBox(height: 7),
                    _buildPerformanceStat(
                      label: 'Needs Intervention',
                      value: interventionCount.toString(),
                      color: const Color(0xFFDC2626),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceStat({
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 7),
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
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(
    String title,
    String subtitle,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 10,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectPerformance() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(15, 15, 15, 5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: subjects.map((subject) {
          final double average = subject['average'];

          final Color color = average >= 80
              ? const Color(0xFF16A34A)
              : average >= 75
                  ? const Color(0xFFD97706)
                  : const Color(0xFFDC2626);

          final String status = average >= 80
              ? 'Satisfactory'
              : 'Needs Attention';

          return Padding(
            padding: const EdgeInsets.only(bottom: 15),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        subject['name'],
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: textColor,
                        ),
                      ),
                    ),
                    Text(
                      average.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: average / 100,
                          minHeight: 7,
                          backgroundColor: const Color(0xFFE2E8F0),
                          valueColor:
                              AlwaysStoppedAnimation<Color>(color),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 72,
                      child: Text(
                        status,
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w600,
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildGradeDistribution() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          _buildDistributionRow(
            title: 'Very Satisfactory',
            range: '85 - 89',
            count: 1,
            color: primaryBlue,
          ),
          _buildDistributionRow(
            title: 'Satisfactory',
            range: '80 - 84',
            count: 0,
            color: const Color(0xFF16A34A),
          ),
          _buildDistributionRow(
            title: 'Fairly Satisfactory',
            range: '75 - 79',
            count: 0,
            color: const Color(0xFFD97706),
          ),
          _buildDistributionRow(
            title: 'Did Not Meet Expectations',
            range: 'Below 75',
            count: 2,
            color: const Color(0xFFDC2626),
            last: true,
          ),
        ],
      ),
    );
  }

  Widget _buildDistributionRow({
    required String title,
    required String range,
    required int count,
    required Color color,
    bool last = false,
  }) {
    return Container(
      margin: EdgeInsets.only(bottom: last ? 0 : 8),
      padding: const EdgeInsets.symmetric(
        horizontal: 11,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              count.toString(),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
          Text(
            range,
            style: const TextStyle(
              fontSize: 9,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInterventionList() {
    final List<Map<String, dynamic>> attentionStudents = students
        .where((student) => student['status'] != 'On Track')
        .toList();

    return Column(
      children: attentionStudents.map((student) {
        final bool isAtRisk = student['status'] == 'At Risk';

        final Color color = isAtRisk
            ? const Color(0xFFD97706)
            : const Color(0xFFDC2626);

        final String weakSubjects =
            isAtRisk ? 'English, Mathematics' : 'English, Mathematics';

        return Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(15),
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
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isAtRisk
                          ? Icons.warning_amber_rounded
                          : Icons.priority_high_rounded,
                      color: color,
                      size: 21,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student['name'],
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: textColor,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'LRN: ${student['lrn']}',
                          style: const TextStyle(
                            fontSize: 9,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusChip(
                    student['status'],
                  ),
                ],
              ),
              const SizedBox(height: 13),
              Row(
                children: [
                  Expanded(
                    child: _buildAttentionDetail(
                      'Average',
                      student['average'].toStringAsFixed(2),
                    ),
                  ),
                  Expanded(
                    child: _buildAttentionDetail(
                      'Needs Focus',
                      weakSubjects,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      size: 17,
                      color: color,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        student['intervention'] ??
                            'Continue monitoring student performance.',
                        style: const TextStyle(
                          fontSize: 10,
                          color: secondaryTextColor,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAttentionDetail(
    String label,
    String value,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            color: secondaryTextColor,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ],
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
        icon = Icons.priority_high_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: backgroundColorValue,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 11,
            color: textColorValue,
          ),
          const SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w600,
              color: textColorValue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentAnalytics() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStudentOverview(),
        const SizedBox(height: 18),
        _buildSectionTitle(
          'Individual Student Performance',
          'View grades, averages, and intervention notes',
        ),
        const SizedBox(height: 10),
        ...students.map(
          (student) => _buildStudentCard(student),
        ),
      ],
    );
  }

  Widget _buildStudentOverview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
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
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.people_outline,
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
                  'Student Performance',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Detailed performance for each student',
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
    );
  }

  Widget _buildStudentCard(
    Map<String, dynamic> student,
  ) {
    final String status = student['status'];

    final Color statusColor = status == 'On Track'
        ? const Color(0xFF16A34A)
        : status == 'At Risk'
            ? const Color(0xFFD97706)
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
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
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
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    _getInitials(student['name']),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: primaryBlue,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student['name'],
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'LRN: ${student['lrn']}',
                      style: const TextStyle(
                        fontSize: 9,
                        color: secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'Average',
                    style: TextStyle(
                      fontSize: 9,
                      color: secondaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    student['average'].toStringAsFixed(2),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: primaryBlue,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          _buildStatusChip(status),
          const SizedBox(height: 14),
          const Text(
            'Subject Grades',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 9),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: grades.length,
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 3.0,
            ),
            itemBuilder: (context, index) {
              final grade = grades[index];
              final int value = grade['value'];

              final Color gradeColor = value >= 80
                  ? const Color(0xFF16A34A)
                  : value >= 75
                      ? const Color(0xFFD97706)
                      : const Color(0xFFDC2626);

              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(
                    color: const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        grade['name'],
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 8,
                          color: secondaryTextColor,
                        ),
                      ),
                    ),
                    Text(
                      value.toString(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: gradeColor,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          if (student['intervention'] != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(11),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: const Color(0xFFFED7AA),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.lightbulb_outline,
                    color: Color(0xFFC2410C),
                    size: 17,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      student['intervention'],
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF9A3412),
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getInitials(String name) {
    final List<String> parts = name.split(' ');

    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }

    return name.substring(0, 1).toUpperCase();
  }
}