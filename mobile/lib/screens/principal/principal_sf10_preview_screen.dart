import 'package:flutter/material.dart';

class PrincipalSf10PreviewScreen extends StatelessWidget {
  final Map<String, dynamic> record;

  const PrincipalSf10PreviewScreen({
    super.key,
    required this.record,
  });

  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            16,
            12,
            16,
            24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 20),
              _buildStudentCard(),
              const SizedBox(height: 16),
              _buildSchoolInformation(),
              const SizedBox(height: 16),
              _buildGrades(),
              const SizedBox(height: 16),
              _buildGeneralAverage(),
              const SizedBox(height: 16),
              _buildRecordStatus(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
            ),
          ),
          child: IconButton(
            padding: EdgeInsets.zero,
            onPressed: () {
              Navigator.pop(context);
            },
            icon: const Icon(
              Icons.arrow_back_rounded,
              color: textColor,
              size: 21,
            ),
          ),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'SF10 Preview',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Student permanent record preview.',
                style: TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
            ),
          ),
          child: const Icon(
            Icons.description_outlined,
            color: primaryBlue,
            size: 21,
          ),
        ),
      ],
    );
  }

  Widget _buildStudentCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: primaryBlue,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              color: Colors.white,
              size: 25,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Juan Dela Cruz',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${record['section']} • ${record['schoolYear']}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSchoolInformation() {
    return _buildSectionCard(
      title: 'School Information',
      icon: Icons.school_outlined,
      child: Column(
        children: [
          _buildInfoRow(
            'School',
            'EduCheck Elementary School',
          ),
          _buildInfoRow(
            'School Year',
            record['schoolYear'],
          ),
          _buildInfoRow(
            'Grade Level',
            record['section'].toString().split(' - ').first,
          ),
          _buildInfoRow(
            'Section',
            record['section'].toString().split(' - ').last,
          ),
          _buildInfoRow(
            'Adviser',
            record['adviser'],
          ),
        ],
      ),
    );
  }

  Widget _buildGrades() {
    return _buildSectionCard(
      title: 'Academic Grades',
      icon: Icons.menu_book_outlined,
      child: Column(
        children: [
          _buildGradeRow(
            subject: 'Filipino',
            grade: '89',
          ),
          _buildGradeRow(
            subject: 'English',
            grade: '92',
          ),
          _buildGradeRow(
            subject: 'Mathematics',
            grade: '94',
          ),
          _buildGradeRow(
            subject: 'Science',
            grade: '91',
          ),
          _buildGradeRow(
            subject: 'Araling Panlipunan',
            grade: '90',
          ),
          _buildGradeRow(
            subject: 'Edukasyon sa Pagpapakatao',
            grade: '93',
          ),
          _buildGradeRow(
            subject: 'MAPEH',
            grade: '95',
          ),
        ],
      ),
    );
  }

  Widget _buildGradeRow({
    required String subject,
    required String grade,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: 11,
      ),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              subject,
              style: const TextStyle(
                fontSize: 10,
                color: textColor,
              ),
            ),
          ),
          Container(
            width: 42,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF1FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              grade,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: primaryBlue,
              ),
            ),
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
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Icon(
              Icons.auto_graph_rounded,
              color: Color(0xFF16A34A),
              size: 21,
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
                  '92.0',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: textColor,
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
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Passed',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: Color(0xFF16A34A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordStatus() {
    final status = record['status'];

    Color statusColor;
    Color statusBackground;
    IconData statusIcon;

    if (status == 'Approved') {
      statusColor = const Color(0xFF16A34A);
      statusBackground = const Color(0xFFF0FDF4);
      statusIcon = Icons.check_circle_outline_rounded;
    } else if (status == 'Returned') {
      statusColor = const Color(0xFFDC2626);
      statusBackground = const Color(0xFFFEF2F2);
      statusIcon = Icons.assignment_return_outlined;
    } else {
      statusColor = const Color(0xFFD97706);
      statusBackground = const Color(0xFFFFF7ED);
      statusIcon = Icons.pending_actions_rounded;
    }

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
          Icon(
            statusIcon,
            color: statusColor,
            size: 20,
          ),
          const SizedBox(width: 9),
          const Expanded(
            child: Text(
              'Record Status',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 9,
              vertical: 6,
            ),
            decoration: BoxDecoration(
              color: statusBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status == 'Pending Approval'
                  ? 'Pending'
                  : status,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: statusColor,
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
                  color: const Color(0xFFEAF1FF),
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
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 11),
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
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}