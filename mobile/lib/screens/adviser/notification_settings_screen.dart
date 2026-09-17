import 'package:flutter/material.dart';

class NotificationsSettingsScreen extends StatefulWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  State<NotificationsSettingsScreen> createState() =>
      _NotificationsSettingsScreenState();
}

class _NotificationsSettingsScreenState
    extends State<NotificationsSettingsScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  bool pushNotifications = true;
  bool validationUpdates = true;
  bool submissionUpdates = true;
  bool approvalUpdates = true;
  bool sf10Updates = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: textColor,
          ),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeaderCard(),
              const SizedBox(height: 16),
              _buildGeneralSection(),
              const SizedBox(height: 16),
              _buildActivitySection(),
            ],
          ),
        ),
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
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.notifications_outlined,
              color: primaryBlue,
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Notification Preferences',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Choose which EduCheck updates you want to receive.',
                  style: TextStyle(
                    fontSize: 10,
                    color: secondaryTextColor,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGeneralSection() {
    return _buildSectionCard(
      title: 'General',
      children: [
        _buildSwitchRow(
          icon: Icons.notifications_active_outlined,
          title: 'Push Notifications',
          subtitle: 'Receive notifications from EduCheck',
          value: pushNotifications,
          onChanged: (value) {
            setState(() {
              pushNotifications = value;

              if (!value) {
                validationUpdates = false;
                submissionUpdates = false;
                approvalUpdates = false;
                sf10Updates = false;
              } else {
                validationUpdates = true;
                submissionUpdates = true;
                approvalUpdates = true;
                sf10Updates = true;
              }
            });
          },
        ),
      ],
    );
  }

  Widget _buildActivitySection() {
    return _buildSectionCard(
      title: 'Activity Updates',
      children: [
        _buildSwitchRow(
          icon: Icons.fact_check_outlined,
          title: 'Validation Updates',
          subtitle: 'Get notified about validation results',
          value: validationUpdates,
          onChanged: pushNotifications
              ? (value) {
                  setState(() {
                    validationUpdates = value;
                  });
                }
              : null,
        ),
        _buildDivider(),
        _buildSwitchRow(
          icon: Icons.upload_file_outlined,
          title: 'Submission Updates',
          subtitle: 'Get notified about record submissions',
          value: submissionUpdates,
          onChanged: pushNotifications
              ? (value) {
                  setState(() {
                    submissionUpdates = value;
                  });
                }
              : null,
        ),
        _buildDivider(),
        _buildSwitchRow(
          icon: Icons.verified_outlined,
          title: 'Approval Updates',
          subtitle: 'Get notified when records are approved or returned',
          value: approvalUpdates,
          onChanged: pushNotifications
              ? (value) {
                  setState(() {
                    approvalUpdates = value;
                  });
                }
              : null,
        ),
        _buildDivider(),
        _buildSwitchRow(
          icon: Icons.description_outlined,
          title: 'SF10 Updates',
          subtitle: 'Get notified when SF10 generation is completed',
          value: sf10Updates,
          onChanged: pushNotifications
              ? (value) {
                  setState(() {
                    sf10Updates = value;
                  });
                }
              : null,
        ),
      ],
    );
  }

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 15, 16, 8),
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
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }

  Widget _buildSwitchRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool>? onChanged,
  }) {
    final bool enabled = onChanged != null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              size: 19,
              color: enabled
                  ? secondaryTextColor
                  : const Color(0xFFCBD5E1),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: enabled
                        ? textColor
                        : const Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 10,
                    color: enabled
                        ? secondaryTextColor
                        : const Color(0xFFCBD5E1),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: primaryBlue,
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(
      height: 1,
      thickness: 1,
      color: Color(0xFFF1F5F9),
    );
  }
}