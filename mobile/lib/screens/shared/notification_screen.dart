import 'package:flutter/material.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  int selectedFilter = 0;

  final List<_NotificationItem> notifications = [
    _NotificationItem(
      icon: Icons.fact_check_outlined,
      title: 'Record Ready for Review',
      message:
          'The 3rd Quarter record for Grade 6 - Sampaguita is ready for your review.',
      time: '10 min ago',
      type: 'Review',
      iconColor: Color(0xFFD97706),
      iconBackground: Color(0xFFFFF7ED),
      unread: true,
    ),
    _NotificationItem(
      icon: Icons.warning_amber_rounded,
      title: 'Student Needs Attention',
      message:
          'Pedro Garcia has been identified as needing academic intervention.',
      time: '1 hour ago',
      type: 'Student',
      iconColor: Color(0xFFDC2626),
      iconBackground: Color(0xFFFEF2F2),
      unread: true,
    ),
    _NotificationItem(
      icon: Icons.check_circle_outline_rounded,
      title: 'Validation Completed',
      message:
          'The 2nd Quarter record for Grade 6 - Sampaguita has passed validation.',
      time: '3 hours ago',
      type: 'Validation',
      iconColor: Color(0xFF16A34A),
      iconBackground: Color(0xFFF0FDF4),
      unread: false,
    ),
    _NotificationItem(
      icon: Icons.description_outlined,
      title: 'Record Submitted',
      message:
          'The 1st Quarter record for Grade 6 - Sampaguita was successfully submitted.',
      time: 'Yesterday',
      type: 'Submission',
      iconColor: primaryBlue,
      iconBackground: Color(0xFFEAF1FF),
      unread: false,
    ),
    _NotificationItem(
      icon: Icons.article_outlined,
      title: 'SF10 Preview Available',
      message:
          'A generated SF10 preview is available for your review before formal submission.',
      time: '2 days ago',
      type: 'SF10',
      iconColor: Color(0xFF7C3AED),
      iconBackground: Color(0xFFF5F3FF),
      unread: true,
    ),
  ];

  int get unreadCount {
    return notifications.where((notification) => notification.unread).length;
  }

  List<_NotificationItem> get filteredNotifications {
    if (selectedFilter == 1) {
      return notifications
          .where((notification) => notification.unread)
          .toList();
    }

    return notifications;
  }

  void _markAsRead(_NotificationItem notification) {
    if (!notification.unread) {
      return;
    }

    setState(() {
      notification.unread = false;
    });
  }

  void _markAllAsRead() {
    setState(() {
      for (final notification in notifications) {
        notification.unread = false;
      }
    });
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
            _buildUnreadSummary(),
            const SizedBox(height: 20),
            _buildFilterTabs(),
            const SizedBox(height: 16),
            if (filteredNotifications.isEmpty)
              _buildEmptyState()
            else
              ...filteredNotifications.asMap().entries.map(
                (entry) {
                  final notification = entry.value;

                  return Padding(
                    padding: EdgeInsets.only(
                      bottom:
                          entry.key == filteredNotifications.length - 1
                              ? 0
                              : 10,
                    ),
                    child: _buildNotificationCard(notification),
                  );
                },
              ),
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
          'Notifications',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'Stay updated with your records and class activities.',
          style: TextStyle(
            fontSize: 12,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildUnreadSummary() {
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
              color: const Color(0xFFEAF1FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.notifications_active_outlined,
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
                  unreadCount == 0
                      ? 'All caught up'
                      : '$unreadCount unread notification${unreadCount == 1 ? '' : 's'}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  unreadCount == 0
                      ? 'You have no new notifications.'
                      : 'Review your latest EduCheck updates.',
                  style: const TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              style: TextButton.styleFrom(
                foregroundColor: primaryBlue,
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 6,
                ),
              ),
              child: const Text(
                'Mark all read',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF3F8),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          _buildFilterButton(
            label: 'All',
            index: 0,
          ),
          _buildFilterButton(
            label: 'Unread',
            index: 1,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton({
    required String label,
    required int index,
  }) {
    final bool isSelected = selectedFilter == index;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            selectedFilter = index;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    const BoxShadow(
                      color: Color(0x12000000),
                      blurRadius: 4,
                      offset: Offset(0, 1),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected ? primaryBlue : secondaryTextColor,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationCard(_NotificationItem notification) {
    return GestureDetector(
      onTap: () => _markAsRead(notification),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: notification.unread
              ? const Color(0xFFFDFEFF)
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: notification.unread
                ? const Color(0xFFBFDBFE)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: notification.iconBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                notification.icon,
                color: notification.iconColor,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: notification.unread
                                ? FontWeight.bold
                                : FontWeight.w600,
                            color: textColor,
                          ),
                        ),
                      ),
                      if (notification.unread)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(
                            left: 8,
                            top: 4,
                          ),
                          decoration: const BoxDecoration(
                            color: primaryBlue,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    notification.message,
                    style: const TextStyle(
                      fontSize: 10,
                      height: 1.4,
                      color: secondaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 9),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: notification.iconBackground,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          notification.type,
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w600,
                            color: notification.iconColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.access_time_rounded,
                        size: 12,
                        color: Color(0xFF94A3B8),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        notification.time,
                        style: const TextStyle(
                          fontSize: 9,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
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
        horizontal: 24,
        vertical: 40,
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
            Icons.notifications_none_rounded,
            size: 44,
            color: Color(0xFF94A3B8),
          ),
          SizedBox(height: 12),
          Text(
            'No unread notifications',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'You are all caught up for now.',
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
}

class _NotificationItem {
  final IconData icon;
  final String title;
  final String message;
  final String time;
  final String type;
  final Color iconColor;
  final Color iconBackground;
  bool unread;

  _NotificationItem({
    required this.icon,
    required this.title,
    required this.message,
    required this.time,
    required this.type,
    required this.iconColor,
    required this.iconBackground,
    required this.unread,
  });
}