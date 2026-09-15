import 'package:flutter/material.dart';
import 'subject_dashboard_screen.dart';
import 'subject_encoding_screen.dart';

class ValidationResultScreen extends StatefulWidget {
  const ValidationResultScreen({super.key});

  @override
  State<ValidationResultScreen> createState() =>
      _ValidationResultScreenState();
}

class _ValidationResultScreenState
    extends State<ValidationResultScreen> {
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
                    buildRecordCard(
                      quarter: '3rd Quarter',
                      schoolYear: '2025-2026',
                      status: 'Draft',
                      completed: '0/0',
                      missing: '0',
                      invalid: '0',
                      duplicates: '0',
                      crossFile: '0',
                      readyText: 'Submission Ready',
                      readyStatus: 'Not Ready',
                      showReviseButton: true,
                    ),
                    const SizedBox(height: 18),
                    buildRecordCard(
                      quarter: '2nd Quarter',
                      schoolYear: '2025-2026',
                      status: 'Submitted',
                      completed: '30/30',
                      missing: '0',
                      invalid: '0',
                      duplicates: '0',
                      crossFile: '0',
                      readyText: 'Submission Ready',
                      readyStatus: 'Not Ready',
                      showReviseButton: false,
                      submittedText:
                          'Submitted on 4/8/2026, 10:30:00 AM',
                    ),
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
        'Validation Results',
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget buildTitleSection() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Validation Results',
          style: TextStyle(
            fontSize: 23,
            fontWeight: FontWeight.bold,
            color: Color(0xFF101828),
          ),
        ),
        SizedBox(height: 6),
        Text(
          'Review validation status of your academic records',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF667085),
          ),
        ),
      ],
    );
  }

  Widget buildRecordCard({
    required String quarter,
    required String schoolYear,
    required String status,
    required String completed,
    required String missing,
    required String invalid,
    required String duplicates,
    required String crossFile,
    required String readyText,
    required String readyStatus,
    required bool showReviseButton,
    String? submittedText,
  }) {
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Grade 6 - Sampaguita',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF101828),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      '$quarter • $schoolYear',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF667085),
                      ),
                    ),
                  ],
                ),
              ),
              buildStatusChip(status),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: buildValidationItem(
                  icon: Icons.check_circle_outline,
                  iconColor: const Color(0xFF16A34A),
                  title: 'Completed',
                  value: completed,
                  background: const Color(0xFFEAF8EF),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: buildValidationItem(
                  icon: Icons.warning_amber_rounded,
                  iconColor: const Color(0xFFD97706),
                  title: 'Missing',
                  value: missing,
                  background: const Color(0xFFFFFBEB),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: buildValidationItem(
                  icon: Icons.cancel_outlined,
                  iconColor: const Color(0xFFDC2626),
                  title: 'Invalid',
                  value: invalid,
                  background: const Color(0xFFFEECEC),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: buildValidationItem(
                  icon: Icons.warning_amber_rounded,
                  iconColor: const Color(0xFFD97706),
                  title: 'Duplicates',
                  value: duplicates,
                  background: const Color(0xFFFFFBEB),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          buildValidationItem(
            icon: Icons.warning_amber_rounded,
            iconColor: const Color(0xFFD97706),
            title: 'Cross-File',
            value: crossFile,
            background: const Color(0xFFFFFBEB),
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    readyText,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF344054),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEECEC),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    readyStatus,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (showReviseButton) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          const SubjectEncodingScreen(),
                    ),
                  );
                },
                icon: const Icon(
                  Icons.edit_outlined,
                  size: 20,
                ),
                label: const Text(
                  'Revise Record',
                  style: TextStyle(
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
          ],
          if (submittedText != null) ...[
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle_outline,
                    color: Color(0xFF1554D1),
                    size: 21,
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      submittedText,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF475467),
                        fontWeight: FontWeight.w500,
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

  Widget buildValidationItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
    required Color background,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: iconColor,
            size: 21,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 11,
                color: iconColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: iconColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildStatusChip(String status) {
    final bool isSubmitted = status == 'Submitted';

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: isSubmitted
            ? const Color(0xFFEAF8EF)
            : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: isSubmitted
              ? const Color(0xFF16A34A)
              : const Color(0xFF64748B),
          fontSize: 11,
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
                  onTap: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const SubjectEncodingScreen(),
                      ),
                    );
                  },
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.edit_note_outlined,
                        size: 23,
                        color: Color(0xFF667085),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Subject Encoding',
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
                        Icons.verified,
                        size: 23,
                        color: Color(0xFF1554D1),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Validation Result',
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
            ],
          ),
        ),
      ),
    );
  }
}