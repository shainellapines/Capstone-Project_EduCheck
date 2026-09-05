import 'package:flutter/material.dart';

class AdviserDashboardScreen extends StatefulWidget {
  const AdviserDashboardScreen({super.key});

  @override
  State<AdviserDashboardScreen> createState() =>
      _AdviserDashboardScreenState();
}

class _AdviserDashboardScreenState
    extends State<AdviserDashboardScreen> {
  int selectedIndex = 0;

  final List<String> navigationLabels = [
    'Home',
    'Records',
    'Students',
    'Notifications',
    'Profile',
  ];

  void selectNavigation(int index) {
    setState(() {
      selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: selectedIndex == 0
            ? buildDashboard()
            : buildPlaceholderPage(
                navigationLabels[selectedIndex],
              ),
      ),
      bottomNavigationBar: buildBottomNavigationBar(),
    );
  }

  Widget buildDashboard() {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: buildHeader(),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                buildWelcomeCard(),
                const SizedBox(height: 24),
                buildSectionTitle('Overview'),
                const SizedBox(height: 12),
                buildOverview(),
                const SizedBox(height: 24),
                buildSectionTitle('Performance Summary'),
                const SizedBox(height: 12),
                buildPerformanceSummary(),
                const SizedBox(height: 18),
                buildInterventionCard(),
                const SizedBox(height: 18),
                buildRecentRecords(),
                const SizedBox(height: 18),
                buildQuickActions(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget buildHeader() {
    return Container(
      height: 145,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF1554D1),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          IconButton(
            onPressed: () {},
            icon: const Icon(
              Icons.menu_rounded,
              color: Colors.white,
              size: 34,
            ),
          ),
          const SizedBox(width: 4),
          const Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'EduCheck',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 25,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Academic Records',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(
                Icons.notifications_none_rounded,
                color: Colors.white,
                size: 32,
              ),
              Positioned(
                right: -4,
                top: -8,
                child: Container(
                  width: 22,
                  height: 22,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDC2626),
                    shape: BoxShape.circle,
                  ),
                  child: const Text(
                    '2',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: const BoxDecoration(
              color: Color(0xFFEAF2FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              color: Color(0xFF1554D1),
              size: 43,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome, Maria Santos',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Adviser (Homeroom Teacher)',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Grade 6 - Sampaguita',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 9,
            ),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF8EF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.verified_user_outlined,
                  color: Color(0xFF16A34A),
                  size: 18,
                ),
                SizedBox(width: 5),
                Text(
                  'Adviser',
                  style: TextStyle(
                    color: Color(0xFF16A34A),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget buildOverview() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.25,
      children: [
        buildOverviewCard(
          'Pending Validation',
          '1',
          Icons.description_outlined,
          const Color(0xFF1554D1),
          const Color(0xFFEAF2FF),
        ),
        buildOverviewCard(
          'Ready to Submit',
          '0',
          Icons.check_circle_outline,
          const Color(0xFF16A34A),
          const Color(0xFFEAF8EF),
        ),
        buildOverviewCard(
          'Submitted',
          '1',
          Icons.send_outlined,
          const Color(0xFF7C3AED),
          const Color(0xFFF3E8FF),
        ),
        buildOverviewCard(
          'Needs Attention',
          '0',
          Icons.error_outline,
          const Color(0xFFDC2626),
          const Color(0xFFFEECEC),
        ),
      ],
    );
  }

  Widget buildOverviewCard(
    String title,
    String value,
    IconData icon,
    Color color,
    Color background,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              color: color,
              size: 25,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 23,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildPerformanceSummary() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.65,
      children: [
        buildPerformanceCard(
          'Total Students',
          '3',
          Icons.people_outline_rounded,
          const Color(0xFF1554D1),
          const Color(0xFFEAF2FF),
        ),
        buildPerformanceCard(
          'On Track',
          '1',
          Icons.check_circle_outline,
          const Color(0xFF16A34A),
          const Color(0xFFEAF8EF),
        ),
        buildPerformanceCard(
          'At Risk',
          '1',
          Icons.warning_amber_outlined,
          const Color(0xFFD18A00),
          const Color(0xFFFFF6DD),
        ),
        buildPerformanceCard(
          'Needs Intervention',
          '1',
          Icons.cancel_outlined,
          const Color(0xFFDC2626),
          const Color(0xFFFEECEC),
        ),
      ],
    );
  }

  Widget buildPerformanceCard(
    String title,
    String value,
    IconData icon,
    Color color,
    Color background,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background.withOpacity(0.45),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.25),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              color: color,
              size: 26,
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: TextStyle(
                    color: color,
                    fontSize: 24,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildInterventionCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8F2),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFFFC7A3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFFC2410C),
                size: 24,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Students Needing Intervention',
                  style: TextStyle(
                    color: Color(0xFF9A3412),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          const Text(
            '2 students across 1 class require attention',
            style: TextStyle(
              color: Color(0xFFC2410C),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(
                color: const Color(0xFFFFD5BC),
              ),
            ),
            child: const Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Grade 6 - Sampaguita',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 7),
                      Text(
                        '1 At Risk   •   1 Need Intervention',
                        style: TextStyle(
                          color: Color(0xFFC2410C),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: Color(0xFF475569),
                  size: 27,
                ),
              ],
            ),
          ),
          const SizedBox(height: 11),
          SizedBox(
            width: double.infinity,
            height: 45,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF04400),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
              child: const Text(
                'View Details',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildRecentRecords() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Records',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  selectNavigation(1);
                },
                child: const Text(
                  'View All',
                  style: TextStyle(
                    color: Color(0xFF1554D1),
                  ),
                ),
              ),
            ],
          ),
          buildRecordItem(
            'Grade 6 - Sampaguita',
            '3rd Quarter  •  2025-2026  •  0 students',
            'Draft',
            const Color(0xFFD18A00),
            const Color(0xFFFFF6DD),
          ),
          const SizedBox(height: 8),
          buildRecordItem(
            'Grade 6 - Sampaguita',
            '2nd Quarter  •  2025-2026  •  3 students',
            'Submitted',
            const Color(0xFF7C3AED),
            const Color(0xFFF3E8FF),
          ),
        ],
      ),
    );
  }

  Widget buildRecordItem(
    String title,
    String subtitle,
    String status,
    Color statusColor,
    Color statusBackground,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
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
              color: statusBackground,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: statusColor,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Icon(
            Icons.chevron_right,
            color: Color(0xFF64748B),
          ),
        ],
      ),
    );
  }

  Widget buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              buildQuickAction(
                Icons.note_alt_outlined,
                'Encode Grades',
                'Input student grades by section',
                const Color(0xFF1554D1),
                const Color(0xFFEAF2FF),
              ),
              const SizedBox(width: 8),
              buildQuickAction(
                Icons.upload_outlined,
                'Upload Files',
                'Import multiple subject files',
                const Color(0xFF7C3AED),
                const Color(0xFFF3E8FF),
              ),
              const SizedBox(width: 8),
              buildQuickAction(
                Icons.table_chart_outlined,
                'Consolidated Records',
                'View merged student data',
                const Color(0xFF16A34A),
                const Color(0xFFEAF8EF),
              ),
              const SizedBox(width: 8),
              buildQuickAction(
                Icons.bar_chart_outlined,
                'Performance Analytics',
                'View student analytics',
                const Color(0xFFC2410C),
                const Color(0xFFFFF1E8),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildQuickAction(
    IconData icon,
    String title,
    String subtitle,
    Color color,
    Color background,
  ) {
    return Expanded(
      child: Container(
        height: 170,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: background.withOpacity(0.45),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(
            color: color.withOpacity(0.18),
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: color,
                size: 25,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: color,
                fontSize: 9,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 5,
            vertical: 8,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              buildNavigationItem(
                0,
                Icons.home_rounded,
                'Home',
              ),
              buildNavigationItem(
                1,
                Icons.description_outlined,
                'Records',
              ),
              buildNavigationItem(
                2,
                Icons.people_outline_rounded,
                'Students',
              ),
              buildNavigationItem(
                3,
                Icons.notifications_none_rounded,
                'Notifications',
              ),
              buildNavigationItem(
                4,
                Icons.person_outline_rounded,
                'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildNavigationItem(
    int index,
    IconData icon,
    String label,
  ) {
    final selected = selectedIndex == index;

    return GestureDetector(
      onTap: () => selectNavigation(index),
      child: Container(
        width: 67,
        padding: const EdgeInsets.symmetric(
          vertical: 7,
          horizontal: 3,
        ),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFFEAF2FF)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  size: 27,
                  color: selected
                      ? const Color(0xFF1554D1)
                      : const Color(0xFF64748B),
                ),
                if (index == 3)
                  Positioned(
                    right: -7,
                    top: -7,
                    child: Container(
                      width: 19,
                      height: 19,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDC2626),
                        shape: BoxShape.circle,
                      ),
                      child: const Text(
                        '2',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: selected
                    ? const Color(0xFF1554D1)
                    : const Color(0xFF64748B),
                fontSize: 10,
                fontWeight: selected
                    ? FontWeight.w600
                    : FontWeight.w400,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget buildPlaceholderPage(String title) {
    IconData icon;

    switch (title) {
      case 'Records':
        icon = Icons.description_outlined;
        break;
      case 'Students':
        icon = Icons.people_outline_rounded;
        break;
      case 'Notifications':
        icon = Icons.notifications_none_rounded;
        break;
      case 'Profile':
        icon = Icons.person_outline_rounded;
        break;
      default:
        icon = Icons.home_rounded;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1554D1),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(
                icon,
                size: 48,
                color: const Color(0xFF1554D1),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Screen UI coming next',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}