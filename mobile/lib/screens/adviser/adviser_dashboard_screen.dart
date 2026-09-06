import 'package:flutter/material.dart';

import 'review_queue_screen.dart';
import 'performance_analytics_screen.dart';
import 'upload_files_screen.dart';

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
    'Upload Files',
    'Notifications',
    'Profile',
  ];

  void selectNavigation(int index) {
    setState(() {
      selectedIndex = index;
    });
  }

  void openReviewQueue() {
    setState(() {
      selectedIndex = 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: selectedIndex == 0
            ? buildDashboard()
            : selectedIndex == 1
                ? const ReviewQueueScreen()
                : selectedIndex == 2
                    ? const UploadFilesScreen()
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
        GestureDetector(
          onTap: openReviewQueue,
          child: buildOverviewCard(
            'Pending Validation',
            '1',
            Icons.description_outlined,
            const Color(0xFF1554D1),
            const Color(0xFFEAF2FF),
          ),
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
            'Student Performance Summary',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: buildPerformanceCard(
                  title: 'Total Students',
                  value: '3',
                  icon: Icons.people_outline_rounded,
                  color: const Color(0xFF1554D1),
                  background: const Color(0xFFEAF2FF),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: buildPerformanceCard(
                  title: 'On Track',
                  value: '1',
                  icon: Icons.check_circle_outline,
                  color: const Color(0xFF16A34A),
                  background: const Color(0xFFEAF8EF),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: buildPerformanceCard(
                  title: 'At Risk',
                  value: '1',
                  icon: Icons.warning_amber_rounded,
                  color: const Color(0xFFD89B00),
                  background: const Color(0xFFFFF3CD),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: buildPerformanceCard(
                  title: 'Needs Intervention',
                  value: '1',
                  icon: Icons.error_outline_rounded,
                  color: const Color(0xFFDC2626),
                  background: const Color(0xFFFEECEC),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildPerformanceCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color background,
  }) {
    return Container(
      height: 105,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(
          color: color.withOpacity(0.25),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 20,
                ),
              ),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            title,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget buildInterventionCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFFDE68A),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3CD),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFD89B00),
                  size: 27,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Students Needing Intervention',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF92400E),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '2 students across 1 class require attention',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(13),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.class_outlined,
                  color: Color(0xFF1554D1),
                  size: 22,
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Grade 6 - Sampaguita',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEECEC),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    '1 At Risk',
                    style: TextStyle(
                      color: Color(0xFFDC2626),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3CD),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    '1 Need Intervention',
                    style: TextStyle(
                      color: Color(0xFFD89B00),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 13),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        const PerformanceAnalyticsScreen(),
                  ),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF92400E),
                side: const BorderSide(
                  color: Color(0xFFF59E0B),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
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
            children: [
              const Expanded(
                child: Text(
                  'Recent Records',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              TextButton(
                onPressed: openReviewQueue,
                child: const Text(
                  'View All',
                  style: TextStyle(
                    color: Color(0xFF1554D1),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: openReviewQueue,
            child: buildRecentRecordItem(
              icon: Icons.description_outlined,
              iconBackground: const Color(0xFFEAF2FF),
              iconColor: const Color(0xFF1554D1),
              title: '3rd Quarter Draft',
              subtitle: 'Grade 6 - Sampaguita',
              status: 'Pending Review',
              statusColor: const Color(0xFFD97706),
            ),
          ),
          const Divider(height: 22),
          buildRecentRecordItem(
            icon: Icons.check_circle_outline,
            iconBackground: const Color(0xFFEAF8EF),
            iconColor: const Color(0xFF16A34A),
            title: '2nd Quarter Submitted',
            subtitle: 'Grade 6 - Sampaguita',
            status: 'Submitted',
            statusColor: const Color(0xFF16A34A),
          ),
        ],
      ),
    );
  }

  Widget buildRecentRecordItem({
    required IconData icon,
    required Color iconBackground,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String status,
    required Color statusColor,
  }) {
    return Row(
      children: [
        Container(
          width: 45,
          height: 45,
          decoration: BoxDecoration(
            color: iconBackground,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: iconColor,
            size: 24,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12,
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
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
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
      ],
    );
  }

  Widget buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        buildSectionTitle('Quick Actions'),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.5,
          children: [
            buildQuickActionCard(
              'Encode Grades',
              Icons.edit_note_rounded,
              const Color(0xFF1554D1),
              const Color(0xFFEAF2FF),
            ),
            buildQuickActionCard(
              'Upload Files',
              Icons.upload_file_outlined,
              const Color(0xFF7C3AED),
              const Color(0xFFF3E8FF),
            ),
            buildQuickActionCard(
              'Consolidated Records',
              Icons.folder_copy_outlined,
              const Color(0xFF0891B2),
              const Color(0xFFE6F8FC),
            ),
            buildQuickActionCard(
              'Performance Analytics',
              Icons.analytics_outlined,
              const Color(0xFF16A34A),
              const Color(0xFFEAF8EF),
            ),
          ],
        ),
      ],
    );
  }

  Widget buildQuickActionCard(
    String title,
    IconData icon,
    Color color,
    Color background,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
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
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: color,
              size: 25,
            ),
          ),
          const SizedBox(height: 9),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
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
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(
              navigationLabels.length,
              (index) => buildNavigationItem(
                index,
                navigationLabels[index],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget buildNavigationItem(
    int index,
    String label,
  ) {
    final bool selected = selectedIndex == index;

    final List<IconData> icons = [
      Icons.home_rounded,
      Icons.description_outlined,
      Icons.cloud_upload_rounded,
      Icons.notifications_none_rounded,
      Icons.person_outline_rounded,
    ];

    return GestureDetector(
      onTap: () => selectNavigation(index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        height: 60,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: selected
                        ? const Color(0xFFEAF2FF)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icons[index],
                    color: selected
                        ? const Color(0xFF1554D1)
                        : const Color(0xFF64748B),
                    size: 24,
                  ),
                ),
                if (index == 3)
                  Positioned(
                    right: -2,
                    top: -3,
                    child: Container(
                      width: 16,
                      height: 16,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDC2626),
                        shape: BoxShape.circle,
                      ),
                      child: const Text(
                        '2',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 8,
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

    return Column(
      children: [
        Container(
          width: double.infinity,
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          color: const Color(0xFF1554D1),
          alignment: Alignment.centerLeft,
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: Center(
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
        ),
      ],
    );
  }
}